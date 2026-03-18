import { Module } from '@nestjs/common';
import { BuchungService } from './buchung.service';
import { BuchungController } from './buchung.controller';

@Module({
  controllers: [BuchungController],
  providers: [BuchungService],
  exports: [BuchungService],
})
export class BuchungModule {}
