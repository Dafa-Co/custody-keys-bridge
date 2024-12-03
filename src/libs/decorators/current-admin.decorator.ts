import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import { IBridgeAdminRequest } from '../../../rox-custody_common-modules/libs/interfaces/bridge-admin-requrest.interface';

export const requestAdminKey: string = 'admin-request';

/**
 * @param ctx: the context
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CurrentAdmin = createParamDecorator(
  (data: never, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const admin: IBridgeAdminRequest = request[requestAdminKey];

    return admin;
  },
);
