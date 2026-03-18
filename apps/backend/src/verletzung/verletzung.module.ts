import { Module } from '@nestjs/common';
import { VerletzungService } from './verletzung.service';
import { VerletzungController } from './verletzung.controller';

@Module({
  controllers: [VerletzungController],
  providers: [VerletzungService],
  exports: [VerletzungService],
})
export class VerletzungModule {}
