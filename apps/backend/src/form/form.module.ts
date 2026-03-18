import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { KiKonvertierungService } from './ki-konvertierung.service';

@Module({
  controllers: [FormController],
  providers: [FormService, KiKonvertierungService],
  exports: [FormService, KiKonvertierungService],
})
export class FormModule {}
