import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { configs } from 'src/configs/configs';
import {
  IEmailProviderStrategy,
  IEmailOptions,
} from '../interfaces/email-provider-strategy.interface';
import { EmailProvider } from '../enums/email-provider.enum';

@Injectable()
export class SendGridEmailProviderStrategy implements IEmailProviderStrategy {
  private readonly logger = new Logger(SendGridEmailProviderStrategy.name);

  constructor() {
    sgMail.setApiKey(configs.SENDGRID_API_KEY);
  }

  getName(): EmailProvider {
    return EmailProvider.SENDGRID;
  }

  async send(emailData: IEmailOptions): Promise<void> {
    const mailOptions = {
      from: emailData.from.email,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    };
    await sgMail.send(mailOptions);
    this.logger.log(`Email sent succes sfully via SendGrid to ${emailData.to}`);
  }
}
