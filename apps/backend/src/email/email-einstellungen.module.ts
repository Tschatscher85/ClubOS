import { Module } from '@nestjs/common';
import { EmailEinstellungenService } from './email-einstellungen.service';
import { EmailEinstellungenController } from './email-einstellungen.controller';

@Module({
  controllers: [EmailEinstellungenController],
  providers: [EmailEinstellungenService],
  exports: [EmailEinstellungenService],
})
export class EmailEinstellungenModule {}
