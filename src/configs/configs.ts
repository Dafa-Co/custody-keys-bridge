import * as dotenv from 'dotenv';

dotenv.config();

export const configs = {
    // general
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,

    // RMQ
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    RABBITMQ_CUSTODY_SOLUTION_QUEUE_NAME: process.env.RABBITMQ_CUSTODY_QUEUE_NAME ,
    RABBITMQ_CUSTODY_PRIVATE_SERVER_QUEUE_NAME: process.env.RABBITMQ_CUSTODY_PRIVATE_SERVER_QUEUE_NAME,
    RABBITMQ_CUSTODY_BRIDGE_QUEUE_NAME: process.env.RABBITMQ_CUSTODY_BRIDGE_QUEUE_NAME,

    // RMQ services
    RABBITMQ_CUSTODY_SOLUTION_SERVICE_NAME: "RABBITMQ_CUSTODY_SERVICE_NAME",
    RABBITMQ_CUSTODY_PRIVATE_SERVER_SERVICE_NAME: "RABBITMQ_CUSTODY_PRIVATE_SERVER_SERVICE_NAME",

}
