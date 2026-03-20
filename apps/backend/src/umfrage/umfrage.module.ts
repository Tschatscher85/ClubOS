import { Module } from '@nestjs/common';
import { UmfrageService } from './umfrage.service';
import { UmfrageController } from './umfrage.controller';

@Module({
  controllers: [UmfrageController],
  providers: [UmfrageService],
  exports: [UmfrageService],
})
export class UmfrageModule {}
