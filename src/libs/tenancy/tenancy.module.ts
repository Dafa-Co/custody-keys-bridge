import { Module, Scope, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  createCorporateDataSource,
  extractSubdomain,
  subDomainRequestKey,
  subDomainSourceEnum,
  TENANT_CONNECTION,
} from './utils';
import { ContextualEventEmitterService } from './context-event-emitter';
import { ContextualRabbitMQService } from './context-rmq';
import { RmqModule, RmqServiceServices } from '../rmq/rmq.module';
import { Request } from 'express';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    RmqModule.register(RmqServiceServices.CustodySolution),
  ],
  providers: [
    {
      provide: TENANT_CONNECTION,
      scope: Scope.REQUEST,
      inject: [REQUEST],
      useFactory: async (request: Request): Promise<DataSource> => {
        const subdomainObject = extractSubdomain(request);

        if (!subdomainObject?.subdomain) {
          throw new BadRequestException(
            'Subdomain not found. Please ensure the correct subdomain is included in your request.',
          );
        }

        const { subdomain, source } = subdomainObject;
        request[subDomainRequestKey] = subdomainObject;

        // inject it inside the data if its RMQ
        if(subDomainSourceEnum.RMQ === source) {
          (request as any).data[subDomainRequestKey] = subdomainObject;
        }

        const dataSource = createCorporateDataSource(subdomain);
        try {
          return await dataSource.initialize();
        } catch (error) {
          throw new BadRequestException('Failed to initialize tenant data source.', error.message);
        }
      },
    },
    ContextualRabbitMQService,
    ContextualEventEmitterService
  ],
  exports: [TENANT_CONNECTION, ContextualEventEmitterService, ContextualRabbitMQService],
})
export class TenancyModule {}
