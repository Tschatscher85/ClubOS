import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { EmailProcessor } from './email.processor';
import { ReminderProcessor } from './reminder.processor';
import { GeburtstagProcessor } from './geburtstag.processor';
import { WartelisteProcessor } from './warteliste.processor';
import { MitgliederbindungProcessor } from './mitgliederbindung.processor';
import { EinladungModule } from '../einladung/einladung.module';
import { WartelisteModule } from '../warteliste/warteliste.module';
import { MitgliederbindungModule } from '../mitgliederbindung/mitgliederbindung.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url') || 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          redis: {
            host: url.hostname,
            port: parseInt(url.port, 10) || 6379,
            password: url.password || undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'erinnerung' },
      { name: 'benachrichtigung' },
      { name: 'geburtstag' },
      { name: 'warteliste' },
      { name: 'mitgliederbindung' },
    ),
    EinladungModule,
    forwardRef(() => WartelisteModule),
    MitgliederbindungModule,
  ],
  providers: [QueueService, EmailProcessor, ReminderProcessor, GeburtstagProcessor, WartelisteProcessor, MitgliederbindungProcessor],
  exports: [QueueService],
})
export class QueueModule {}
