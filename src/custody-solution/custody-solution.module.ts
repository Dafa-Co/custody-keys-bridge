import { Module } from '@nestjs/common';
import { CustodySolutionService } from './custody-solution.service';
import { TenancyModule } from 'src/libs/tenancy/tenancy.module';

@Module({
  imports: [
    TenancyModule,
  ],
  providers: [CustodySolutionService],
  exports: [CustodySolutionService],
})
export class CustodySolutionModule {}
