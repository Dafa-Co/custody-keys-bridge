import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import {
  PrivateServerSignTransactionDto,
} from 'rox-custody_common-modules/libs/interfaces/sign-transaction.interface';
import {
  _EventPatterns,
  _MessagePatterns,
} from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { ProcessTakingAction } from 'rox-custody_common-modules/libs/interfaces/take-action.interface';
import { ClientProxy } from '@nestjs/microservices';
import { PrivateServerQueue } from 'src/libs/rmq/private-server.decorator';
import { firstValueFrom } from 'rxjs';
import {
  CustodySignedContractTransaction,
  CustodySignedTransaction,
} from 'rox-custody_common-modules/libs/interfaces/custom-signed-transaction.type';
import { SignTransactionThoughtBridge } from 'rox-custody_common-modules/libs/interfaces/sign-transaction-throght-bridge.interface';
import { BackupStorageIntegrationService } from 'src/backup-storage-integration/backup-storage-integration.service';
import { IRequestDataFromApiApproval } from 'rox-custody_common-modules/libs/interfaces/send-to-backup-storage.interface';
import { CustodyLogger } from 'rox-custody_common-modules/libs/services/logger/custody-logger.service';
import { SignContractTransactionDto } from 'rox-custody_common-modules/libs/interfaces/sign-contract-transaction.interface';

@TenantService()
export class TransactionsService {
  constructor(
    private readonly contextRabbitMQService: ContextualRabbitMQService,
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
    private readonly backupStorageIntegrationService: BackupStorageIntegrationService,
    private readonly logger: CustodyLogger,
  ) {}

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

  async signTransactionThoughtBridge(
    dto: SignTransactionThoughtBridge,
  ): Promise<CustodySignedTransaction> {
    const { signTransaction, requestFromApiApproval } = dto;

    let secondHalf = requestFromApiApproval
      ? await this.backupStorageIntegrationService.getKeyFromApiApproval(
          this.getRequestFromApiApprovalData(
            requestFromApiApproval,
            signTransaction.keyId,
          ),
        )
      : '';

    const privateServerSignTransaction: PrivateServerSignTransactionDto = {
      ...signTransaction,
      secondHalf,
    };

    return this.getSignedTransactionFromPrivateServer(
      privateServerSignTransaction,
    );
  }

  async signContractTransactionThroughBridge(
    dto: SignContractTransactionDto,
  ): Promise<CustodySignedContractTransaction> {
    return await firstValueFrom(
      this.privateServerQueue.send<CustodySignedContractTransaction>(
        { cmd: _MessagePatterns.signContractTransaction },
        dto,
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
}
