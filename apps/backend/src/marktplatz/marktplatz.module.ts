import { Module } from '@nestjs/common';
import { MarktplatzService } from './marktplatz.service';
import { MarktplatzController } from './marktplatz.controller';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  controllers: [MarktplatzController],
  providers: [MarktplatzService],
  exports: [MarktplatzService],
})
export class MarktplatzModule {}
