import { RabbitSubscribe, RabbitHandlerConfig } from '@golevelup/nestjs-rabbitmq';
import { configs } from 'src/configs/configs';

type CustodySubscribeOptions = Pick<
  RabbitHandlerConfig,
  'queue' | 'exchange' | 'routingKey' | 'queueOptions' | 'createQueueIfNotExists'
>;

export function CustodyKeysBridgeTopicSubscribe(options: Partial<CustodySubscribeOptions> = {}) {
  const defaultOptions: CustodySubscribeOptions = {
    exchange: configs.RMQ_KEYS_BRIDGE_FANOUT_EXCHANGE,
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
    // Apply RabbitSubscribe decorator
    RabbitSubscribe(finalOptions)(target, propertyKey, descriptor);
  };
}
