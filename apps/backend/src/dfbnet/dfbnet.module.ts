import { Module } from '@nestjs/common';
import { DfbnetService } from './dfbnet.service';
import { DfbnetController } from './dfbnet.controller';

@Module({
  controllers: [DfbnetController],
  providers: [DfbnetService],
  exports: [DfbnetService],
})
export class DfbnetModule {}
