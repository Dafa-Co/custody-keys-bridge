import { Module } from "@nestjs/common";
import { VerifyKeyOptionsStrategy } from "./verify-key.strategy";
import { MailOptionsFactory } from "./mail-options.factory";

@Module({
    providers: [VerifyKeyOptionsStrategy, MailOptionsFactory],
    exports: [MailOptionsFactory],
})
export class MailsStrategiesModule { }