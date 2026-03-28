import { Module } from '@nestjs/common';
import { TrainingsprotokollService } from './trainingsprotokoll.service';
import { TrainingsprotokollController } from './trainingsprotokoll.controller';

@Module({
  controllers: [TrainingsprotokollController],
  providers: [TrainingsprotokollService],
  exports: [TrainingsprotokollService],
})
export class TrainingsprotokollModule {}
