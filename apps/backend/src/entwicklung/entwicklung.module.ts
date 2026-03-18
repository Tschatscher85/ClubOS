import { Module } from '@nestjs/common';
import { EntwicklungService } from './entwicklung.service';
import { EntwicklungController } from './entwicklung.controller';

@Module({
  controllers: [EntwicklungController],
  providers: [EntwicklungService],
  exports: [EntwicklungService],
})
export class EntwicklungModule {}
