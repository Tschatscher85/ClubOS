import { Module } from '@nestjs/common';
import { EhrenamtService } from './ehrenamt.service';
import { EhrenamtController } from './ehrenamt.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [EhrenamtController],
  providers: [EhrenamtService],
  exports: [EhrenamtService],
})
export class EhrenamtModule {}
