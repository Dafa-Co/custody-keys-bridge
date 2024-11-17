import { Module } from '@nestjs/common';
import { PrivateServerController } from './private-server.controller';
import { PrivateServerService } from './private-server.service';
import { RmqModule, RmqServiceServices } from 'src/libs/rmq/rmq.module';

@Module({
  imports: [
    RmqModule.register(RmqServiceServices.PrivateServer),
  ],
  controllers: [PrivateServerController],
  providers: [PrivateServerService]
})
export class PrivateServerModule {}
