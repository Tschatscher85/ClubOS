import { Module } from '@nestjs/common';
import { SportartService } from './sportart.service';
import { SportartController } from './sportart.controller';

@Module({
  controllers: [SportartController],
  providers: [SportartService],
  exports: [SportartService],
})
export class SportartModule {}
