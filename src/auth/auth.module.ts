import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TenancyModule } from 'src/libs/tenancy/tenancy.module';

@Module({
  imports: [
    TenancyModule
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
