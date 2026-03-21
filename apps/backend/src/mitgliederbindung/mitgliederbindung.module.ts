import { Module } from '@nestjs/common';
import { MitgliederbindungService } from './mitgliederbindung.service';
import { MitgliederbindungController } from './mitgliederbindung.controller';

@Module({
  controllers: [MitgliederbindungController],
  providers: [MitgliederbindungService],
  exports: [MitgliederbindungService],
})
export class MitgliederbindungModule {}
