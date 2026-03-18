import { Module } from '@nestjs/common';
import { TrikotService } from './trikot.service';
import { TrikotController } from './trikot.controller';

@Module({
  controllers: [TrikotController],
  providers: [TrikotService],
  exports: [TrikotService],
})
export class TrikotModule {}
