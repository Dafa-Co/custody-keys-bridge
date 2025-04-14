import { Module } from '@nestjs/common';
import { BackupStorageIntegrationService } from './backup-storage-integration.service';
import { HttpModule } from '@nestjs/axios';
import { BackupStorageIntegrationRmqController } from './backup-storage-integration.rmq.controller';
import { BackupStorageCommunicationManagerModule } from './backup-storage-communication-manager/backup-storage-communication-manager.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupStorage } from './entities/backup-storage.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([BackupStorage]),
    BackupStorageCommunicationManagerModule,
  ],
  controllers: [BackupStorageIntegrationRmqController],
  providers: [BackupStorageIntegrationService],
  exports: [BackupStorageIntegrationService]
})
export class BackupStorageIntegrationModule { }
