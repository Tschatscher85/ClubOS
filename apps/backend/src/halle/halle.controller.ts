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
import { HalleService } from './halle.service';
import {
  ErstelleHalleDto,
  AktualisiereHalleDto,
  ErstelleBelegungDto,
} from './dto/erstelle-halle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { BerechtigungenGuard } from '../common/guards/berechtigungen.guard';
import { Berechtigungen } from '../common/decorators/berechtigungen.decorator';

@ApiTags('Hallen')
@Controller('hallen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard, BerechtigungenGuard)
@Berechtigungen('HALLENBELEGUNG')
@ApiBearerAuth()
export class HalleController {
  constructor(private halleService: HalleService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neue Halle erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleHalleDto,
  ) {
    return this.halleService.halleErstellen(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Hallen des Vereins abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.halleService.alleHallenAbrufen(tenantId);
  }

  @Get('wochenplan')
  @ApiOperation({ summary: 'Wochenplan aller Hallenbelegungen abrufen' })
  async wochenplan(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.halleService.wochenplan(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelne Halle abrufen' })
  async abrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.halleService.halleAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Halle aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereHalleDto,
  ) {
    return this.halleService.halleAktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Halle loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.halleService.halleLoeschen(tenantId, id);
    return { nachricht: 'Halle erfolgreich geloescht.' };
  }

  @Post(':id/belegung')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Belegung zu einer Halle hinzufuegen' })
  async belegungHinzufuegen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') halleId: string,
    @Body() dto: ErstelleBelegungDto,
  ) {
    return this.halleService.belegungHinzufuegen(tenantId, halleId, dto);
  }

  @Delete('belegung/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Belegung loeschen' })
  async belegungLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') belegungId: string,
  ) {
    await this.halleService.belegungLoeschen(tenantId, belegungId);
    return { nachricht: 'Belegung erfolgreich geloescht.' };
  }
}
