import { Module } from "@nestjs/common";
import { MailsStrategiesModule } from "./strategies/mails-strategies.module";
import { MailsEventsService } from "./mail.events.controller";

@Module({
    imports: [
        MailsStrategiesModule,
    ],
    providers: [MailsEventsService],
    controllers: [],
})
export class MailsModule {}