import { Module } from '@nestjs/common';
import { HalleService } from './halle.service';
import { HalleController } from './halle.controller';

@Module({
  controllers: [HalleController],
  providers: [HalleService],
  exports: [HalleService],
})
export class HalleModule {}
