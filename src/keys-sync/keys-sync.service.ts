import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import { SyncRequestDto } from './dto/sync-request.dto';
import { ISyncRequestBridge, ISyncRequestBridgeResponse } from './interfaces/sync-request-bridge.interface';
import { routingKeys } from 'src/libs/microservices/constant';

@TenantService()
export class KeysSyncService {

    constructor(
        private readonly contextRabbitMQService: ContextualRabbitMQService,
    ) {
    }

    async syncRequest(syncRequestDto: SyncRequestDto) {

        const payload: ISyncRequestBridge=  {
            admin: syncRequestDto.admin,
            vaultId: syncRequestDto.vaultId
        }
        const data: ISyncRequestBridgeResponse = await this.contextRabbitMQService.requestDataFromCustody(
            routingKeys.messagePatterns.custodySolution.syncRequest,
            payload
        )

        return data;
    }


}
