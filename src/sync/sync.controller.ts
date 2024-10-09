import { Body, Controller, Post } from '@nestjs/common';
import { SyncRequestDto } from './dto/sync-request.dto';
import { SyncService } from './sync.service';
import { CurrentAdmin } from 'src/libs/decorators/current-admin.decorator';
import { IAdminRequest } from 'src/libs/interfaces/admin-requrest.interface';

@Controller('sync')
export class SyncController {

    constructor(
        private readonly syncService: SyncService
    ) {
    }

    @Post()
    syncRequest(
        @Body() syncRequestDto: SyncRequestDto,
        @CurrentAdmin() admin: IAdminRequest
    ) {
        console.log(admin);
        return syncRequestDto;
    }

}
