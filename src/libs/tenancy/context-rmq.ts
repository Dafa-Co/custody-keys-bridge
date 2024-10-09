import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DBIdentifierRMQ } from '../microservices/constant';
import { subDomainRequestKey } from './utils';
import { TENANT_CONNECTION } from './utils';
import { subDomainSource } from './utils';
import { TenantService } from '../decorators/tenant-service.decorator';
import { SolutionQueue } from '../rmq/solution-queue.decorator';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
@TenantService()
export class ContextualRabbitMQService {
  constructor(
    @Inject(TENANT_CONNECTION) private readonly dataSource: any,
    @SolutionQueue() private readonly custodyQueue: ClientProxy,
    @Inject(REQUEST) private request: Request,
  ) {}

  // Function to send message with injected subdomain
  async publishToCustody(routingKey: string, payload: any) {
    const corporateData: subDomainSource =
      this.request[subDomainRequestKey] ??
      (this.request as any).data[subDomainRequestKey];
    // Inject subdomain from the corporateData into the payload
    payload[DBIdentifierRMQ] = corporateData.subdomain;

    this.custodyQueue.emit(
      {
        cmd: routingKey,
      },
      payload,
    );
  }

  // New function to send a request and get a response with injected subdomain
  async requestDataFromCustody<T>(routingKey: string, payload: any): Promise<T> {
    const corporateData: subDomainSource =
      this.request[subDomainRequestKey] ??
      (this.request as any).data[subDomainRequestKey];


    // Inject subdomain from the corporateData into the payload
    payload[DBIdentifierRMQ] = corporateData?.subdomain;

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
