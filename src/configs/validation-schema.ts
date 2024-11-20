import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('DEV', 'TEST', 'DEMO', 'PROD').required(),

    PORT: Joi.number().required(),

    // RMQ
    RABBITMQ_URL: Joi.string().required(),
    RABBITMQ_CUSTODY_QUEUE_NAME: Joi.string().required(),
    RABBITMQ_CUSTODY_PRIVATE_SERVER_QUEUE_NAME: Joi.string().required(),
    RABBITMQ_CUSTODY_BRIDGE_QUEUE_NAME: Joi.string().required()
})
