import { Injectable, Scope, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { subDomainRequestKey } from './utils';
import { subDomainSource } from './utils';
import { TenantService } from '../decorators/tenant-service.decorator';

@TenantService()
export class ContextualEventEmitterService {
  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(REQUEST) private request: Request
  ) {}

  emit(event: string, payload: any) {
    const corporateData: subDomainSource = this.request[subDomainRequestKey] ?? (this.request as any).data[subDomainRequestKey];
    payload.subdomain = corporateData?.subdomain;
    this.eventEmitter.emit(event, payload);
  }

}
