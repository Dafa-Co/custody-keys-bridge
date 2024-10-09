import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { requestAdminKey } from 'src/libs/decorators/current-admin.decorator';
import { subDomainSource } from 'src/libs/tenancy/utils';
import { subDomainRequestKey } from 'src/libs/tenancy/tenancy.module';
import { TenantService } from 'src/libs/decorators/tenant-service.decorator';

export const requestAuthorizationKey = 'authorization';

@TenantService()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get the refresh token from the request Body
    const accessToken = this.extractTokenFromHeader(request);

    if (!accessToken) return false;

    // Check if the refresh token is valid
    const admin = await this.authService.validateAccessToken(
      accessToken,
    );

    request[requestAdminKey] = admin;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] =
      request.headers[requestAuthorizationKey]?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
