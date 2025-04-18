import { Module, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './configs/validation-schema';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TenancyModule } from './libs/tenancy/tenancy.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards/verify-access-token.guard';
import { PrivateServerModule } from './private-server/private-server.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BackupStorageIntegrationModule } from './backup-storage-integration/backup-storage-integration.module';
import { RmqHelperQueuesInitializerModule } from 'rox-custody_common-modules/libs/services/rmq-helper-queues-initializer/rmq-helper-queues-initializer.module';
import { configs } from './configs/configs';
import { CustodyLoggerModule } from 'rox-custody_common-modules/libs/services/logger/custody-logger.module';
import { ormConfigs } from './configs/database';
import { SecureCommunicationModule } from 'rox-custody_common-modules/libs/services/secure-communication/secure-communication.module';
import { MailsModule } from './mail/mail.module';

@Module({
  imports: [
    TenancyModule,
    TypeOrmModule.forRoot(ormConfigs),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    AuthModule,
    PrivateServerModule,
    TransactionsModule,
    BackupStorageIntegrationModule,
    RmqHelperQueuesInitializerModule.register(
      configs.RABBITMQ_URL,
      [configs.RABBITMQ_CUSTODY_BRIDGE_QUEUE_NAME]
    ),
    CustodyLoggerModule,
    SecureCommunicationModule,
    MailsModule,
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

export class AppModule { }
