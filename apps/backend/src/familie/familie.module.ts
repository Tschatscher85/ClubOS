import { Module } from '@nestjs/common';
import { FamilieService } from './familie.service';
import { FamilieController } from './familie.controller';

@Module({
  controllers: [FamilieController],
  providers: [FamilieService],
  exports: [FamilieService],
})
export class FamilieModule {}
