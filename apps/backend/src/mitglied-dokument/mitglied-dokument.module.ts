import { Module } from '@nestjs/common';
import { MitgliedDokumentController } from './mitglied-dokument.controller';
import { MitgliedDokumentService } from './mitglied-dokument.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MitgliedDokumentController],
  providers: [MitgliedDokumentService],
})
export class MitgliedDokumentModule {}
