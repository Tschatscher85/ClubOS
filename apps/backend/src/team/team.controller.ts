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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TeamService } from './team.service';
import { ErstelleTeamDto, AktualisiereTeamDto } from './dto/erstelle-team.dto';
import { MitgliedHinzufuegenDto } from './dto/team-mitglied.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { BerechtigungenGuard } from '../common/guards/berechtigungen.guard';
import { Berechtigungen } from '../common/decorators/berechtigungen.decorator';

@ApiTags('Teams')
@Controller('teams')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard, BerechtigungenGuard)
@Berechtigungen('TEAMS')
@ApiBearerAuth()
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neues Team erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleTeamDto,
  ) {
    return this.teamService.erstellen(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Teams des Vereins abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.teamService.alleAbrufen(tenantId);
  }

  @Get('meine')
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Nur eigene Teams abrufen (Trainer-Filter)' })
  async meineTeams(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.teamService.meineTeams(tenantId, userId);
  }

  @Get('statistik')
  @ApiOperation({ summary: 'Team-Statistik abrufen' })
  async statistik(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.teamService.statistik(tenantId);
  }

  @Get(':id/anwesenheit')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Anwesenheitsstatistik eines Teams abrufen' })
  async anwesenheitStatistik(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') teamId: string,
    @Query('wochen') wochen?: string,
  ) {
    const anzahlWochen = wochen ? parseInt(wochen, 10) : 12;
    return this.teamService.anwesenheitStatistik(
      tenantId,
      teamId,
      isNaN(anzahlWochen) ? 12 : anzahlWochen,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Team nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.teamService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Team aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereTeamDto,
  ) {
    return this.teamService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Team loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.teamService.loeschen(tenantId, id);
    return { nachricht: 'Team erfolgreich geloescht.' };
  }

  // ==================== Kader-Endpoints ====================

  @Get(':id/mitglieder')
  @ApiOperation({ summary: 'Alle Mitglieder eines Teams abrufen' })
  async mitgliederAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') teamId: string,
  ) {
    return this.teamService.mitgliederAbrufen(tenantId, teamId);
  }

  @Post(':id/mitglieder')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglied zum Team hinzufuegen' })
  async mitgliedHinzufuegen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') teamId: string,
    @Body() dto: MitgliedHinzufuegenDto,
  ) {
    return this.teamService.mitgliedHinzufuegen(tenantId, teamId, dto);
  }

  @Delete(':id/mitglieder/:memberId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglied aus Team entfernen' })
  async mitgliedEntfernen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') teamId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.teamService.mitgliedEntfernen(tenantId, teamId, memberId);
    return { nachricht: 'Mitglied erfolgreich aus dem Team entfernt.' };
  }
}
