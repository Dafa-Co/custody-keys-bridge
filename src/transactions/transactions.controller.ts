import { Body, Controller, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
import { IBridgeAdminRequest } from 'rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface';
import { CreateActionDto } from '../../rox-custody_common-modules/libs/dtos/create-action.dto';

@Controller('transactions')
export class TransactionsController {

    constructor(
        private transactionService: TransactionsService
    ) {

    }

  @Post('action')
  takeAction(
    @CurrentAdmin() approval: IBridgeAdminRequest,
    @Body() createActionDto: CreateActionDto,
  ) {
    return this.transactionService.takeAction(approval, createActionDto);
  }




}
