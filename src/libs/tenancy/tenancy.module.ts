import { Global, Module, Scope, } from '@nestjs/common';
import { ContextualEventEmitterService } from './context-event-emitter';
import { ContextualRabbitMQService } from './context-rmq';
import { RmqModule, RmqServiceServices } from '../rmq/rmq.module';
import { ContextIdFactory, REQUEST } from '@nestjs/core';
import { extractSubdomain, subDomainSource } from './utils';

export const CURRENT_CORPORATE = 'CURRENT_CORPORATE';

@Global()
@Module({
  imports: [
    RmqModule.register(RmqServiceServices.CustodySolution),
  ],
  providers: [
    {
      provide: CURRENT_CORPORATE,
      scope: Scope.TRANSIENT,
      durable: true,
      inject: [REQUEST],
      useFactory: async (
        request: any,
      ): Promise<subDomainSource> => {


        let contextId = ContextIdFactory.getByRequest(request);

        const subdomainObject = contextId.payload as subDomainSource || extractSubdomain(request);
        console.log("TenancyModule", subdomainObject)

        return subdomainObject;
      },
    },
    ContextualRabbitMQService,
    ContextualEventEmitterService
  ],
  exports: [ContextualEventEmitterService, ContextualRabbitMQService, CURRENT_CORPORATE],
})
export class TenancyModule {}
