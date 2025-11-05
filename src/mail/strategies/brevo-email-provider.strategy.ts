import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProviderStrategy,
  IEmailOptions,
} from '../interfaces/email-provider-strategy.interface';
import { EmailProvider } from '../enums/email-provider.enum';

@Injectable()
export class BrevoEmailProviderStrategy implements IEmailProviderStrategy {
  constructor() {}
  private readonly logger = new Logger(BrevoEmailProviderStrategy.name);

  getName(): EmailProvider {
    return EmailProvider.BREVO;
  }

  async send(emailData: IEmailOptions): Promise<void> {
    console.log('Sending via Brevo:', emailData);
  }
}
