import { Inject } from "@nestjs/common"
import { configs } from "src/configs/configs";


export const BridgeQueue = () => {
    return Inject(configs.RABBITMQ_CUSTODY_BRIDGE_SERVICE_NAME);
}
