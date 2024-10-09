import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { routingKeys } from 'src/libs/microservices/constant';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import { IValidateAccessToken } from './interfaces/validate-access-token.interface';
import { IAdminRequest } from 'src/libs/interfaces/admin-requrest.interface';

@TenantService()
export class AuthService {

    constructor(
        private readonly contextRmqService: ContextualRabbitMQService
    ) {}


    async validateAccessToken(accessToken: string): Promise<IAdminRequest> {
        const payload: IValidateAccessToken=  {
            accessToken
        }
        const data = await this.contextRmqService.requestDataFroCustody(
            routingKeys.messagePatterns.custodySolution.validateAccessToken,
            payload
        )

        return data;
    }

}
