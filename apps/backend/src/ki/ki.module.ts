import { Global, Module } from '@nestjs/common';
import { KiService } from './ki.service';

@Global()
@Module({
  providers: [KiService],
  exports: [KiService],
})
export class KiModule {}
