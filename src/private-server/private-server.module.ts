import { Module } from '@nestjs/common';
import { PrivateServerController } from './private-server.controller';
import { PrivateServerService } from './private-server.service';
import { RmqModule, RmqServiceServices } from 'src/libs/rmq/rmq.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { configs } from 'src/configs/configs';
import { BackupStorageIntegrationModule } from 'src/backup-storage-integration/backup-storage-integration.module';
import { PrivateServerRMQSubscriberController } from './private-server.rmq.subscriber.controller';

@Module({
  imports: [
    RmqModule.register(RmqServiceServices.PrivateServer),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: configs.RMQ_KEYS_BRIDGE_FANOUT_EXCHANGE,
          type: 'fanout',
        },
      ],
      uri: [configs.RABBITMQ_URL], // Replace with your RabbitMQ URL
      connectionInitOptions: {
        wait: false,
        reject: false,
        timeout: 60000,
      },
      connectionManagerOptions: {
        reconnectTimeInSeconds: 10,
        heartbeatIntervalInSeconds: 60,
      },
    }),
    BackupStorageIntegrationModule
  ],
  controllers: [PrivateServerController],
  providers: [PrivateServerService, PrivateServerRMQSubscriberController]
})
export class PrivateServerModule {}
