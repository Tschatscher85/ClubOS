import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { AenderungsantragService } from './aenderungsantrag.service';
import { AenderungsantragController } from './aenderungsantrag.controller';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  controllers: [MemberController, AenderungsantragController],
  providers: [MemberService, AenderungsantragService],
  exports: [MemberService],
})
export class MemberModule {}
