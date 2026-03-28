import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TournamentService } from './tournament.service';
import {
  ErstelleTurnierDto,
  AktualisiereTurnierDto,
  ErstelleSpielDto,
  AktualisiereSpielDto,
} from './dto/erstelle-turnier.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Turniere')
@Controller('turniere')
export class TournamentController {
  constructor(private tournamentService: TournamentService) {}

  // ==================== Oeffentlicher Zugriff ====================

  @Get('live/:publicUrl')
  @ApiOperation({ summary: 'Turnier oeffentlich abrufen (fuer Leinwand/QR-Code)' })
  async oeffentlich(@Param('publicUrl') publicUrl: string) {
    return this.tournamentService.nachPublicUrl(publicUrl);
  }

  // ==================== Authentifizierte Endpunkte ====================

  @Post()
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Neues Turnier erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleTurnierDto,
  ) {
    return this.tournamentService.erstellen(tenantId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alle Turniere abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.tournamentService.alleAbrufen(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turnier nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.tournamentService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turnier aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereTurnierDto,
  ) {
    return this.tournamentService.aktualisieren(tenantId, id, dto);
  }

  @Patch(':id/live')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turnier live schalten / beenden' })
  async liveSchalten(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('isLive') isLive: boolean,
  ) {
    return this.tournamentService.liveSchalten(tenantId, id, isLive);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turnier loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.tournamentService.loeschen(tenantId, id);
    return { nachricht: 'Turnier erfolgreich geloescht.' };
  }

  // ==================== Spiele ====================

  @Post(':id/spiele')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Spiel zum Turnier hinzufuegen' })
  async spielHinzufuegen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') turnierId: string,
    @Body() dto: ErstelleSpielDto,
  ) {
    return this.tournamentService.spielHinzufuegen(tenantId, turnierId, dto);
  }

  @Put(':id/spiele/:spielId')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Spielergebnis aktualisieren (Livescoring)' })
  async spielAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') turnierId: string,
    @Param('spielId') spielId: string,
    @Body() dto: AktualisiereSpielDto,
  ) {
    return this.tournamentService.spielAktualisieren(
      tenantId,
      turnierId,
      spielId,
      dto,
    );
  }

  @Delete(':id/spiele/:spielId')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Spiel loeschen' })
  async spielLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') turnierId: string,
    @Param('spielId') spielId: string,
  ) {
    await this.tournamentService.spielLoeschen(tenantId, turnierId, spielId);
    return { nachricht: 'Spiel erfolgreich geloescht.' };
  }

  // ==================== Spielplan-Generator ====================

  @Post(':id/spielplan-generieren')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Spielplan automatisch generieren (Gruppenphase)' })
  async spielplanGenerieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') turnierId: string,
    @Body() body: {
      teams: string[];
      startzeit: string;
      spielDauerMinuten: number;
      pufferMinuten: number;
      felder?: string[];
    },
  ) {
    return this.tournamentService.spielplanGenerieren(
      tenantId,
      turnierId,
      body.teams,
      body.startzeit,
      body.spielDauerMinuten,
      body.pufferMinuten,
      body.felder,
    );
  }

  // ==================== Zeiten synchronisieren ====================

  @Put(':id/zeiten-sync')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Spielzeiten ab einem Spiel neu berechnen' })
  async zeitenSync(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') turnierId: string,
    @Body() body: {
      abSpielId: string;
      startzeit: string;
      spielDauerMinuten: number;
      pufferMinuten: number;
    },
  ) {
    return this.tournamentService.zeitenSync(
      tenantId,
      turnierId,
      body.abSpielId,
      body.startzeit,
      body.spielDauerMinuten,
      body.pufferMinuten,
    );
  }
}
