import { Module } from '@nestjs/common';
import { PinboardService } from './pinboard.service';
import { PinboardController } from './pinboard.controller';

@Module({
  controllers: [PinboardController],
  providers: [PinboardService],
  exports: [PinboardService],
})
export class PinboardModule {}
