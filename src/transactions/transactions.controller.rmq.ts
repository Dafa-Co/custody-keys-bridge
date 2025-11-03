/* eslint-disable prettier/prettier */
import { TransactionsService } from './transactions.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import {
  CustodySignedTransaction,
} from 'rox-custody_common-modules/libs/interfaces/custom-signed-transaction.type';
import { RmqController } from 'rox-custody_common-modules/libs/decorators/rmq-controller.decorator';
import { ICustodySignedContractTransaction } from 'rox-custody_common-modules/libs/interfaces/contract-transaction.interface';
import { ISignContractTransaction } from 'rox-custody_common-modules/libs/interfaces/sign-contract-transaction.interface';
import { SignSwapTransactionDto, SignTransactionDto } from 'rox-custody_common-modules/libs/interfaces/sign-transaction.interface';
import { ISignMintOrBurnTokenTransaction } from 'rox-custody_common-modules/libs/interfaces/sign-mint-token-transaction.interface';
import { ICustodyMintOrBurnTokenTransaction } from 'rox-custody_common-modules/libs/interfaces/mint-transaction.interface';
import { ICustodyTransferNFTTransaction } from 'rox-custody_common-modules/libs/interfaces/transfer-nft-transaction.interface';
import { ISignTransferNFTTransaction } from 'rox-custody_common-modules/libs/interfaces/sign-transfer-nft-transaction.interface';

@RmqController()
export class TransactionsRMQController {
  constructor(private transactionService: TransactionsService) { }

  @MessagePattern({ cmd: _MessagePatterns.bridge.signTransaction })
  async signTransactionThroughBridge(
    @Payload() dto: SignTransactionDto,
  ): Promise<CustodySignedTransaction> {
    return this.transactionService.signTransactionThroughBridge(dto);
  }

  @MessagePattern({ cmd: _MessagePatterns.bridge.signContractTransaction })
  async signContractTransactionThroughBridge(
    @Payload() dto: ISignContractTransaction,
  ): Promise<ICustodySignedContractTransaction> {
    return this.transactionService.signContractTransactionThroughBridge(dto);
  }

  @MessagePattern({ cmd: _MessagePatterns.bridge.mintTokenTransaction })
  async mintTokenTransactionThroughBridge(
    @Payload() dto: ISignMintOrBurnTokenTransaction,
  ): Promise<ICustodyMintOrBurnTokenTransaction> {
    return this.transactionService.mintTokenTransactionThroughBridge(dto);
  }

  @MessagePattern({ cmd: _MessagePatterns.bridge.burnTokenTransaction })
  async burnTokenTransactionThroughBridge(
    @Payload() dto: ISignMintOrBurnTokenTransaction,
  ): Promise<ICustodyMintOrBurnTokenTransaction> {
    return this.transactionService.burnTokenTransactionThroughBridge(dto);
  }

  @MessagePattern({ cmd: _MessagePatterns.bridge.signSwapTransaction })
  async signSwapTransactionThroughBridge(
    @Payload() dto: SignSwapTransactionDto,
  ): Promise<CustodySignedTransaction> {
    return this.transactionService.signSwapTransactionThroughBridge(dto);
  }

  @MessagePattern({ cmd: _MessagePatterns.bridge.signTransferNFTTransaction })
  async signTransferNFTTransactionThroughBridge(
    @Payload() dto: ISignTransferNFTTransaction,
  ): Promise<ICustodyTransferNFTTransaction> {
    return this.transactionService.signTransferNFTTransactionThroughBridge(dto);
  }
}
