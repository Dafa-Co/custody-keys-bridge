import { Body, Controller, Get, Header, Post, Query, Res } from '@nestjs/common';
import { KeysSyncService } from './keys-sync.service';
import { SyncRequestDto } from './dto/sync-request.dto';
import { IAdminRequest } from 'src/libs/interfaces/admin-requrest.interface';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
import { CurrentSubdomain } from 'src/libs/decorators/current-subdomain.decorator';
import { subDomainSource } from 'src/libs/tenancy/utils';
import { Response as expressResponse } from 'express';

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
        @CurrentSubdomain() subdomain: subDomainSource,
        @Res() res: expressResponse
    ) {
        syncRequestDto.admin = admin;
        syncRequestDto.subdomain = subdomain.subdomain;
        await this.keysSyncService.syncRequest(syncRequestDto, res)
        return;
    }
}
