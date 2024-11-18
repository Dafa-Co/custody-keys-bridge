import { RabbitSubscribe, RabbitHandlerConfig } from '@golevelup/nestjs-rabbitmq';
import { RMQ_KEYS_BRIDGE_FANOUT_EXCHANGE } from '../constant/constant';

type CustodySubscribeOptions = Pick<
  RabbitHandlerConfig,
  'queue' | 'exchange' | 'routingKey' | 'queueOptions' | 'createQueueIfNotExists'
>;

export function CustodyKeysBridgeTopicSubscribe(options: Partial<CustodySubscribeOptions> = {}) {
  const defaultOptions: CustodySubscribeOptions = {
    exchange: RMQ_KEYS_BRIDGE_FANOUT_EXCHANGE,
    routingKey: 'bridge.*',
    queue: '', // Generate unique queue name
    queueOptions: {
      exclusive: true,
      autoDelete: true,
    },
    createQueueIfNotExists: true,
  };

  const finalOptions = { ...defaultOptions, ...options };

  return (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => {
    // Preserve original method
    const originalMethod = descriptor?.value;

    // Apply RabbitSubscribe decorator
    RabbitSubscribe(finalOptions)(target, propertyKey, descriptor);

    // Bind the method to the class instance
    descriptor!.value = function (...args: any[]) {
      return originalMethod.apply(this, args); // Bind `this` to the class instance
    };
  };
}
