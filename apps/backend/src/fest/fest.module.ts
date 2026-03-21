import { Module } from '@nestjs/common';
import { FestService } from './fest.service';
import { FestController } from './fest.controller';

@Module({
  controllers: [FestController],
  providers: [FestService],
  exports: [FestService],
})
export class FestModule {}
