import { TenantService } from 'src/libs/decorators/tenant-service.decorator';
import { ContextualRabbitMQService } from 'src/libs/tenancy/context-rmq';

@TenantService()
export class CustodySolutionService {
    constructor(private readonly contextualRabbitMQService: ContextualRabbitMQService) {}

}
