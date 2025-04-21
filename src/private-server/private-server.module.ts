import { Module } from '@nestjs/common';
import { PrivateServerService } from './private-server.service';
import { RmqModule, RmqServiceServices } from 'src/libs/rmq/rmq.module';
import { BackupStorageIntegrationModule } from 'src/backup-storage-integration/backup-storage-integration.module';
import { PrivateServerRmqController } from './private-server.rmq.controller';

@Module({
  imports: [
    RmqModule.register(RmqServiceServices.PrivateServer),
    BackupStorageIntegrationModule
  ],
  controllers: [PrivateServerRmqController],
  providers: [PrivateServerService]
})
export class PrivateServerModule { }
