import { Module } from '@nestjs/common';
import { EinladungService } from './einladung.service';
import { EinladungController } from './einladung.controller';
import { EinladungPublicController } from './einladung-public.controller';
import { MailService } from './mail.service';
import { EmailEinstellungenModule } from '../email/email-einstellungen.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EmailEinstellungenModule, PrismaModule],
  controllers: [EinladungController, EinladungPublicController],
  providers: [EinladungService, MailService],
  exports: [EinladungService, MailService],
})
export class EinladungModule {}
