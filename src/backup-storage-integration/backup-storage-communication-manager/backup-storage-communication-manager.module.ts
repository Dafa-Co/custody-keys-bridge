import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupStorage } from '../entities/backup-storage.entity';
import { BackupStorageVerifyKey } from '../entities/backup-storage-verify-key.entity';
import { BackupStorageActiveSession } from '../entities/backup-storage-active-session.entity';
import { BackupStorageCommunicationManagerService } from './backup-storage-communication-manager.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([BackupStorage, BackupStorageVerifyKey, BackupStorageActiveSession]),
  ],
  providers: [BackupStorageCommunicationManagerService],
  exports: [BackupStorageCommunicationManagerService],
})
export class BackupStorageCommunicationManagerModule {}
