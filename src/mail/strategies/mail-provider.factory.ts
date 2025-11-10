import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../enums/email-provider.enum';
import {
  IEmailProviderStrategy,
  IEmailOptions,
} from '../interfaces/email-provider-strategy.interface';
import { SendGridEmailProviderStrategy } from './sendgrid-email-provider.strategy';
import { BrevoEmailProviderStrategy } from './brevo-email-provider.strategy';
import { configs } from 'src/configs/configs';

@Injectable()
export class EmailProviderFactory {
  private readonly logger = new Logger(EmailProviderFactory.name);
  private readonly strategies: Map<EmailProvider, IEmailProviderStrategy>;
  private readonly fallbackOrder: EmailProvider[];

  constructor(
    private readonly sendGridStrategy: SendGridEmailProviderStrategy,
    private readonly brevoStrategy: BrevoEmailProviderStrategy,
  ) {
    this.strategies = new Map<EmailProvider, IEmailProviderStrategy>([
      [EmailProvider.SENDGRID, sendGridStrategy],
      [EmailProvider.BREVO, brevoStrategy],
    ]);

    this.fallbackOrder = this.parseFallbackOrder(
      configs.EMAIL_PROVIDER_FALLBACK_ORDER,
    );

    this.logger.log(
      `Email provider fallback order: ${this.fallbackOrder.join(' → ')}`,
    );
  }

  private parseFallbackOrder(orderString: string): EmailProvider[] {
    return orderString
      .split(',')
      .map((p) => p.trim() as EmailProvider)
      .filter((p) => Object.values(EmailProvider).includes(p));
  }

  getProvider(provider: EmailProvider): IEmailProviderStrategy {
    const strategy = this.strategies.get(provider);
    if (!strategy) {
      throw new Error(`Unknown email provider: ${provider}`);
    }
    return strategy;
  }

  async sendWithFallback(
    emailData: IEmailOptions,
  ): Promise<{ provider: EmailProvider; success: boolean }> {
    const errors: Array<{ provider: EmailProvider; error: Error }> = [];

    for (const provider of this.fallbackOrder) {
      try {
        this.logger.log(`Attempting to send email via ${provider}...`);
        const strategy = this.getProvider(provider);

        await strategy.send(emailData);

        this.logger.log(`Email sent successfully via ${provider}`);

        return { provider, success: true };
      } catch (error) {
        this.logger.error(`Failed to send via ${provider}: ${error.message}`);
        errors.push({ provider, error });

        continue;
      }
    }

    const errorMessage = errors
      .map((e) => `${e.provider}: ${e.error.message}`)
      .join('; ');

    this.logger.error(`All email providers failed`);

    throw new Error(
      `Failed to send email through all available providers: ${errorMessage}`,
    );
  }

  getFallbackOrder(): EmailProvider[] {
    return [...this.fallbackOrder];
  }
}
