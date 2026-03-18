import { Module } from '@nestjs/common';
import { AufstellungService } from './aufstellung.service';
import { AufstellungController } from './aufstellung.controller';

@Module({
  controllers: [AufstellungController],
  providers: [AufstellungService],
  exports: [AufstellungService],
})
export class AufstellungModule {}
