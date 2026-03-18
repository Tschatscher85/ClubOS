import { Module } from '@nestjs/common';
import { SpielberichtService } from './spielbericht.service';
import { SpielberichtController } from './spielbericht.controller';

@Module({
  controllers: [SpielberichtController],
  providers: [SpielberichtService],
  exports: [SpielberichtService],
})
export class SpielberichtModule {}
