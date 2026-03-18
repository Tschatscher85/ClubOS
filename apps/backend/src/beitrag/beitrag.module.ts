import { Module } from '@nestjs/common';
import { BeitragService } from './beitrag.service';
import { BeitragController } from './beitrag.controller';

@Module({
  controllers: [BeitragController],
  providers: [BeitragService],
  exports: [BeitragService],
})
export class BeitragModule {}
