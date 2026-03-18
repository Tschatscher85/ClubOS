import { Module } from '@nestjs/common';
import { TrainingsplanService } from './trainingsplan.service';
import { TrainingsplanController } from './trainingsplan.controller';

@Module({
  controllers: [TrainingsplanController],
  providers: [TrainingsplanService],
  exports: [TrainingsplanService],
})
export class TrainingsplanModule {}
