import { Module } from '@nestjs/common';
import { PrivateServerController } from './private-server.controller';
import { PrivateServerService } from './private-server.service';
import { RmqModule, RmqServiceServices } from 'src/libs/rmq/rmq.module';
import { RMQ_KEYS_BRIDGE_FANOUT_EXCHANGE } from 'src/libs/constant/constant';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { configs } from 'src/configs/configs';

@Module({
  imports: [
    RmqModule.register(RmqServiceServices.PrivateServer),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: RMQ_KEYS_BRIDGE_FANOUT_EXCHANGE,
          type: 'fanout',
        },
      ],
      uri: [configs.RABBITMQ_URL], // Replace with your RabbitMQ URL
      connectionInitOptions: {
        wait: false,
        reject: false,
        timeout: 60000,
      },
    }),
  ],
  controllers: [PrivateServerController],
  providers: [PrivateServerService]
})
export class PrivateServerModule {}
