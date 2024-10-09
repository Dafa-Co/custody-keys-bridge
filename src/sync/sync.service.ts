import { Inject } from '@nestjs/common';
import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { TENANT_CONNECTION } from 'src/libs/tenancy/tenancy.module';
import { DataSource } from 'typeorm';

@TenantService()
export class SyncService {

    constructor(
        @Inject(TENANT_CONNECTION) private connection: DataSource,
    ) {
    }

}
