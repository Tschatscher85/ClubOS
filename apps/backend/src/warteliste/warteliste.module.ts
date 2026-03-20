import { Module, forwardRef } from '@nestjs/common';
import { WartelisteController } from './warteliste.controller';
import { WartelisteService } from './warteliste.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [forwardRef(() => QueueModule)],
  controllers: [WartelisteController],
  providers: [WartelisteService],
  exports: [WartelisteService],
})
export class WartelisteModule {}
