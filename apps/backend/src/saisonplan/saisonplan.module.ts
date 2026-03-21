import { Module } from '@nestjs/common';
import { SaisonplanService } from './saisonplan.service';
import { SaisonplanController } from './saisonplan.controller';

@Module({
  controllers: [SaisonplanController],
  providers: [SaisonplanService],
  exports: [SaisonplanService],
})
export class SaisonplanModule {}
