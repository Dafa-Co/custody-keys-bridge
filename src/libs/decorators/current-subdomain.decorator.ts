import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import { subDomainRequestKey } from '../tenancy/utils';
import { subDomainSource } from '../tenancy/utils';

/**
 * @param ctx: the context
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CurrentSubdomain = createParamDecorator(
  (data: never, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    let subdomain: subDomainSource = request[subDomainRequestKey];
    return subdomain;
  },
);
