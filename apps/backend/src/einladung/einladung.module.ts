import { Module } from '@nestjs/common';
import { EinladungService } from './einladung.service';
import { EinladungController } from './einladung.controller';
import { EinladungPublicController } from './einladung-public.controller';
import { MailService } from './mail.service';

@Module({
  controllers: [EinladungController, EinladungPublicController],
  providers: [EinladungService, MailService],
  exports: [EinladungService, MailService],
})
export class EinladungModule {}
