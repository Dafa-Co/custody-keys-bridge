import { BadRequestException, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  createCorporateDataSource,
  extractSubdomain,
  subDomainSourceEnum,
} from './utils';
import { ContextualEventEmitterService } from './context-event-emitter';
import { ContextualRabbitMQService } from './context-rmq';
import { RmqModule, RmqServiceServices } from '../rmq/rmq.module';
export const TENANT_CONNECTION = 'TENANT_CONNECTION';

export const subDomainRequestKey = 'subDomainRequestKey';

@Module({
  imports: [
    RmqModule.register(RmqServiceServices.CustodySolution),
  ],
  providers: [
    {
      provide: TENANT_CONNECTION,
      inject: [REQUEST],
      scope: Scope.REQUEST,
      useFactory: async (request) => {
        const subdomainObject = extractSubdomain(request);

        if (!subdomainObject || !subdomainObject.subdomain) {
          throw new BadRequestException(
            'Subdomain not found. Please ensure the correct subdomain is included in your request.',
          );
        }

        const { subdomain, source } = subdomainObject;

        request[subDomainRequestKey] = subdomainObject;

        // inject it inside the data if its RMQ
        if(subDomainSourceEnum.RMQ === source) {
          request.data[subDomainRequestKey] = subdomainObject;
        }

        return createCorporateDataSource(subdomain);
      },
    },
    ContextualEventEmitterService,
    ContextualRabbitMQService
  ],
  exports: [TENANT_CONNECTION, ContextualEventEmitterService, ContextualRabbitMQService],
})
export class TenancyModule {}
