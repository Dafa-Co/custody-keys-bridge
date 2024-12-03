import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { RmqModule, RmqServiceServices } from 'src/libs/rmq/rmq.module';
import { TransactionsRMQController } from './transactions.controller.rmq';
import { HttpModule } from '@nestjs/axios';
import { BackupStorageIntegrationModule } from 'src/backup-storage-integration/backup-storage-integration.module';

@Module({
  imports: [
    RmqModule.register(RmqServiceServices.PrivateServer),
    HttpModule,
    BackupStorageIntegrationModule
  ],
  controllers: [TransactionsController, TransactionsRMQController],
  providers: [TransactionsService]
})
export class TransactionsModule {}
