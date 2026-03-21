import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KooperationspartnerController } from './kooperationspartner.controller';
import { KooperationspartnerService } from './kooperationspartner.service';

@Module({
  imports: [PrismaModule],
  controllers: [KooperationspartnerController],
  providers: [KooperationspartnerService],
  exports: [KooperationspartnerService],
})
export class KooperationspartnerModule {}
