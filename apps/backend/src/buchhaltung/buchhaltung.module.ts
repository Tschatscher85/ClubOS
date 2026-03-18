import { Module } from '@nestjs/common';
import { BuchhaltungService } from './buchhaltung.service';
import { BuchhaltungController } from './buchhaltung.controller';

@Module({
  controllers: [BuchhaltungController],
  providers: [BuchhaltungService],
  exports: [BuchhaltungService],
})
export class BuchhaltungModule {}
