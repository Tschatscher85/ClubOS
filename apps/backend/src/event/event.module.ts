import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { SchnellAnmeldungController } from './schnell-anmeldung.controller';
import { CheckinController } from './checkin.controller';
import { ReminderService } from './reminder.service';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule, JwtModule.register({})],
  controllers: [EventController, SchnellAnmeldungController, CheckinController],
  providers: [EventService, ReminderService],
  exports: [EventService, ReminderService],
})
export class EventModule {}
