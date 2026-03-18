import { Module } from '@nestjs/common';
import { KasseService } from './kasse.service';
import { KasseController } from './kasse.controller';

@Module({
  controllers: [KasseController],
  providers: [KasseService],
  exports: [KasseService],
})
export class KasseModule {}
