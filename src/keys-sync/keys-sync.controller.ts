import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { KeysSyncService } from './keys-sync.service';
import { SyncRequestDto } from './dto/sync-request.dto';
import { IAdminRequest } from 'src/libs/interfaces/admin-requrest.interface';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
import { CurrentSubdomain } from 'src/libs/decorators/current-subdomain.decorator';
import { subDomainSource } from 'src/libs/tenancy/utils';
import { SyncRequestFilter } from './entities/sync-request.entity';

@Controller('sync')
export class KeysSyncController {
    constructor(
        private readonly keysSyncService: KeysSyncService
    ) {
    }


    @Post()
    async syncRequest(
        @Body() syncRequestDto: SyncRequestDto,
        @CurrentAdmin() admin: IAdminRequest,
        @CurrentSubdomain() subdomain: subDomainSource
    ) {
        syncRequestDto.admin = admin;
        syncRequestDto.subdomain = subdomain.subdomain;
        const uuid = await this.keysSyncService.syncRequest(syncRequestDto)
        return {
            id: uuid
        };
    }


    @Get()
    async getMySyncRequests(
        @Query() query: SyncRequestFilter,
        @CurrentAdmin() admin: IAdminRequest
    ) {
        query.filters['adminId'] = admin.id;
        return this.keysSyncService.getMySyncRequests(query);
    }


}
