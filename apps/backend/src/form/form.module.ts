import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { KiKonvertierungService } from './ki-konvertierung.service';
import { PdfExportService } from './pdf-export.service';

@Module({
  controllers: [FormController],
  providers: [FormService, KiKonvertierungService, PdfExportService],
  exports: [FormService, KiKonvertierungService, PdfExportService],
})
export class FormModule {}
