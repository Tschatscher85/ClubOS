import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { VerletzungService } from './verletzung.service';
import { ErstelleVerletzungDto, AktualisiereVerletzungDto } from './dto/erstelle-verletzung.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Verletzungen')
@Controller('verletzungen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class VerletzungController {
  constructor(private verletzungService: VerletzungService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neue Verletzung erfassen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleVerletzungDto,
  ) {
    return this.verletzungService.erstellen(tenantId, userId, dto);
  }

  @Patch(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Verletzungsstatus aktualisieren (Reha, Fit, etc.)' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereVerletzungDto,
  ) {
    return this.verletzungService.aktualisieren(tenantId, id, dto);
  }

  @Get('mitglied/:memberId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Verletzungshistorie eines Mitglieds abrufen' })
  async fuerMitglied(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.verletzungService.fuerMitglied(tenantId, memberId);
  }

  @Get('team/:teamId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle aktuellen Verletzungen im Team' })
  async fuerTeam(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.verletzungService.fuerTeam(tenantId, teamId);
  }

  @Get('aktiv')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle aktiven Verletzungen im Verein' })
  async aktiveImVerein(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.verletzungService.aktiveImVerein(tenantId);
  }
}
