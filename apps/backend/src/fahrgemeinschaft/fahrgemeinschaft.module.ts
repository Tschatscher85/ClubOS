import { Module } from '@nestjs/common';
import { FahrgemeinschaftService } from './fahrgemeinschaft.service';
import { FahrgemeinschaftController } from './fahrgemeinschaft.controller';

@Module({
  controllers: [FahrgemeinschaftController],
  providers: [FahrgemeinschaftService],
  exports: [FahrgemeinschaftService],
})
export class FahrgemeinschaftModule {}
