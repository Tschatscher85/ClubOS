import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BuchhaltungService } from './buchhaltung.service';
import { ErstelleRechnungDto, ErstelleBeitragDto } from './dto/erstelle-rechnung.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Buchhaltung')
@Controller('buchhaltung')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class BuchhaltungController {
  constructor(private buchhaltungService: BuchhaltungService) {}

  // ==================== Rechnungen ====================

  @Post('rechnungen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Einzelne Rechnung erstellen' })
  async rechnungErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleRechnungDto,
  ) {
    return this.buchhaltungService.rechnungErstellen(tenantId, dto);
  }

  @Get('rechnungen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Rechnungen abrufen (optional nach Status/Mitglied filtern)' })
  async rechnungenAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('memberId') memberId?: string,
  ) {
    return this.buchhaltungService.rechnungenAbrufen(tenantId, status, memberId);
  }

  @Put('rechnungen/:id/bezahlt')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Rechnung als bezahlt markieren' })
  async alsBezahltMarkieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.buchhaltungService.alsBezahltMarkieren(tenantId, id);
  }

  @Put('rechnungen/:id/stornieren')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Rechnung stornieren' })
  async stornieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.buchhaltungService.stornieren(tenantId, id);
  }

  @Post('rechnungen/erstellen/:beitragId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Massenrechnungen fuer alle aktiven Mitglieder erstellen' })
  async rechnungenErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('beitragId') beitragId: string,
  ) {
    return this.buchhaltungService.rechnungenErstellen(tenantId, beitragId);
  }

  // ==================== Beitraege ====================

  @Post('beitraege')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Beitragsvorlage erstellen' })
  async beitragErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleBeitragDto,
  ) {
    return this.buchhaltungService.beitragErstellen(tenantId, dto);
  }

  @Get('beitraege')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Alle Beitragsvorlagen abrufen' })
  async beitraegeAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.buchhaltungService.beitraegeAbrufen(tenantId);
  }

  // ==================== Statistik & Export ====================

  @Get('statistik')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Finanzstatistik abrufen (offen, bezahlt, ueberfaellig)' })
  async statistik(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.buchhaltungService.statistik(tenantId);
  }

  @Get('datev-export')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'DATEV-Export als CSV (Zeitraum von-bis)' })
  async datevExport(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('von') von: string,
    @Query('bis') bis: string,
  ) {
    return this.buchhaltungService.datevExport(tenantId, von, bis);
  }
}
