import { DynamicModule, Module } from '@nestjs/common';
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices';
import { getConsumerConfig, getPublisherConfig } from 'rox-custody_common-modules/libs/config/rmq.config';
import { configs } from 'src/configs/configs';

export enum RmqServiceServices {
  PrivateServer = 'PrivateServer',
  CustodySolution = 'CustodySolution',
}

@Module({
})
export class RmqModule {
  static register(service: RmqServiceServices): DynamicModule {
    const providers = [{
      provide: this.getProviderToken(service),
      useFactory: () => {
        const { queueName, serviceName } = this.getQueueConfig(service);
        return ClientProxyFactory.create(
          getPublisherConfig({
            clusterUrl: configs.RABBITMQ_URL,
            queueName: queueName,
          })
        );
      },
    }];

    return {
      module: RmqModule,
      providers: providers,
      exports: providers,
    };
  }



  private static getProviderToken(service: RmqServiceServices): string {
    switch (service) {
      case RmqServiceServices.PrivateServer:
        return configs.RABBITMQ_CUSTODY_PRIVATE_SERVER_SERVICE_NAME;
      case RmqServiceServices.CustodySolution:
        return configs.RABBITMQ_CUSTODY_SOLUTION_SERVICE_NAME;
      default:
        throw new Error(`Unsupported service type: ${service}`);
    }
  }

  private static getQueueConfig(service: RmqServiceServices): { queueName: string, serviceName: string } {
    switch (service) {
      case RmqServiceServices.PrivateServer:
        return {
          queueName: configs.RABBITMQ_CUSTODY_PRIVATE_SERVER_QUEUE_NAME,
          serviceName: configs.RABBITMQ_CUSTODY_PRIVATE_SERVER_SERVICE_NAME,
        };
      case RmqServiceServices.CustodySolution:
        return {
          queueName: configs.RABBITMQ_CUSTODY_SOLUTION_QUEUE_NAME,
          serviceName: configs.RABBITMQ_CUSTODY_SOLUTION_SERVICE_NAME,
        };
      default:
        throw new Error(`Unsupported service type: ${service}`);
    }
  }
}
