import {
  HostComponentInfo,
  ContextId,
  ContextIdFactory,
  ContextIdStrategy,
} from '@nestjs/core';
import { Request } from 'express';
import { extractSubdomain } from './utils';

const tenants = new Map<string, ContextId>();

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    // Extract tenant ID from subdomain
    const subDomainObj = extractSubdomain(request);

    const tenantId = subDomainObj.subdomain;

    let tenantSubTreeId: ContextId;

    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId);
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    return {
      resolve: (info: HostComponentInfo) =>
        {
          return info.isTreeDurable ? tenantSubTreeId : contextId
        },
      payload: subDomainObj,
    };
  }
}
