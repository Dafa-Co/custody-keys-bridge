import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerService } from './private-server.service';

@Controller('private-server')
export class PrivateServerController {
    constructor(
        private privateServerService: PrivateServerService
    ) {
    }

  @MessagePattern({ cmd: _MessagePatterns.generateKey })
  async generateKey(@Payload() dto: GenerateKeyPairBridge) {
    return this.privateServerService.generateKeyPair(dto);
  }


}
