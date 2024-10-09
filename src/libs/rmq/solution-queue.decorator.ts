import { applyDecorators, Inject } from "@nestjs/common"
import { configs } from "src/configs/configs";


export const SolutionQueue = () => {
    return Inject(configs.RABBITMQ_CUSTODY_SOLUTION_SERVICE_NAME);
}
