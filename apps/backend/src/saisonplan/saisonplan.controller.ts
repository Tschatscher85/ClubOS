import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  SaisonplanService,
  ErstelleSaisonplanDto,
  AktualisiereSaisonplanDto,
  ErstellePhaseDto,
  AktualisierePhaseDto,
} from './saisonplan.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Saisonplanung')
@Controller('saisonplan')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class SaisonplanController {
  constructor(private saisonplanService: SaisonplanService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neuen Saisonplan erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleSaisonplanDto,
  ) {
    return this.saisonplanService.erstellen(tenantId, userId, dto);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Saisonplaene eines Teams laden' })
  async fuerTeam(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.saisonplanService.fuerTeam(tenantId, teamId);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Saisonplan aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereSaisonplanDto,
  ) {
    return this.saisonplanService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Saisonplan loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.saisonplanService.loeschen(tenantId, id);
  }

  // ==================== Phasen ====================

  @Post(':id/phase')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Phase zum Saisonplan hinzufuegen' })
  async phaseHinzufuegen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') saisonplanId: string,
    @Body() dto: ErstellePhaseDto,
  ) {
    return this.saisonplanService.phaseHinzufuegen(
      tenantId,
      saisonplanId,
      dto,
    );
  }

  @Put('phase/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Phase aktualisieren' })
  async phaseAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') phaseId: string,
    @Body() dto: AktualisierePhaseDto,
  ) {
    return this.saisonplanService.phaseAktualisieren(
      tenantId,
      phaseId,
      dto,
    );
  }

  @Delete('phase/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Phase loeschen' })
  async phaseLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') phaseId: string,
  ) {
    return this.saisonplanService.phaseLoeschen(tenantId, phaseId);
  }

  // ==================== Events erstellen ====================

  @Post(':id/events-erstellen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({
    summary: 'Automatisch woechentliche Trainings-Events fuer alle Phasen erstellen',
  })
  async eventsErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') saisonplanId: string,
  ) {
    return this.saisonplanService.eventsErstellen(tenantId, saisonplanId);
  }
}
