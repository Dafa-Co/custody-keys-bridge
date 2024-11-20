import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { CreateActionDto } from '../../rox-custody_common-modules/libs/dtos/create-action.dto';
import { IBridgeAdminRequest } from 'rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import {
  PrivateServerSignTransactionDto,
  SignTransactionDto,
} from 'rox-custody_common-modules/libs/interfaces/sign-transaction.interface';
import {
  _EventPatterns,
  _MessagePatterns,
} from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { ProcessTakingAction } from 'rox-custody_common-modules/libs/interfaces/take-action.interface';
import { ClientProxy } from '@nestjs/microservices';
import { PrivateServerQueue } from 'src/libs/rmq/private-server.decorator';
import { firstValueFrom } from 'rxjs';
import { CustodySignedTransaction } from 'rox-custody_common-modules/libs/interfaces/custom-signed-transaction.type';
import { SignTransactionThoughtBridge } from 'rox-custody_common-modules/libs/interfaces/sign-transaction-throght-bridge.interface';
import { BackupStorageIntegrationService } from 'src/backup-storage-integration/backup-storage-integration.service';

@TenantService()
export class TransactionsService {
  constructor(
    private readonly contextRabbitMQService: ContextualRabbitMQService,
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
    private readonly backupStorageIntegrationService: BackupStorageIntegrationService,
  ) {}

  async takeAction(
    approval: IBridgeAdminRequest,
    createActionDto: CreateActionDto,
  ) {
    // send to custody to verify admin action

    const processTakingActionPayload: ProcessTakingAction = {
      approval,
      createActionDto,
    };

    const signTransactionData =
      await this.contextRabbitMQService.requestDataFromCustody<SignTransactionDto>(
        _MessagePatterns.bridge.transactionAction,
        processTakingActionPayload,
      );

    // if this return null that mean this action will not make the transaction change its status
    if (signTransactionData) {
      this.broadcastTransaction(
        createActionDto.halfOfPrivateKey,
        signTransactionData,
      );
    }

    return 'action taken successfully';
  }

  async broadcastTransaction(
    secondHalf: string,
    signTransactionData: SignTransactionDto,
  ) {
    const privateServerSignTransaction: PrivateServerSignTransactionDto = {
      ...signTransactionData,
      secondHalf,
    };

    let signedTransaction: CustodySignedTransaction = {
      signedTransaction: null,
      bundlerUrl: null,
      error: null,
      transactionId: signTransactionData.transactionId,
    };

    try {
      signedTransaction = await this.getSignedTransactionFromPrivateServer(
        privateServerSignTransaction,
      );
    } catch (error) {
      console.log('errowaerr', error);
      signedTransaction.error = error;
    }

    await this.contextRabbitMQService.publishToCustody(
      _EventPatterns.bridge.broadcastTransaction,
      signedTransaction,
    );
  }

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

    requestFromApiApproval.data = {
      key_id: signTransaction.keyId,
    };

    let secondHalf = requestFromApiApproval
      ? await this.backupStorageIntegrationService.getKeyFromApiApproval(
          requestFromApiApproval,
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
}
