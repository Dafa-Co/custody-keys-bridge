import { Module } from '@nestjs/common';
import { KeysSyncController } from './keys-sync.controller';
import { KeysSyncService } from './keys-sync.service';
import { TenancyModule } from 'src/libs/tenancy/tenancy.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncRequest } from './entities/sync-request.entity';

@Module({
  imports: [
    TenancyModule,
    TypeOrmModule.forFeature([
      SyncRequest
    ])
  ],
  controllers: [KeysSyncController],
  providers: [KeysSyncService],
  exports: [KeysSyncService]
})
export class KeysSyncModule {}
