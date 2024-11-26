import { Module } from '@nestjs/common';
import { BackupStorageIntegrationService } from './backup-storage-integration.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule
  ],
  providers: [BackupStorageIntegrationService],
  exports: [BackupStorageIntegrationService]
})
export class BackupStorageIntegrationModule {}
