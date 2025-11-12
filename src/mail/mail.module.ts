import { Module } from '@nestjs/common';
import { MailsEventsService } from './services/mail.events.service';
import { ProvidersModule } from './providers/providers.module';
import { OptionsModule } from './options/options.module';

@Module({
  imports: [ProvidersModule, OptionsModule],
  providers: [MailsEventsService],
  exports: [MailsEventsService],
  controllers: [],
})
export class MailsModule {}
