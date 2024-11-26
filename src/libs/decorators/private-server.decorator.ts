import { Inject } from "@nestjs/common"
import { configs } from "src/configs/configs";


export const PrivateServerQueue = () => {
    return Inject(configs.RABBITMQ_CUSTODY_PRIVATE_SERVER_SERVICE_NAME);
}
