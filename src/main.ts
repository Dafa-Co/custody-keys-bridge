import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { TrimPipe } from './libs/transformers/trim.transformer';
import { HttpErrorFilter } from './libs/filters/HttpError.filter';
import { RemoveNullKeysPipe } from './libs/transformers/remove-null-pipe';
import { configs } from './configs/configs';
import { validationFirstLabel } from './libs/decorators/validate-first.decorator';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { ContextIdFactory } from '@nestjs/core';
import { AggregateByTenantContextIdStrategy } from './libs/tenancy/aggregate-by-tenant-context-id-strategy';
import { getConsumerConfig } from 'rox-custody_common-modules/libs/config/rmq.config';
import { CustodyLogger } from 'rox-custody_common-modules/libs/services/logger/custody-logger.service';
import { setupNeededConstants } from 'rox-custody_common-modules/libs/utils/setup-needed-constants';


async function bootstrap() {
  setupNeededConstants({projectName: 'bridge'});

  const server = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
  });
  const logger = server.get(CustodyLogger);

  server.useLogger(logger);

  // Register tenant-based context strategy
  ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());

  server.useGlobalPipes(new TrimPipe());

  server.setGlobalPrefix('api', {});

  // validation pipes
  server.useGlobalFilters(new HttpErrorFilter());

  server.useGlobalPipes(new RemoveNullKeysPipe());

  const validationOptions: ValidationPipeOptions = {
    whitelist: true,
    stopAtFirstError: true,
    transform: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    enableDebugMessages: true,
  };

  server.useGlobalPipes(
    // here we run the normal validation pipe and when we want to run the transformation after the validation we run the second validation pipe
    new ValidationPipe({
      ...validationOptions,
    }),

    new ValidationPipe({
      ...validationOptions,
      transformOptions: { groups: [validationFirstLabel] },
    }),
  );


  // Create RabbitMQ microservice
  server.connectMicroservice<RmqOptions>(
    getConsumerConfig({
      clusterUrl: configs.RABBITMQ_URL,
      queueName: configs.RABBITMQ_CUSTODY_BRIDGE_QUEUE_NAME,
    })
  );

  await server.startAllMicroservices();
}
bootstrap();


