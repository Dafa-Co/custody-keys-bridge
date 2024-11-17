// decorators/rabbit-topic-subscribe.decorator.ts
import { RabbitSubscribe, RabbitHandlerConfig } from '@golevelup/nestjs-rabbitmq';

type CustodySubscribeOptions = Pick<RabbitHandlerConfig, "queue" | "exchange" | "routingKey" | "queueOptions" | "createQueueIfNotExists">;

export function CustodyKeysBridgeTopicSubscribe(options: Partial<CustodySubscribeOptions> = {}) {
  // Default settings for the topic exchange
  const defaultOptions: CustodySubscribeOptions = {
    exchange: '',
    routingKey: 'custody.*', // Default routing key pattern
    queue: '', // Generate unique queue name
    queueOptions: {
      exclusive: true,
      autoDelete: true
    },
    createQueueIfNotExists: true
  };

  // Merge default options with user-provided options
  const finalOptions = { ...defaultOptions, ...options };

  // Apply the RabbitSubscribe decorator with merged options
  return (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => {
    RabbitSubscribe(finalOptions)(target, propertyKey, descriptor);
  };
}



export function CustodyKeysBridgeDirectExchange() {

}
