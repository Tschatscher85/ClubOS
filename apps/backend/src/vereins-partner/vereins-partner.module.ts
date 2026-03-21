import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VereinsPartnerController } from './vereins-partner.controller';
import { VereinsPartnerService } from './vereins-partner.service';

@Module({
  imports: [PrismaModule],
  controllers: [VereinsPartnerController],
  providers: [VereinsPartnerService],
  exports: [VereinsPartnerService],
})
export class VereinsPartnerModule {}
