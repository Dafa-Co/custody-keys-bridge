import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { TenancyModule } from 'src/libs/tenancy/tenancy.module';

@Module({
  imports: [
    TenancyModule
  ],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
