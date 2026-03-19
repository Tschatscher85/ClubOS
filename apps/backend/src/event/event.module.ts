import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { SchnellAnmeldungController } from './schnell-anmeldung.controller';
import { ReminderService } from './reminder.service';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  controllers: [EventController, SchnellAnmeldungController],
  providers: [EventService, ReminderService],
  exports: [EventService, ReminderService],
})
export class EventModule {}
