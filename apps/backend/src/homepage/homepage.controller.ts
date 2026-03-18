import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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

  // ==================== Oeffentliche Endpoints (ohne Auth) ====================

  @Get('verein/:subdomain')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliche Vereinshomepage laden' })
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
}
