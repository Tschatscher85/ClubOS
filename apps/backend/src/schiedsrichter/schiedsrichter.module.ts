import { Module } from '@nestjs/common';
import { SchiedsrichterService } from './schiedsrichter.service';
import { SchiedsrichterController } from './schiedsrichter.controller';

@Module({
  controllers: [SchiedsrichterController],
  providers: [SchiedsrichterService],
  exports: [SchiedsrichterService],
})
export class SchiedsrichterModule {}
