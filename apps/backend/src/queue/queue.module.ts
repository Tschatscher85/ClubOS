import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { EmailProcessor } from './email.processor';
import { ReminderProcessor } from './reminder.processor';
import { GeburtstagProcessor } from './geburtstag.processor';
import { EinladungModule } from '../einladung/einladung.module';

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
    ),
    EinladungModule,
  ],
  providers: [QueueService, EmailProcessor, ReminderProcessor, GeburtstagProcessor],
  exports: [QueueService],
})
export class QueueModule {}
