import { Controller, Sse } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerService } from './private-server.service';
import { CustodyKeysBridgeTopicSubscribe } from 'src/libs/decorators/rabbit-topic-subscribe.decorator';
import { mobileKey } from 'rox-custody_common-modules/libs/interfaces/push-key-to-mobile.interface';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
import { IAdminRequest } from 'src/libs/interfaces/admin-requrest.interface';

@Controller('keys')
export class PrivateServerController {
  constructor(
    private privateServerService: PrivateServerService,
  ) {}

  @MessagePattern({ cmd: _MessagePatterns.generateKey })
  async generateKey(@Payload() dto: GenerateKeyPairBridge) {
    return this.privateServerService.generateKeyPair(dto);
  }

  @Sse('updates')
  updates(
    @CurrentAdmin() iAdmin: IAdminRequest
  ) {
    return this.privateServerService.keysUpdatesSSe(iAdmin);
  }

  @CustodyKeysBridgeTopicSubscribe()
  notifyAllMobileApprovals(@Payload() data: mobileKey) {
      this.privateServerService.pushDataToSSe(data)
  }

}
