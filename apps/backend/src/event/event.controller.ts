import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { EventService } from './event.service';
import { ErstelleEventDto, AktualisiereEventDto } from './dto/erstelle-event.dto';
import { AnmeldungDto } from './dto/anmeldung.dto';
import { KommentarDto } from './dto/kommentar.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { BerechtigungenGuard } from '../common/guards/berechtigungen.guard';
import { Berechtigungen } from '../common/decorators/berechtigungen.decorator';

@ApiTags('Veranstaltungen')
@Controller('veranstaltungen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard, BerechtigungenGuard)
@Berechtigungen('KALENDER')
@ApiBearerAuth()
export class EventController {
  constructor(private eventService: EventService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neue Veranstaltung erstellen (mit optionaler Wiederholung)' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleEventDto,
  ) {
    return this.eventService.erstellen(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Veranstaltungen abrufen (inkl. Anmeldestatus)' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.eventService.alleAbrufen(tenantId);
  }

  @Get('kommende')
  @ApiOperation({ summary: 'Kommende Veranstaltungen abrufen (inkl. Anmeldestatus)' })
  async kommendeAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.eventService.kommendeAbrufen(tenantId);
  }

  @Get('naechstes')
  @ApiOperation({ summary: 'Naechste Veranstaltung abrufen' })
  async naechstesEvent(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.eventService.naechstesEvent(tenantId);
  }

  // ==================== Eltern-Portal ====================

  @Get('meine-kinder')
  @Rollen(Role.PARENT)
  @ApiOperation({ summary: 'Veranstaltungen der eigenen Kinder abrufen (Eltern-Portal)' })
  async eventsFuerEltern(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('email') elternEmail: string,
  ) {
    return this.eventService.eventsFuerEltern(tenantId, elternEmail);
  }

  // ==================== Anwesenheitsstatistik ====================

  @Get('statistik/mitglied/:memberId')
  @ApiOperation({ summary: 'Anwesenheitsstatistik eines Mitglieds abrufen' })
  async anwesenheitsStatistik(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.eventService.anwesenheitsStatistik(tenantId, memberId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Veranstaltung nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.eventService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Veranstaltung aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereEventDto,
  ) {
    return this.eventService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Veranstaltung loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.eventService.loeschen(tenantId, id);
    return { nachricht: 'Veranstaltung erfolgreich geloescht.' };
  }

  // ==================== An-/Abmeldung ====================

  @Post(':id/anmeldung')
  @ApiOperation({ summary: 'An-/Abmeldung fuer eine Veranstaltung' })
  async anmeldungSetzen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') eventId: string,
    @Body() dto: AnmeldungDto,
  ) {
    return this.eventService.anmeldungSetzen(tenantId, eventId, dto);
  }

  @Get(':id/anmeldung')
  @ApiOperation({ summary: 'Alle An-/Abmeldungen einer Veranstaltung' })
  async anmeldungenAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') eventId: string,
  ) {
    return this.eventService.anmeldungenAbrufen(tenantId, eventId);
  }

  // ==================== Schnell-Anmeldung Tokens ====================

  @Post(':id/schnell-tokens')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Schnell-Anmeldung-Tokens fuer Teammitglieder generieren' })
  async schnellTokensGenerieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') eventId: string,
  ) {
    return this.eventService.schnellTokensGenerieren(tenantId, eventId);
  }

  // ==================== CSV-Export ====================

  @Get(':id/export/csv')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Anwesenheitsliste als CSV exportieren' })
  async anwesenheitAlsCsv(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') eventId: string,
    @Res() res: Response,
  ) {
    const csv = await this.eventService.anwesenheitAlsCsv(tenantId, eventId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="anwesenheit-${eventId}.csv"`);
    res.send(csv);
  }

  // ==================== Kommentare ====================

  @Post(':id/kommentare')
  @ApiOperation({ summary: 'Kommentar zu einer Veranstaltung schreiben' })
  async kommentarErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('id') eventId: string,
    @Body() dto: KommentarDto,
  ) {
    return this.eventService.kommentarErstellen(tenantId, eventId, userId, dto);
  }

  @Get(':id/kommentare')
  @ApiOperation({ summary: 'Alle Kommentare einer Veranstaltung' })
  async kommentareAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') eventId: string,
  ) {
    return this.eventService.kommentareAbrufen(tenantId, eventId);
  }
}
