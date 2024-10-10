import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import { SyncRequestDto } from './dto/sync-request.dto';
import { ISyncRequestBridge, ISyncRequestBridgeResponse } from './interfaces/sync-request-bridge.interface';
import { routingKeys } from 'src/libs/microservices/constant';
import { TENANT_CONNECTION } from 'src/libs/tenancy/utils';
import { Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SyncRequest } from './entities/sync-request.entity';
import { IAdminRequest } from 'src/libs/interfaces/admin-requrest.interface';
import { FilterInterface } from 'src/libs/api-feature/filter.interface';
import { applyQueryBuilderOptions } from 'src/libs/api-feature/apply-query-options';

@TenantService()
export class KeysSyncService {
    private syncRequestRepository: Repository<SyncRequest>;


    constructor(
        private readonly contextRabbitMQService: ContextualRabbitMQService,
        @Inject(TENANT_CONNECTION) private readonly dataSource: DataSource,
    ) {
        this.syncRequestRepository = this.dataSource.getRepository(SyncRequest);
    }

    async syncRequest(syncRequestDto: SyncRequestDto) {
        const { vaultId, admin  } = syncRequestDto;

        const payload: ISyncRequestBridge=  {
            admin: syncRequestDto.admin,
            vaultId: syncRequestDto.vaultId
        }
        const data = await this.contextRabbitMQService.requestDataFromCustody<ISyncRequestBridgeResponse>(
            routingKeys.messagePatterns.custodySolution.syncRequest,
            payload
        )
        const { apiApprovalUrl, verifyKey } = data;
        const syncRequest = this.syncRequestRepository.create({
            syncUrl: apiApprovalUrl,
            verifyKey,
            vaultId,
            adminId: admin.id
        })

        const identifier = await this.syncRequestRepository.insert(syncRequest);

        return identifier.identifiers[0].id;
    }


    async getMySyncRequests(query: FilterInterface) {
        const syncQuery = this.syncRequestRepository.createQueryBuilder('');

        return applyQueryBuilderOptions(syncQuery, query)
    }



}
