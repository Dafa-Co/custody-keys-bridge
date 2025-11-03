/* eslint-disable prettier/prettier */
import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import {
  IPrivateServerTransactionSigner,
  ITransactionSigner,
  PrivateServerSignTransactionDto,
  SignSwapTransactionDto,
  SignTransactionDto,
} from 'rox-custody_common-modules/libs/interfaces/sign-transaction.interface';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { ClientProxy } from '@nestjs/microservices';
import { PrivateServerQueue } from 'src/libs/rmq/private-server.decorator';
import { firstValueFrom, Observable } from 'rxjs';
import {
  CustodySignedTransaction,
} from 'rox-custody_common-modules/libs/interfaces/custom-signed-transaction.type';
import { BackupStorageIntegrationService } from 'src/backup-storage-integration/backup-storage-integration.service';
import { IRequestDataFromApiApproval } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';
import { CustodyLogger } from 'rox-custody_common-modules/libs/services/logger/custody-logger.service';
import { ICustodySignedContractTransaction } from 'rox-custody_common-modules/libs/interfaces/contract-transaction.interface';
import { SCMNotConnected } from 'rox-custody_common-modules/libs/custom-errors/scm-not-connected.exception';
import { BackupStorage } from 'src/backup-storage-integration/entities/backup-storage.entity';
import { getEnvFolderName } from 'rox-custody_common-modules/libs/utils/api-approval';
import { configs } from 'src/configs/configs';
import { BACKUP_STORAGE_PRIVATE_KEY_INDEX_BREAKER } from 'src/backup-storage-integration/constants/backup-storage.constants';
import { ISignContractTransaction } from 'rox-custody_common-modules/libs/interfaces/sign-contract-transaction.interface';
import { ISignMintOrBurnTokenTransaction } from 'rox-custody_common-modules/libs/interfaces/sign-mint-token-transaction.interface';
import { ICustodyMintOrBurnTokenTransaction } from 'rox-custody_common-modules/libs/interfaces/mint-transaction.interface';
import { ISignTransferNFTTransaction } from 'rox-custody_common-modules/libs/interfaces/sign-transfer-nft-transaction.interface';
import { ICustodyTransferNFTTransaction } from 'rox-custody_common-modules/libs/interfaces/transfer-nft-transaction.interface';

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

  private async getSignedSwapTransactionFromPrivateServer(
    privateServerSignTransaction: PrivateServerSignTransactionDto,
  ) {
    return await firstValueFrom(
      this.privateServerQueue.send<CustodySignedTransaction>(
        { cmd: _MessagePatterns.signSwapTransaction },
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
      throw new SCMNotConnected(
        {
          backupStoragesIds: backupStoragesWithNoActiveSession.map(
            (backupStorage) => backupStorage.id
          ),
        }
      );
    }
  }

  private async getKeyFromApiApprovalForSigning(
    signer: ITransactionSigner,
    corporateId: number,
  ): Promise<string> {
    const { keyId, vaultId, requestFromApiApproval } = signer;

    const backupStoragesIds = requestFromApiApproval?.backupStoragesIds;

    if (!backupStoragesIds || !backupStoragesIds.length) {
      return '';
    }

    const backupStorageInfo = await this.backupStorageIntegrationService.getBackupStoragesInfo(
      backupStoragesIds,
      corporateId,
      true,
    );

    this.checkAllHaveActiveSessions(backupStorageInfo);

    const keyPartsResponses = await Promise.allSettled(
      backupStorageInfo.map((backupStorage) => {
        const folderName = getEnvFolderName(
          backupStorage.corporateId,
          vaultId,
          configs.NODE_ENV,
          backupStorage.id
        );

        return this.backupStorageIntegrationService.getKeyFromApiApproval({
          activeSessions: backupStorage.activeSessions.map(({ sessionKey }) => sessionKey),
          folderName,
          backupStorageId: backupStorage.id,
          privateKeyId: keyId,
          url: backupStorage.url,
        })
      }));

    // Get all failed requests and if type of scm not connected then prepare to throw that error, other errors throw bad request
    const failedRequests = keyPartsResponses.filter(
      (response) => response.status === 'rejected'
    ) as PromiseRejectedResult[];
    const failedRequestsWithSCMNotConnected = failedRequests.filter(
      (response) => response.reason instanceof SCMNotConnected
    ) as PromiseRejectedResult[];

    if (failedRequestsWithSCMNotConnected.length) {
      throw new SCMNotConnected(
        {
          backupStoragesIds: failedRequestsWithSCMNotConnected.flatMap(
            (response) => response.reason?.backupStoragesIds
          ),
        }
      );
    }

    if (failedRequests.length) {
      throw new Error(
        `Error getting keys from backup storages: ${failedRequests
          .map((response) => response.reason)
          .join(', ')}`
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

  private async fillSignersPrivateKeysParts(
    signers: ITransactionSigner[],
    corporateId: number,
  ) {
    return Promise.all(
      signers.map(async (signer) => {
        const keyPart = await this.getKeyFromApiApprovalForSigning(signer, corporateId);
        return {
          ...signer,
          keyPart,
        };
      }),
    );
  }

  async signTransactionThroughBridge(
    dto: SignTransactionDto,
  ): Promise<CustodySignedTransaction> {
    const signers = await this.fillSignersPrivateKeysParts(dto.signers, dto.corporateId);

    return this.getSignedTransactionFromPrivateServer(
      {
        ...dto,
        signers,
      },
    );
  }

  async signSwapTransactionThroughBridge(
    dto: SignSwapTransactionDto,
  ): Promise<CustodySignedTransaction> {
    const signers = await this.fillSignersPrivateKeysParts(dto.signers, dto.corporateId);

    return this.getSignedSwapTransactionFromPrivateServer(
      {
        ...dto,
        signers,
      },
    );
  }

  async signContractTransactionThroughBridge(
    dto: ISignContractTransaction,
  ): Promise<ICustodySignedContractTransaction> {
    const signers = await this.fillSignersPrivateKeysParts(dto.signers, dto.corporateId);

    return await firstValueFrom(
      this.privateServerQueue.send<ICustodySignedContractTransaction>(
        { cmd: _MessagePatterns.signContractTransaction },
        {
          ...dto,
          signers,
        },
      ),
    );
  }

  async mintTokenTransactionThroughBridge(dto: ISignMintOrBurnTokenTransaction,
  ): Promise<ICustodyMintOrBurnTokenTransaction> {
    const signers = await this.fillSignersPrivateKeysParts(dto.signers, dto.corporateId);

    return await firstValueFrom(
      this.privateServerQueue.send<ICustodyMintOrBurnTokenTransaction>(
        { cmd: _MessagePatterns.signMintTokenTransaction },
        {
          ...dto,
          signers,
        },
      ),
    );
  }

  async burnTokenTransactionThroughBridge(dto: ISignMintOrBurnTokenTransaction,
  ): Promise<ICustodyMintOrBurnTokenTransaction> {
    const signers = await this.fillSignersPrivateKeysParts(dto.signers, dto.corporateId);

    return await firstValueFrom(
      this.privateServerQueue.send<ICustodyMintOrBurnTokenTransaction>(
        { cmd: _MessagePatterns.signBurnTokenTransaction },
        {
          ...dto,
          signers,
        },
      ),
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

  async signTransferNFTTransactionThroughBridge(dto: ISignTransferNFTTransaction): Promise<ICustodyTransferNFTTransaction> {
    const signers = await this.fillSignersPrivateKeysParts(dto.signers, dto.corporateId);

    return await firstValueFrom(
      this.privateServerQueue.send<ICustodyMintOrBurnTokenTransaction>(
        { cmd: _MessagePatterns.signTransferNFTTransaction },
        {
          ...dto,
          signers,
        },
      ),
    );
  }
}
