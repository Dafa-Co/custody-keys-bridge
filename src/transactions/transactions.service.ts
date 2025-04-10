import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import {
  PrivateServerSignTransactionDto,
} from 'rox-custody_common-modules/libs/interfaces/sign-transaction.interface';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { ClientProxy } from '@nestjs/microservices';
import { PrivateServerQueue } from 'src/libs/rmq/private-server.decorator';
import { firstValueFrom, Observable } from 'rxjs';
import {
  CustodySignedTransaction,
} from 'rox-custody_common-modules/libs/interfaces/custom-signed-transaction.type';
import { SignTransactionThoughtBridge } from 'rox-custody_common-modules/libs/interfaces/sign-transaction-throght-bridge.interface';
import { BackupStorageIntegrationService } from 'src/backup-storage-integration/backup-storage-integration.service';
import { IRequestDataFromApiApproval } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';
import { CustodyLogger } from 'rox-custody_common-modules/libs/services/logger/custody-logger.service';
import { SignContractTransactionDto } from 'rox-custody_common-modules/libs/interfaces/sign-contract-transaction.interface';
import { ICustodySignedContractTransaction } from 'rox-custody_common-modules/libs/interfaces/contract-transaction.interface';
import { SCMNotConnection } from 'rox-custody_common-modules/libs/custom-errors/scm-not-connected.exception';
import { BackupStorage } from 'src/backup-storage-integration/entities/backup-storage.entity';
import { getEnvFolderName } from 'rox-custody_common-modules/libs/utils/api-approval';
import { configs } from 'src/configs/configs';
import { AssetType } from 'rox-custody_common-modules/libs/entities/asset.entity';
import { BACKUP_STORAGE_PRIVATE_KEY_INDEX_BREAKER } from 'src/backup-storage-integration/constants/backup-storage.constants';

@TenantService()
export class TransactionsService {
  constructor(
    private readonly contextRabbitMQService: ContextualRabbitMQService,
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
    private readonly backupStorageIntegrationService: BackupStorageIntegrationService,
    private readonly logger: CustodyLogger,
  ) { }

  private async getSignedTransactionFromPrivateServer(
    privateServerSignTransaction: PrivateServerSignTransactionDto,
  ) {
    return await firstValueFrom(
      this.privateServerQueue.send<CustodySignedTransaction>(
        { cmd: _MessagePatterns.signTransaction },
        privateServerSignTransaction,
      ),
    );
  }

  private checkAllHaveActiveSessions(backupStorages: BackupStorage[]) {
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
  }

  private async getKeyFromApiApprovalForSigning(
    dto: SignTransactionThoughtBridge,
  ): Promise<string> {
    const { signTransaction, requestFromApiApproval: { backupStoragesIds } } = dto;

    if (!backupStoragesIds?.length) {
      return '';
    }

    const backupStorageInfo = await this.backupStorageIntegrationService.getBackupStoragesInfo(
      backupStoragesIds,
      true,
    );
    this.checkAllHaveActiveSessions(backupStorageInfo);

    const keyPartsResponses = await Promise.allSettled(
      backupStorageInfo.map((backupStorage) => {
        const folderName = getEnvFolderName(
          backupStorage.corporateId,
          signTransaction.vaultId,
          configs.NODE_ENV,
        );

        return this.backupStorageIntegrationService.getKeyFromApiApproval({
          activeSessions: backupStorage.activeSessions.map(({ sessionKey }) => sessionKey),
          folderName,
          backupStorageId: backupStorage.id,
          privateKeyId: signTransaction.keyId,
          url: backupStorage.url,
        })
      }));

    // Get all failed requests and if type of scm not connected then prepare to throw that error, other errors throw bad request
    const failedRequests = keyPartsResponses.filter(
      (response) => response.status === 'rejected'
    ) as PromiseRejectedResult[];
    const failedRequestsWithSCMNotConnected = failedRequests.filter(
      (response) => response.reason instanceof SCMNotConnection
    ) as PromiseRejectedResult[];
    if (failedRequestsWithSCMNotConnected.length) {
      throw new SCMNotConnection(
        {
          backupStoragesIds: failedRequestsWithSCMNotConnected.flatMap(
            (response) => response.reason?.backupStoragesIds
          ),
        }
      );
    }

    const keyParts = keyPartsResponses
      .map((response) => {
        const fulfilledResponse = response as PromiseFulfilledResult<string>;
        return fulfilledResponse.value;
      });

    return keyParts.map((keyPart) => {
      const index = keyPart.indexOf(BACKUP_STORAGE_PRIVATE_KEY_INDEX_BREAKER);
      return {
        index: parseInt(keyPart.slice(0, index), 10),
        key: keyPart.slice(index + 1), 
      }
    })
      .sort((a, b) => a.index - b.index)
      .map((keyPart) => keyPart.key)
      .join('');
  }

  async signTransactionThroughBridge(
    dto: SignTransactionThoughtBridge,
  ): Promise<CustodySignedTransaction> {
    const backupStoragesKey = await this.getKeyFromApiApprovalForSigning(dto);

    return this.getSignedTransactionFromPrivateServer(
      {
        keyPart: backupStoragesKey,
        ...dto.signTransaction,
      },
    );
  }

  signContractTransactionThroughBridge(
    dto: SignContractTransactionDto,
  ): Observable<ICustodySignedContractTransaction> {
    return this.privateServerQueue.send<ICustodySignedContractTransaction>(
      { cmd: _MessagePatterns.signContractTransaction },
      dto,
    );
  }

  getRequestFromApiApprovalData(
    requestFromApiApproval: IRequestDataFromApiApproval,
    keyId: number,
  ): IRequestDataFromApiApproval {
    requestFromApiApproval.data = {
      key_id: keyId,
    };

    return requestFromApiApproval;
  }
}
