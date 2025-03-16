import { TransactionsService } from './transactions.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { SignTransactionThoughtBridge } from 'rox-custody_common-modules/libs/interfaces/sign-transaction-throght-bridge.interface';
import { CustodySignedTransaction } from 'rox-custody_common-modules/libs/interfaces/custom-signed-transaction.type';
import { RmqController } from 'rox-custody_common-modules/libs/decorators/rmq-controller.decorator';
import { SignContractTransactionDto } from 'rox-custody_common-modules/libs/interfaces/sign-contract-transaction.interface';

@RmqController()
export class TransactionsRMQController {
  constructor(private transactionService: TransactionsService) {}

  @MessagePattern({ cmd: _MessagePatterns.bridge.signTransaction })
  async signTransactionThoughtBridge(
    @Payload() dto: SignTransactionThoughtBridge,
  ): Promise<CustodySignedTransaction> {
    return this.transactionService.signTransactionThoughtBridge(dto);
  }

  @MessagePattern({ cmd: _MessagePatterns.bridge.signContractTransaction })
  async signContractTransactionThroughBridge(
    @Payload() dto: SignContractTransactionDto,
  ): Promise<CustodySignedTransaction> {
    return this.transactionService.signContractTransactionThroughBridge(dto);
  }
}
