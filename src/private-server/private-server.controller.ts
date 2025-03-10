import { Controller, Sse, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerService } from './private-server.service';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
import { IBridgeAdminRequest } from 'rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface';

@Controller('keys')
export class PrivateServerController {
  constructor(
    private privateServerService: PrivateServerService,
  ) { }

  @Sse('updates')
  updates(
    @CurrentAdmin() iAdmin: IBridgeAdminRequest
  ) {
    return this.privateServerService.keysUpdatesSSe(iAdmin);
  }

}
