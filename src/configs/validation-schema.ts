import * as Joi from 'joi';

const JoiNumberCasting = Joi.alternatives().try(
    Joi.number(),
    Joi.string()
        .regex(/^\d+$/)
        .custom((value) => Number(value)),
);

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('DEV', 'TEST', 'DEMO', 'PROD').required(),

    PORT: Joi.number().required(),

    // RMQ
    RABBITMQ_URL: Joi.string().required(),
    RABBITMQ_CUSTODY_QUEUE_NAME: Joi.string().required(),
    RABBITMQ_CUSTODY_PRIVATE_SERVER_QUEUE_NAME: Joi.string().required(),
    RABBITMQ_CUSTODY_BRIDGE_QUEUE_NAME: Joi.string().required(),

    // Database configuration
    DATABASE_HOST: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_PORT: JoiNumberCasting.required(),

})
