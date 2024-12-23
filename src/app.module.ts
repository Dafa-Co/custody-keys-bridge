import { Module, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './database/database.config';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './configs/validation-schema';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TenancyModule } from './libs/tenancy/tenancy.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards/verify-access-token.guard';
import { KeysSyncModule } from './keys-sync/keys-sync.module';
import { PrivateServerModule } from './private-server/private-server.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BackupStorageIntegrationModule } from './backup-storage-integration/backup-storage-integration.module';


@Module({
  imports: [
    TenancyModule,
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    KeysSyncModule,
    PrivateServerModule,
    TransactionsModule,
    BackupStorageIntegrationModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      scope: Scope.REQUEST,
      useClass: AccessTokenGuard
    }
  ],
})

export class AppModule {}
