import { Injectable, OnModuleInit } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { configs } from 'src/configs/configs';
import { EmailEvents } from 'src/libs/constant/events.constants';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { MailsStrategiesService } from './strategies/mails-strategies.service';
import { OnEventAck } from 'rox-custody_common-modules/libs/decorators/on-event-ack.decorator';
import { EmailsStrategies } from './interfaces/mails-strategy.interface';
import { ISendEmailEvent } from 'src/libs/dto/send-email-event.dto';

@Injectable()
export class MailsEventsService {
  constructor(
    private readonly mailsStrategiesService: MailsStrategiesService,
  ) {
    sgMail.setApiKey(configs.SENDGRID_API_KEY);
  }

  @OnEventAck(EmailEvents.sendEmail)
  async sendEmail<StrategyType extends keyof typeof EmailsStrategies>(
    emailEvent: ISendEmailEvent<StrategyType>,
  ) {
    await sgMail.send(await this.mailsStrategiesService.getMailOptions(
      emailEvent.type,
      emailEvent.emails,
      emailEvent.payload,
    ));
  }
}
