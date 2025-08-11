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
import { SCMNotConnected } from 'rox-custody_common-modules/libs/custom-errors/scm-not-connected.exception';
import { getApiApprovalUrl, getEnvFolderName } from 'rox-custody_common-modules/libs/utils/api-approval';
import { configs } from 'src/configs/configs';
import { CustodyLogger } from 'rox-custody_common-modules/libs/services/logger/custody-logger.service';
import { cleanUpPrivateKeyDto } from 'rox-custody_common-modules/libs/dtos/clean-up-private-key.dto';
import { BadRequestException } from '@nestjs/common';

@TenantService()
export class PrivateServerService {
  constructor(
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
    private readonly backupStorageIntegrationService: BackupStorageIntegrationService,
    private readonly logger: CustodyLogger,
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

  private checkAllHaveActiveSessions(
    backupStorages: { activeSessions: any[], id: number }[],
  ) {
    const backupStoragesWithNoActiveSession = backupStorages.filter(
      (backupStorage) =>
        !backupStorage.activeSessions || backupStorage.activeSessions.length === 0
    );

    if (backupStoragesWithNoActiveSession.length) {
      throw new SCMNotConnected(
        {
          backupStoragesIds: backupStoragesWithNoActiveSession.map(
            (backupStorage) => backupStorage.id
          ),
        }
      );
    }
  }

  async generateKeyPair(
    payload: GenerateKeyPairBridge,
  ): Promise<ICustodyKeyPairResponse> {
    const { corporateId, vaultId } = payload;

    this.logger.info(`[BRIDGE] generateKey: ${JSON.stringify(payload)}`);
    const key = await firstValueFrom(
      this.privateServerQueue.send<IGenerateKeyPairResponse>(
        { cmd: _MessagePatterns.generateKey },
        payload,
      ),
    );

    this.logger.info(`[BRIDGE] generateKey result: ${JSON.stringify(key)}`);

    if (key.alreadyGenerated)
      return key;

    const keysParts = this.splitKeyForBackupStorages(
      key.backupStoragesPart,
      payload.apiApprovalEssential.backupStoragesIds,
    );

    // publish only if this is key for vault in the other cases it it will store the full key in the private server
    if (keysParts.length) {
      try {
        const backupStorages = await this.backupStorageIntegrationService.getBackupStoragesInfo(
          keysParts.map((keyPart) => keyPart.backupStorageId),
          corporateId,
          true,
        );

        this.checkAllHaveActiveSessions(backupStorages);

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
              backupStorageId,
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
      } catch (error) {
        this.logger.error(
          `Error while storing key to Api Approval: ${error.message}`,
          { stack: error.stack },
        );
        const rollbackBody: cleanUpPrivateKeyDto = { keyId: key.keyId };
        this.privateServerQueue.emit(
          { cmd: _EventPatterns.rollbackKeyGeneration },
          rollbackBody,
        )
        throw new BadRequestException(
          'Error while storing key to Api Approval',
        );
      }
    }

    return {
      address: key.address,
      keyId: key.keyId,
      eoaAddress: key.eoaAddress,
    }
  }
}
