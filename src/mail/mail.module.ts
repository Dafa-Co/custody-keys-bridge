import { Module } from '@nestjs/common';
import { MailsStrategiesModule } from './strategies/mails-strategies.module';
import { MailsEventsService } from './services/mail.events.service';
import { MailOptionsFactory } from './strategies/mail-options.factory';
import { EmailProviderFactory } from './strategies/mail-provider.factory';
import { SendGridEmailProviderStrategy } from './strategies/sendgrid-email-provider.strategy';
import { BrevoEmailProviderStrategy } from './strategies/brevo-email-provider.strategy';
import { VerifyKeyOptionsStrategy } from './strategies/verify-key.strategy';

@Module({
  imports: [MailsStrategiesModule],
  providers: [
    MailsEventsService,
    MailOptionsFactory,
    EmailProviderFactory,
    SendGridEmailProviderStrategy,
    BrevoEmailProviderStrategy,
    VerifyKeyOptionsStrategy,
  ],
  exports: [MailOptionsFactory, EmailProviderFactory],
  controllers: [],
})
export class MailsModule {}
