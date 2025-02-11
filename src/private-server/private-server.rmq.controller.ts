import { Controller, Sse, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerService } from './private-server.service';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
import { IBridgeAdminRequest } from 'rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface';
import { RmqController } from 'rox-custody_common-modules/libs/decorators/rmq-controller.decorator';

@RmqController()
export class PrivateServerRmqController {
  constructor(
    private privateServerService: PrivateServerService,
  ) { }

  @MessagePattern({ cmd: _MessagePatterns.generateKey })
  async generateKey(@Payload() dto: GenerateKeyPairBridge) {
    return this.privateServerService.generateKeyPair(dto);
  }
}
