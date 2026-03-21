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
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GalerieService } from './galerie.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Galerie')
@Controller('galerie')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class GalerieController {
  constructor(private readonly service: GalerieService) {}

  /**
   * Foto hochladen (TRAINER/ADMIN)
   */
  @Post('upload')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Foto hochladen' })
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: 'uploads/galerie',
        filename: (_req, file, cb) => {
          const name = randomBytes(16).toString('hex');
          cb(null, `galerie-${name}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(png|jpeg|jpg|webp|gif)$/)) {
          cb(new Error('Nur PNG, JPG, WebP und GIF erlaubt.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async hochladen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })], // 10 MB
      }),
    )
    datei: Express.Multer.File,
    @Body() body: { teamId?: string; eventId?: string; beschreibung?: string },
  ) {
    return this.service.fotoHochladen(
      tenantId,
      userId,
      datei.filename,
      body.teamId,
      body.eventId,
      body.beschreibung,
    );
  }

  /**
   * Alle Fotos des Vereins laden
   */
  @Get()
  @ApiOperation({ summary: 'Alle Fotos des Vereins' })
  async alleLaden(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.service.alleLaden(tenantId);
  }

  /**
   * Fotos fuer ein Team laden
   */
  @Get('team/:teamId')
  @ApiOperation({ summary: 'Fotos fuer ein Team' })
  async fuerTeam(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.service.fuerTeamLaden(tenantId, teamId);
  }

  /**
   * Fotos fuer ein Event laden
   */
  @Get('event/:eventId')
  @ApiOperation({ summary: 'Fotos fuer ein Event' })
  async fuerEvent(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.service.fuerEventLaden(tenantId, eventId);
  }

  /**
   * Foto loeschen (Uploader oder ADMIN)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Foto loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') fotoId: string,
  ) {
    return this.service.loeschen(tenantId, fotoId, userId, rolle);
  }
}
