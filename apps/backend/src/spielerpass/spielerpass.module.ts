import { Module } from '@nestjs/common';
import { SpielerpassService } from './spielerpass.service';
import { SpielerpassController } from './spielerpass.controller';

@Module({
  controllers: [SpielerpassController],
  providers: [SpielerpassService],
  exports: [SpielerpassService],
})
export class SpielerpassModule {}
