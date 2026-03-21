import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { VertragService } from './vertrag.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { Role } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';

// ==================== Admin-Endpunkte (SUPERADMIN) ====================

@Controller('admin/vertraege')
@UseGuards(JwtAuthGuard, RollenGuard)
@Rollen(Role.SUPERADMIN)
export class VertragAdminController {
  constructor(private readonly vertragService: VertragService) {}

  /** Neuen Vertrag erstellen */
  @Post()
  async erstellen(
    @Body() body: { titel: string; inhalt: string },
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.vertragService.erstellen({
      titel: body.titel,
      inhalt: body.inhalt,
      erstelltVon: userId,
    });
  }

  /** Alle Vertraege auflisten */
  @Get()
  async alleAbrufen() {
    return this.vertragService.alleAbrufen();
  }

  /** Vertrag-Detail mit allen Einladungen */
  @Get(':id')
  async detailAbrufen(@Param('id') id: string) {
    return this.vertragService.detailAbrufen(id);
  }

  /** Vertrag aktualisieren */
  @Put(':id')
  async aktualisieren(
    @Param('id') id: string,
    @Body() body: { titel?: string; inhalt?: string },
  ) {
    return this.vertragService.aktualisieren(id, body);
  }

  /** Vertrag loeschen */
  @Delete(':id')
  async loeschen(@Param('id') id: string) {
    return this.vertragService.loeschen(id);
  }

  /** Person zur Unterschrift einladen */
  @Post(':id/einladen')
  async einladen(
    @Param('id') id: string,
    @Body() body: { email: string; name: string },
  ) {
    return this.vertragService.einladen(id, body.email, body.name);
  }

  /** Einladung entfernen */
  @Delete('einladung/:einladungId')
  async einladungEntfernen(@Param('einladungId') einladungId: string) {
    return this.vertragService.einladungEntfernen(einladungId);
  }
}

// ==================== Oeffentliche Endpunkte (Token-basiert) ====================

@Controller('vertrag/unterschreiben')
@SkipThrottle()
export class VertragPublicController {
  constructor(private readonly vertragService: VertragService) {}

  /** Vertrag per Token laden */
  @Get(':token')
  async vertragLaden(@Param('token') token: string) {
    return this.vertragService.vertragLaden(token);
  }

  /** Vertrag unterschreiben */
  @Post(':token')
  async unterschreiben(
    @Param('token') token: string,
    @Body() body: { unterschrift: string },
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unbekannt';

    return this.vertragService.unterschreiben(token, body.unterschrift, ip);
  }
}
