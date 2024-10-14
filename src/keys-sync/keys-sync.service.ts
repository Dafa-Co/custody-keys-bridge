import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import { SyncRequestDto } from './dto/sync-request.dto';
import { ISyncRequestBridge, ISyncRequestBridgeResponse } from './interfaces/sync-request-bridge.interface';
import { routingKeys } from 'src/libs/microservices/constant';
import { TENANT_CONNECTION } from 'src/libs/tenancy/utils';
import { Inject, UnprocessableEntityException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SyncRequest } from './entities/sync-request.entity';
import { FilterInterface } from 'src/libs/api-feature/filter.interface';
import { applyQueryBuilderOptions } from 'src/libs/api-feature/apply-query-options';
import { IApiApprovalSyncDto } from './interfaces/api-approval-sync.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { VerifyKeyHeader } from 'src/libs/constant/api-approval-constant';
import { AxiosResponse } from 'axios';
import { Response } from 'express';

@TenantService()
export class KeysSyncService {


    constructor(
        private readonly contextRabbitMQService: ContextualRabbitMQService,
        @Inject(TENANT_CONNECTION) private readonly dataSource: DataSource,
        private readonly httpService: HttpService,
    ) {
    }

    async syncRequest(syncRequestDto: SyncRequestDto, res: Response) {
        const { vaultId, admin, keysIds, publicKey } = syncRequestDto;

        const payload: ISyncRequestBridge=  {
            admin: admin,
            vaultId: vaultId
        }
        const data = await this.contextRabbitMQService.requestDataFromCustody<ISyncRequestBridgeResponse>(
            routingKeys.messagePatterns.custodySolution.syncRequest,
            payload
        )

        try {
            await this.submitSyncRequest({
                apiApprovalData: {
                    keysIds: keysIds,
                    publicKey: publicKey
                },
                syncData: data,
            }, res);
        } catch (error) {
            throw new UnprocessableEntityException(error.message);
        }

    }

    async submitSyncRequest(iApprovalSync: IApiApprovalSyncDto, res: Response) {
        const { apiApprovalData, syncData } = iApprovalSync;
        const { apiApprovalUrl, verifyKey } = syncData;

        // Stream the response directly to the client
        const response: AxiosResponse = await firstValueFrom(
          this.httpService.post(apiApprovalUrl, apiApprovalData, {
            headers: {
              [VerifyKeyHeader]: verifyKey,
            },
            responseType: 'stream', // Ensure the response is a stream
          })
        );

        // Set appropriate headers and pipe the stream to the client
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        response.data.pipe(res); // Pipe the stream to the client
      }


}
