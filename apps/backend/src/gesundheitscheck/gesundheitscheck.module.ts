import { Module } from '@nestjs/common';
import { GesundheitscheckService } from './gesundheitscheck.service';
import { GesundheitscheckController } from './gesundheitscheck.controller';

@Module({
  controllers: [GesundheitscheckController],
  providers: [GesundheitscheckService],
  exports: [GesundheitscheckService],
})
export class GesundheitscheckModule {}
