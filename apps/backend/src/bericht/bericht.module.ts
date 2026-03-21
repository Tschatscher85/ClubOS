import { Module } from '@nestjs/common';
import { BerichtService } from './bericht.service';
import { BerichtController } from './bericht.controller';

@Module({
  controllers: [BerichtController],
  providers: [BerichtService],
  exports: [BerichtService],
})
export class BerichtModule {}
