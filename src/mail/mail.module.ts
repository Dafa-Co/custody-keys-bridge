import { Module } from "@nestjs/common";
import { MailsStrategiesModule } from "./strategies/mails-strategies.module";
import { MailsEventsService } from "./services/mail.events.service";
import { MailOptionsFactory } from "./strategies/mail-options.factory";
import { EmailProviderFactory } from "./strategies/mail-provider.factory";
import { SendGridEmailProviderStrategy } from "./strategies/sendgrid-email-provider.strategy";
import { BrevoEmailProviderStrategy } from "./strategies/brevo-email-provider.strategy";
import { VerifyKeyOptionsStrategy } from "./strategies/verify-key.strategy";

@Module({
    imports: [
        MailsStrategiesModule,
    ],
    providers: [
        MailsEventsService,
        MailOptionsFactory,
        EmailProviderFactory,
        // concrete provider strategies (registered so factory can inject them)
        SendGridEmailProviderStrategy,
        BrevoEmailProviderStrategy,
        VerifyKeyOptionsStrategy,
    ],
    exports: [
        // export factories so other modules can reuse them if needed
        MailOptionsFactory,
        EmailProviderFactory,
    ],
    controllers: [],
})
export class MailsModule {}