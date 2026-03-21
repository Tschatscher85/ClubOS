import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MitgliedDokumentService } from './mitglied-dokument.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

const uploadConfig = {
  storage: diskStorage({
    destination: 'uploads/mitglied-dokumente',
    filename: (_req: any, file: any, cb: any) => {
      cb(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!file.mimetype.match(/^(application\/pdf|image\/(png|jpeg|jpg|webp))$/)) {
      cb(new Error('Nur PDF, PNG, JPG und WebP erlaubt.'), false);
      return;
    }
    cb(null, true);
  },
};

@ApiTags('Mitglied-Dokumente')
@Controller('mitglieder')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class MitgliedDokumentController {
  constructor(private readonly service: MitgliedDokumentService) {}

  /**
   * Dokument zu Mitglied hochladen (Scan, Foto, PDF)
   */
  @Post(':memberId/dokumente')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Dokument zu Mitglied hochladen (PDF, Scan, Kamerafoto)' })
  @UseInterceptors(FileInterceptor('datei', uploadConfig))
  async hochladen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('memberId') memberId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 })], // 20 MB
      }),
    )
    datei: Express.Multer.File,
    @Body()
    body: {
      name: string;
      kategorie?: string;
      beschreibung?: string;
      istFamilienantrag?: string;
    },
  ) {
    return this.service.hochladen(
      tenantId,
      memberId,
      userId,
      datei.filename,
      datei.size,
      datei.mimetype,
      body.name || datei.originalname,
      body.kategorie,
      body.beschreibung,
      body.istFamilienantrag === 'true',
    );
  }

  /**
   * Dokumente eines Mitglieds laden (DSGVO: rollenbasierter Zugriff)
   */
  @Get(':memberId/dokumente')
  @ApiOperation({ summary: 'Dokumente eines Mitglieds laden' })
  async laden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('memberId') memberId: string,
  ) {
    return this.service.fuerMitgliedLaden(tenantId, memberId, userId, rolle);
  }

  /**
   * Dokument loeschen
   */
  @Delete('dokumente/:dokumentId')
  @ApiOperation({ summary: 'Mitglied-Dokument loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('dokumentId') dokumentId: string,
  ) {
    return this.service.loeschen(tenantId, dokumentId, userId, rolle);
  }
}
