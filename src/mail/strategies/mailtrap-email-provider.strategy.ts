import { Injectable } from '@nestjs/common';
import { MailtrapClient } from 'mailtrap';
import {
  IEmailOptions,
  IEmailProviderStrategy,
} from '../interfaces/email-provider-strategy.interface';
import { EmailProvider } from '../enums/email-provider.enum';
import { configs } from 'src/configs/configs';

@Injectable()
export class MailtrapEmailProviderStrategy implements IEmailProviderStrategy {
  private readonly client: any;

  constructor() {
    const token = configs.MAILTRAP_TOKEN;

    if (!token) {
      // Falling back to a disabled client that will throw on send
      console.log('Mailtrap client not configured due to missing token');
      this.client = null;
    } else {
      console.log('Mailtrap client configured with token');
      this.client = new MailtrapClient({ token });
    }
  }

  async send(emailData: IEmailOptions): Promise<void> {
    console.log('Mail trap token', configs.MAILTRAP_TOKEN);
    if (!this.client) {
      throw new Error(
        'Mailtrap client is not configured (missing MAILTRAP_TOKEN)',
      );
    }

    const from = {
      name: configs.EMAIL_SENDER_NAME,
      email: configs.EMAIL_SENDER,
    };

    const to = Array.isArray(emailData.to)
      ? emailData.to.map((e) => ({ email: e }))
      : [{ email: emailData.to as string }];

    const cc = emailData.cc
      ? Array.isArray(emailData.cc)
        ? emailData.cc.map((e) => ({ email: e }))
        : [{ email: emailData.cc as string }]
      : undefined;

    const bcc = emailData.bcc
      ? Array.isArray(emailData.bcc)
        ? emailData.bcc.map((e) => ({ email: e }))
        : [{ email: emailData.bcc as string }]
      : undefined;

    const payload: any = {
      from,
      to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    };

    if (cc) payload.cc = cc;
    if (bcc) payload.bcc = bcc;
    if (emailData.replyTo) payload.reply_to = emailData.replyTo;

    if (emailData.attachments?.length) {
      payload.attachments = emailData.attachments.map((att) => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : Buffer.from(att.content as string).toString('base64'),
        content_type: att.contentType || 'application/octet-stream',
      }));
    }

    try {
      await this.client.send(payload);
    } catch (err: any) {
      throw new Error(`Failed to send via Mailtrap: ${err}`);
    }
  }

  getName(): EmailProvider {
    return EmailProvider.MAILTRAP;
  }
}
