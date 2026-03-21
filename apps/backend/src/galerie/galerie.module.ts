import { Module } from '@nestjs/common';
import { GalerieController } from './galerie.controller';
import { GalerieService } from './galerie.service';

@Module({
  controllers: [GalerieController],
  providers: [GalerieService],
  exports: [GalerieService],
})
export class GalerieModule {}
