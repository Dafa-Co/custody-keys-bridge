import { Inject } from '@nestjs/common';
import { ContextIdFactory, REQUEST } from '@nestjs/core';
import { subDomainSource } from './utils';
import { TenantService } from '../decorators/tenant-service.decorator';
import { SolutionQueue } from '../rmq/solution-queue.decorator';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { DBIdentifierRMQ } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { InjectCurrentCorporate } from './inject-current-corporate';
@TenantService()
export class ContextualRabbitMQService {
  constructor(
    @SolutionQueue() private readonly custodyQueue: ClientProxy,
    @Inject(REQUEST) private request: Request,
  ) {}

  // Function to send message with injected subdomain
  async publishToCustody(routingKey: string, payload: any) {

    const contextId = ContextIdFactory.getByRequest(this.request);
    const subdomainObject = contextId.payload as subDomainSource;

    // Inject subdomain from the corporateData into the payload
    payload[DBIdentifierRMQ] = subdomainObject.subdomain;

    this.custodyQueue.emit(
      {
        cmd: routingKey,
      },
      payload,
    );
  }

  async requestDataFromCustody<T>(routingKey: string, payload: any): Promise<T> {
    // Inject subdomain from the corporateData into the payload
    const contextId = ContextIdFactory.getByRequest(this.request);
    const subdomainObject = contextId.payload as subDomainSource;

    // Inject subdomain from the corporateData into the payload
    payload[DBIdentifierRMQ] = subdomainObject.subdomain;

    const response = await firstValueFrom(
      this.custodyQueue.send(
        {
          cmd: routingKey,
        },
        payload,
      ),
    );

    return response; // Return the received response
  }
}
