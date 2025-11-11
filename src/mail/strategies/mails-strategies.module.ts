import { Module } from "@nestjs/common";
import { VerifyKeyMailOptionsStrategy } from "./verify-key.strategy";
import { MailOptionsFactory } from "./mail-options.factory";

@Module({
    providers: [VerifyKeyMailOptionsStrategy, MailOptionsFactory],
    exports: [MailOptionsFactory],
})
export class MailsStrategiesModule { }