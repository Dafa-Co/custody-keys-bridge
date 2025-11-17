import { Module } from '@nestjs/common';
import { SendGridEmailProviderStrategy } from './strategies/sendgrid-email-provider.strategy';
import { BrevoEmailProviderStrategy } from './strategies/brevo-email-provider.strategy';
import { MailtrapEmailProviderStrategy } from './strategies/mailtrap-email-provider.strategy';
import { EmailProviderFactory } from './strategies/mail-provider.factory';

@Module({
  providers: [
    SendGridEmailProviderStrategy,
    BrevoEmailProviderStrategy,
    MailtrapEmailProviderStrategy,
    EmailProviderFactory,
  ],
  exports: [EmailProviderFactory],
})
export class ProvidersModule {}
