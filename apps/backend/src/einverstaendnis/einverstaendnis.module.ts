import { Module } from '@nestjs/common';
import { EinverstaendnisController } from './einverstaendnis.controller';
import { EinverstaendnisService } from './einverstaendnis.service';

@Module({
  controllers: [EinverstaendnisController],
  providers: [EinverstaendnisService],
  exports: [EinverstaendnisService],
})
export class EinverstaendnisModule {}
