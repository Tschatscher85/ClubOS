import { Module } from '@nestjs/common';
import { VersicherungService } from './versicherung.service';
import { VersicherungController } from './versicherung.controller';

@Module({
  controllers: [VersicherungController],
  providers: [VersicherungService],
  exports: [VersicherungService],
})
export class VersicherungModule {}
