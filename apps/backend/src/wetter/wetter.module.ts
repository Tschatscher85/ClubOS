import { Module } from '@nestjs/common';
import { WetterService } from './wetter.service';
import { WetterController } from './wetter.controller';

@Module({
  controllers: [WetterController],
  providers: [WetterService],
  exports: [WetterService],
})
export class WetterModule {}
