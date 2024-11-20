import { Controller, UseFilters } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { SignTransactionThoughtBridge } from 'rox-custody_common-modules/libs/interfaces/sign-transaction-throght-bridge.interface';
import { CustodySignedTransaction } from 'rox-custody_common-modules/libs/interfaces/custom-signed-transaction.type';
import { RpcExceptionsFilter } from 'rox-custody_common-modules/libs/filters/RPCFilter.filter';

@Controller('')
export class TransactionsRMQController {

    constructor(
        private transactionService: TransactionsService
    ) {
    }

    @MessagePattern({ cmd: _MessagePatterns.bridge.signTransaction })
    @UseFilters(RpcExceptionsFilter)
    async signTransactionThoughtBridge(@Payload() dto: SignTransactionThoughtBridge): Promise<CustodySignedTransaction> {
      return this.transactionService.signTransactionThoughtBridge(dto);
    }



}
