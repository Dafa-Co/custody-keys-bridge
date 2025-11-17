import { Injectable } from '@nestjs/common';
import { configs } from 'src/configs/configs';
import { EmailEvents } from 'src/libs/constant/events.constants';
import { OnEventAck } from 'rox-custody_common-modules/libs/decorators/on-event-ack.decorator';
import { MailOptionsFactory } from '../options/strategies/mail-options.factory';
import { ISendEmailEvent } from 'src/libs/dto/send-email-event.dto';
import { MailStrategyPayloads } from '../options/interfaces/mails-options-strategy.interface';
import { EmailProviderFactory } from '../providers/strategies/mail-provider.factory';

@Injectable()
export class MailsEventsService {
  constructor(
    private readonly mailOptionsFactory: MailOptionsFactory,
    private readonly emailProviderFactory: EmailProviderFactory,
  ) {}

  @OnEventAck(EmailEvents.sendEmail)
  async sendEmail<StrategyType extends keyof typeof MailStrategyPayloads>(
    emailEvent: ISendEmailEvent<StrategyType>,
  ) {
    const mailOptions = await this.mailOptionsFactory.create(
      emailEvent.type,
      emailEvent.emails,
      emailEvent.payload,
    );

    const result = await this.emailProviderFactory.sendWithFallback({
      from: {
        name: configs.EMAIL_SENDER_NAME,
        email: configs.EMAIL_SENDER,
      },
      to: emailEvent.emails,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
    });

    return result;
  }
}
