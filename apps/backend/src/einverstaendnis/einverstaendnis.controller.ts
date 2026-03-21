import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { EinverstaendnisService } from './einverstaendnis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Einverstaendnis')
@Controller('einverstaendnis')
export class EinverstaendnisController {
  constructor(private readonly service: EinverstaendnisService) {}

  /**
   * Einverstaendniserklaerung fuer ein Event erstellen (nur TRAINER/ADMIN)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Einverstaendniserklaerung erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() body: { eventId: string; titel: string; inhalt: string },
  ) {
    return this.service.erstellen(tenantId, body.eventId, body.titel, body.inhalt, userId);
  }

  /**
   * Einverstaendnis(se) fuer ein Event laden
   */
  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Einverstaendniserklaerungen fuer Event laden' })
  async fuerEventLaden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.service.fuerEventLaden(tenantId, eventId);
  }

  /**
   * Antwort auf Einverstaendnis (authentifiziert)
   */
  @Post(':id/antworten')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auf Einverstaendniserklaerung antworten' })
  async antworten(
    @Param('id') einverstaendnisId: string,
    @Body() body: {
      mitgliedId: string;
      elternName: string;
      zugestimmt: boolean;
      unterschrift?: string;
    },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '';
    return this.service.antworten(
      einverstaendnisId,
      body.mitgliedId,
      body.elternName,
      body.zugestimmt,
      body.unterschrift,
      ip,
    );
  }

  /**
   * Tokens fuer alle Team-Mitglieder generieren
   */
  @Post(':id/tokens')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tokens fuer Eltern generieren' })
  async tokensGenerieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') einverstaendnisId: string,
  ) {
    return this.service.tokensFuerEventGenerieren(tenantId, einverstaendnisId);
  }

  /**
   * Token-basierter Zugriff: Einverstaendnis laden (oeffentlich)
   */
  @Get('token/:token')
  @ApiOperation({ summary: 'Einverstaendniserklaerung per Token laden (oeffentlich)' })
  async tokenLaden(@Param('token') token: string) {
    return this.service.tokenLaden(token);
  }

  /**
   * Token-basierte Antwort (oeffentlich)
   */
  @Post('token/:token')
  @ApiOperation({ summary: 'Auf Einverstaendniserklaerung per Token antworten (oeffentlich)' })
  async tokenAntworten(
    @Param('token') token: string,
    @Body() body: {
      elternName: string;
      zugestimmt: boolean;
      unterschrift?: string;
    },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '';
    return this.service.tokenAntworten(
      token,
      body.elternName,
      body.zugestimmt,
      body.unterschrift,
      ip,
    );
  }
}
