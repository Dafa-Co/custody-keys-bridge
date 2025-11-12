import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProviderStrategy,
  IEmailOptions,
} from '../../interfaces/email-provider-strategy.interface';
import { EmailProvider } from '../../enums/email-provider.enum';
import {
  SendSmtpEmail,
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from '@getbrevo/brevo';
import { configs } from 'src/configs/configs';

@Injectable()
export class BrevoEmailProviderStrategy implements IEmailProviderStrategy {
  private emailAPI: TransactionalEmailsApi;

  constructor() {
    this.emailAPI = new TransactionalEmailsApi();
    this.emailAPI.setApiKey(
      TransactionalEmailsApiApiKeys.apiKey,
      configs.BREVO_API_KEY,
    );
  }
  private readonly logger = new Logger(BrevoEmailProviderStrategy.name);

  getName(): EmailProvider {
    return EmailProvider.BREVO;
  }

  async send(mailOptions: IEmailOptions): Promise<void> {
    const sendSmtpEmail = this.mapToBrevoEmail(mailOptions);
    await this.emailAPI.sendTransacEmail(sendSmtpEmail);
  }

  private mapToBrevoEmail(mailOptions: IEmailOptions): SendSmtpEmail {
    const sendSmtpEmail = new SendSmtpEmail();

    sendSmtpEmail.sender = mailOptions.from;
    sendSmtpEmail.subject = mailOptions.subject;
    sendSmtpEmail.htmlContent = mailOptions.html;
    sendSmtpEmail.textContent = mailOptions.text;

    const toArray = Array.isArray(mailOptions.to)
      ? mailOptions.to
      : [mailOptions.to];
    sendSmtpEmail.to = toArray.map((email) => ({ email }));

    if (mailOptions.cc) {
      const ccArray = Array.isArray(mailOptions.cc)
        ? mailOptions.cc
        : [mailOptions.cc];
      sendSmtpEmail.cc = ccArray.map((email) => ({ email }));
    }

    if (mailOptions.bcc) {
      const bccArray = Array.isArray(mailOptions.bcc)
        ? mailOptions.bcc
        : [mailOptions.bcc];
      sendSmtpEmail.bcc = bccArray.map((email) => ({ email }));
    }

    if (mailOptions.replyTo) {
      sendSmtpEmail.replyTo = { email: mailOptions.replyTo };
    }

    if (mailOptions.attachments && mailOptions.attachments.length > 0) {
      sendSmtpEmail.attachment = mailOptions.attachments.map((att) => ({
        name: att.filename,
        content: Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : att.content,
      }));
    }

    return sendSmtpEmail;
  }
}
