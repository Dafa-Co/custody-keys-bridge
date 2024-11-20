import { Body, Controller, Post, Res } from '@nestjs/common';
import { KeysSyncService } from './keys-sync.service';
import { SyncRequestDto } from './dto/sync-request.dto';
import { IBridgeAdminRequest } from 'rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
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
        @CurrentAdmin() admin: IBridgeAdminRequest,
        @Res() res: expressResponse
    ) {
        syncRequestDto.admin = admin;
        await this.keysSyncService.syncRequest(syncRequestDto, res)
        return;
    }

}
