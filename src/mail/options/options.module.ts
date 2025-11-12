import { Module } from '@nestjs/common';
import { VerifyKeyMailOptionsStrategy } from './strategies/verify-key.strategy';
import { MailOptionsFactory } from './strategies/mail-options.factory';

@Module({
  providers: [
    VerifyKeyMailOptionsStrategy,
    MailOptionsFactory,
  ],
  exports: [MailOptionsFactory],
})
export class OptionsModule {}
