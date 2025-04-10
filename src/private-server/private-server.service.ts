import { ClientProxy } from '@nestjs/microservices';
import { ICustodyKeyPairResponse, IGenerateKeyPairResponse } from 'rox-custody_common-modules/libs/interfaces/generate-ket-pair.interface';
import {
  _EventPatterns,
  _MessagePatterns,
} from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { firstValueFrom } from 'rxjs';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerQueue } from 'src/libs/rmq/private-server.decorator';
import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { BackupStorageIntegrationService } from 'src/backup-storage-integration/backup-storage-integration.service';
import { backupStorageConnectionTypes, IRequestDataFromApiApproval } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';
import { SCMNotConnection } from 'rox-custody_common-modules/libs/custom-errors/scm-not-connected.exception';
import { getApiApprovalUrl, getEnvFolderName } from 'rox-custody_common-modules/libs/utils/api-approval';
import { configs } from 'src/configs/configs';

@TenantService()
export class PrivateServerService {
  constructor(
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
    private readonly backupStorageIntegrationService: BackupStorageIntegrationService
  ) { }

  private splitKeyForBackupStorages(
    key: string,
    backupStoragesIds: number[],
  ) {
    const backupStorageParts: { backupStorageId: number; privateKeySlice: string }[] = [];

    if (backupStoragesIds.length > 0) {
      let remainingKey = key;

      for (let i = 0; i < backupStoragesIds.length; i++) {
        const isLastStorage = i === backupStoragesIds.length - 1;
        const currentSplitSize = isLastStorage
          ? remainingKey.length
          : Math.ceil(remainingKey.length / (backupStoragesIds.length - i));

        const part = remainingKey.substring(0, currentSplitSize);
        remainingKey = remainingKey.substring(currentSplitSize);

        backupStorageParts.push({
          backupStorageId: backupStoragesIds[i],
          privateKeySlice: part
        });
      }
    }

    return backupStorageParts;
  }

  async generateKeyPair(
    payload: GenerateKeyPairBridge,
  ): Promise<ICustodyKeyPairResponse> {
    const { corporateId, vaultId } = payload;

    const key = await firstValueFrom(
      this.privateServerQueue.send<IGenerateKeyPairResponse>(
        { cmd: _MessagePatterns.generateKey },
        payload,
      ),
    );

    const keysParts = this.splitKeyForBackupStorages(
      key.backupStoragesPart,
      payload.apiApprovalEssential.backupStoragesIds,
    );

    // publish only if this is key for vault in the other cases it it will store the full key in the private server
    if (keysParts.length) {
      const backupStorages = await this.backupStorageIntegrationService.getBackupStoragesInfo(
        keysParts.map((keyPart) => keyPart.backupStorageId),
        true,
      );

      // Make sure all have an active session
      const backupStoragesWithNoActiveSession = backupStorages.filter(
        (backupStorage) =>
          !backupStorage.activeSessions ||
          backupStorage.activeSessions.length === 0
      );

      if (backupStoragesWithNoActiveSession.length) {
        throw new SCMNotConnection(
          {
            backupStoragesIds: backupStoragesWithNoActiveSession.map(
              (backupStorage) => backupStorage.id
            ),
          }
        );
      }

      // store the key to the Api Approval
      await Promise.all(
        keysParts.map(async ({ backupStorageId, privateKeySlice }, index) => {
          const backupStorage = backupStorages.find(
            (backupStorage) => backupStorage.id === backupStorageId
          );

          if (!backupStorage) {
            throw new Error(`Backup storage with id ${backupStorageId} not found`);
          }

          const folderName = getEnvFolderName(
            corporateId,
            vaultId,
            configs.NODE_ENV,
          );

          await this.backupStorageIntegrationService.storeKeyToApiApproval({
            url: getApiApprovalUrl(
              backupStorage.url,
              backupStorageConnectionTypes.setKey,
              folderName,
            ),
            sliceIndex: index,
            privateKeySlice,
            activeSessions: backupStorage.activeSessions.map(
              (activeSession) => activeSession.sessionKey
            ),
            backupStorageId,
            privateKeyId: key.keyId,
          });
        })
      )
    }

    return {
      address: key.address,
      keyId: key.keyId
    }
  }
}
