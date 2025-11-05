import { EmailProvider } from '../enums/email-provider.enum';

export interface IEmailOptions {
  from: { email: string; name?: string };
  to?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
    disposition?: string;
  }>;
  replyTo?: string;
}

export interface IEmailProviderStrategy {
  send(emailData: IEmailOptions): Promise<void>;
  getName(): EmailProvider;
}

