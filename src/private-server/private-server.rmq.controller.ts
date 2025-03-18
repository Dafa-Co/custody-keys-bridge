import { ClientProxy, EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { _EventPatterns, _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerService } from './private-server.service';
import { RmqController } from 'rox-custody_common-modules/libs/decorators/rmq-controller.decorator';
import { PrivateServerQueue } from 'src/libs/rmq/private-server.decorator';

@RmqController()
export class PrivateServerRmqController {
  constructor(
    private privateServerService: PrivateServerService,
    @PrivateServerQueue() private readonly privateServerQueue: ClientProxy,
  ) { }

  @MessagePattern({ cmd: _MessagePatterns.generateKey })
  async generateKey(@Payload() dto: GenerateKeyPairBridge) {
    return this.privateServerService.generateKeyPair(dto);
  }

  @MessagePattern({ cmd: _MessagePatterns.bridge.healthCheck })
  async healthCheck() {
    return 'ok';
  }

  @EventPattern({ cmd: _EventPatterns.bridge.healthCheck })
  async healthCheckEvent() {
    return 'ok';
  }

  @MessagePattern({ cmd: _MessagePatterns.privateServer.healthCheck })
  async privateServerHealthCheck() {
    return this.privateServerQueue.send({ cmd: _MessagePatterns.privateServer.healthCheck }, {});
  }

  @EventPattern({ cmd: _EventPatterns.privateServer.healthCheck })
  async privateServerHealthCheckEvent() {
    return this.privateServerQueue.emit({ cmd: _EventPatterns.privateServer.healthCheck }, {});
  }
}
