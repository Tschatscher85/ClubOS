import { Module } from '@nestjs/common';
import { AushangService } from './aushang.service';
import { AushangController } from './aushang.controller';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  controllers: [AushangController],
  providers: [AushangService],
  exports: [AushangService],
})
export class AushangModule {}
