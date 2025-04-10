import { Module } from "@nestjs/common";
import { VerifyKeyStrategy } from "./verify-key.strategy";
import { MailsStrategiesService } from "./mails-strategies.service";

@Module({
    providers: [VerifyKeyStrategy, MailsStrategiesService],
    exports: [MailsStrategiesService],
})
export class MailsStrategiesModule { }