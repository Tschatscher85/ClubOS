import { Module } from '@nestjs/common';
import { DokumentService } from './dokument.service';
import { DokumentController } from './dokument.controller';

@Module({
  controllers: [DokumentController],
  providers: [DokumentService],
  exports: [DokumentService],
})
export class DokumentModule {}
