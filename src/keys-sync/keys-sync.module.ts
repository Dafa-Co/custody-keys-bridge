import { Module } from '@nestjs/common';
import { KeysSyncController } from './keys-sync.controller';
import { KeysSyncService } from './keys-sync.service';
import { TenancyModule } from 'src/libs/tenancy/tenancy.module';

@Module({
  imports: [
    TenancyModule
  ],
  controllers: [KeysSyncController],
  providers: [KeysSyncService],
  exports: [KeysSyncService]
})
export class KeysSyncModule {}
