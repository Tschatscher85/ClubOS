import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HomepageService } from './homepage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Homepage')
@Controller('homepage')
export class HomepageController {
  constructor(private homepageService: HomepageService) {}

  // ==================== Admin-Endpoints (geschuetzt) ====================

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vereinshomepage abrufen (Admin)' })
  async abrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.homepageService.abrufen(tenantId);
  }

  @Post('admin/erstellen')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vereinshomepage erstellen/initialisieren' })
  async erstellen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.homepageService.erstellen(tenantId);
  }

  @Put('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vereinshomepage aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() daten: Record<string, unknown>,
  ) {
    return this.homepageService.aktualisieren(tenantId, daten as Parameters<typeof this.homepageService.aktualisieren>[1]);
  }

  @Post('admin/sektionen')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Neue Sektion zur Homepage hinzufuegen' })
  async sektionHinzufuegen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() daten: { typ: string; titel?: string; inhalt?: string; bildUrl?: string; reihenfolge?: number },
  ) {
    const homepage = await this.homepageService.abrufen(tenantId);
    return this.homepageService.sektionHinzufuegen(homepage.id, daten);
  }

  @Put('admin/sektionen/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Homepage-Sektion aktualisieren' })
  async sektionAktualisieren(
    @Param('id') id: string,
    @Body() daten: { titel?: string; inhalt?: string; bildUrl?: string; reihenfolge?: number; istSichtbar?: boolean },
  ) {
    return this.homepageService.sektionAktualisieren(id, daten);
  }

  @Delete('admin/sektionen/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Homepage-Sektion loeschen' })
  async sektionLoeschen(@Param('id') id: string) {
    await this.homepageService.sektionLoeschen(id);
    return { nachricht: 'Sektion geloescht.' };
  }

  @Post('admin/ki-generieren')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Homepage-Inhalte mit KI generieren' })
  @ApiResponse({ status: 200, description: 'KI-generierte Homepage' })
  @ApiResponse({ status: 400, description: 'KI nicht konfiguriert oder Fehler bei der Generierung' })
  async mitKiGenerieren(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.homepageService.mitKiGenerieren(tenantId);
  }

  // ==================== Turnier-Landingpages (Admin) ====================

  @Post('admin/turnier-landingpage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turnier-Landingpage erstellen' })
  async turnierLandingpageErstellen(
    @Body() daten: { tournamentId: string; slug: string; titel: string; beschreibung?: string; ort?: string; datum?: string },
  ) {
    return this.homepageService.turnierLandingpageErstellen(
      daten.tournamentId,
      daten,
    );
  }

  @Put('admin/turnier-landingpage/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turnier-Landingpage aktualisieren' })
  async turnierLandingpageAktualisieren(
    @Param('id') id: string,
    @Body() daten: Record<string, unknown>,
  ) {
    return this.homepageService.turnierLandingpageAktualisieren(id, daten as Parameters<typeof this.homepageService.turnierLandingpageAktualisieren>[1]);
  }

  // ==================== Event-Landingpages (Admin) ====================

  @Post('admin/event-landingpage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Event-Landingpage erstellen' })
  async eventLandingpageErstellen(
    @Body() daten: { eventId: string; slug: string; titel: string; beschreibung?: string; ort?: string; datum?: string; zeitplan?: string; anfahrt?: string; kontaktEmail?: string; kontaktTelefon?: string },
  ) {
    return this.homepageService.eventLandingpageErstellen(
      daten.eventId,
      daten,
    );
  }

  @Put('admin/event-landingpage/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Event-Landingpage aktualisieren' })
  async eventLandingpageAktualisieren(
    @Param('id') id: string,
    @Body() daten: Record<string, unknown>,
  ) {
    return this.homepageService.eventLandingpageAktualisieren(id, daten as Parameters<typeof this.homepageService.eventLandingpageAktualisieren>[1]);
  }

  // ==================== Oeffentliche Endpoints (ohne Auth) ====================

  @Get('public/:slug')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliche Vereinshomepage laden (per Slug)' })
  @ApiResponse({ status: 200, description: 'Homepage-Daten inkl. Tenant, Sektionen, Events' })
  @ApiResponse({ status: 404, description: 'Homepage nicht gefunden' })
  async oeffentlichLadenPerSlug(@Param('slug') slug: string) {
    return this.homepageService.oeffentlichLaden(slug);
  }

  @Get('public/:slug/teams')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliche Mannschaftsliste laden' })
  @ApiResponse({ status: 200, description: 'Teams des Vereins' })
  @ApiResponse({ status: 404, description: 'Verein nicht gefunden' })
  async oeffentlichTeamsLaden(@Param('slug') slug: string) {
    return this.homepageService.oeffentlichTeamsLaden(slug);
  }

  @Get('public/:slug/events')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliche Terminliste laden' })
  @ApiResponse({ status: 200, description: 'Kommende Events des Vereins' })
  @ApiResponse({ status: 404, description: 'Verein nicht gefunden' })
  async oeffentlichEventsLaden(@Param('slug') slug: string) {
    return this.homepageService.oeffentlichEventsLaden(slug);
  }

  @Get('verein/:subdomain')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliche Vereinshomepage laden (Legacy)' })
  @ApiResponse({ status: 200, description: 'Homepage-Daten' })
  @ApiResponse({ status: 404, description: 'Homepage nicht gefunden' })
  async oeffentlichLaden(@Param('subdomain') subdomain: string) {
    return this.homepageService.oeffentlichLaden(subdomain);
  }

  @Get('turnier/:slug')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliche Turnier-Landingpage laden' })
  @ApiResponse({ status: 200, description: 'Turnier-Landingpage' })
  @ApiResponse({ status: 404, description: 'Turnier nicht gefunden' })
  async turnierLandingpageOeffentlich(@Param('slug') slug: string) {
    return this.homepageService.turnierLandingpageOeffentlich(slug);
  }

  @Get('event/:slug')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliche Event-Landingpage laden' })
  @ApiResponse({ status: 200, description: 'Event-Landingpage mit Teilnahmestatistik' })
  @ApiResponse({ status: 404, description: 'Event nicht gefunden' })
  async eventLandingpageOeffentlich(@Param('slug') slug: string) {
    return this.homepageService.eventLandingpageOeffentlich(slug);
  }

  // ==================== Oeffentlicher Vereinskalender ====================

  @Get('public/:slug/kalender')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentlicher Vereinskalender (alle Events eines Monats)' })
  @ApiResponse({ status: 200, description: 'Events des Vereins fuer den angegebenen Monat' })
  @ApiResponse({ status: 404, description: 'Verein nicht gefunden' })
  async oeffentlicherKalender(
    @Param('slug') slug: string,
    @Query('monat') monat?: string,
  ) {
    return this.homepageService.oeffentlicherKalender(slug, monat);
  }
}
