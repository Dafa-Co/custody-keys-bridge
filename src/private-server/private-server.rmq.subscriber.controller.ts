import { Injectable, Req, Scope } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { _MessagePatterns, DBIdentifierRMQ } from 'rox-custody_common-modules/libs/utils/microservice-constants';
import { CustodyKeysBridgeTopicSubscribe } from 'src/libs/decorators/rabbit-topic-subscribe.decorator';
import { mobileKey } from 'rox-custody_common-modules/libs/interfaces/push-key-to-mobile.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { subDomainRequestKey } from 'src/libs/tenancy/utils';
import { KeysBridgeEvents } from 'src/libs/constant/events';


@Injectable()
export class PrivateServerRMQSubscriberController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @CustodyKeysBridgeTopicSubscribe()
  async notifyAllMobileApprovals(@Payload() data: mobileKey) {
    data[subDomainRequestKey] = data[DBIdentifierRMQ]
    this.eventEmitter.emit(KeysBridgeEvents.mobileKey, data);
  }
}
