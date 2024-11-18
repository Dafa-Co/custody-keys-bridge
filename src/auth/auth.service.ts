import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';
import { IValidateAccessToken } from './interfaces/validate-access-token.interface';
import { IAdminRequest } from 'src/libs/interfaces/admin-requrest.interface';
import { _MessagePatterns } from 'rox-custody_common-modules/libs/utils/microservice-constants';

@TenantService()
export class AuthService {

    constructor(
        private readonly contextRmqService: ContextualRabbitMQService,
    ) {}


    async validateAccessToken(accessToken: string): Promise<IAdminRequest> {
        const payload: IValidateAccessToken=  {
            accessToken
        }
        const data = await this.contextRmqService.requestDataFromCustody<IAdminRequest>(
            _MessagePatterns.bridge.validateAccessToken,
            payload
        )

        return data;
    }

}
