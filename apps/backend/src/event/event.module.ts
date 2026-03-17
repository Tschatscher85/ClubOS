import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { SchnellAnmeldungController } from './schnell-anmeldung.controller';
import { ReminderService } from './reminder.service';

@Module({
  controllers: [EventController, SchnellAnmeldungController],
  providers: [EventService, ReminderService],
  exports: [EventService, ReminderService],
})
export class EventModule {}
