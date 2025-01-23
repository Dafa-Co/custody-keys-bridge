import { Controller, Sse, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { GenerateKeyPairBridge } from 'rox-custody_common-modules/libs/interfaces/generate-key.interface';
import { PrivateServerService } from './private-server.service';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
import { IBridgeAdminRequest } from 'rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface';
import { RpcExceptionsFilter } from 'rox-custody_common-modules/libs/filters/RPCFilter.filter';

@Controller('keys')
export class PrivateServerController {
  constructor(
    private privateServerService: PrivateServerService,
  ) {}

  @MessagePattern({ cmd: _MessagePatterns.generateKey })
  @UseFilters(RpcExceptionsFilter)
  async generateKey(@Payload() dto: GenerateKeyPairBridge) {
    return this.privateServerService.generateKeyPair(dto);
  }

  @Sse('updates')
  updates(
    @CurrentAdmin() iAdmin: IBridgeAdminRequest
  ) {
    return this.privateServerService.keysUpdatesSSe(iAdmin);
  }

}
