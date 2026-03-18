import { Module } from '@nestjs/common';
import { AbteilungService } from './abteilung.service';
import { AbteilungController } from './abteilung.controller';

@Module({
  controllers: [AbteilungController],
  providers: [AbteilungService],
  exports: [AbteilungService],
})
export class AbteilungModule {}
