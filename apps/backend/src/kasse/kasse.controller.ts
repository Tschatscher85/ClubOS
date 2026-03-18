import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { KasseService } from './kasse.service';
import {
  StrafeErstellenDto,
  EinzahlungErstellenDto,
  AusgabeErstellenDto,
  StrafkatalogErstellenDto,
} from './dto/kasse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Mannschaftskasse')
@Controller('kasse')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class KasseController {
  constructor(private kasseService: KasseService) {}

  @Get(':teamId')
  @ApiOperation({ summary: 'Kassenstand und letzte 20 Buchungen abrufen' })
  async kassenstandAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.kasseService.kassenstandAbrufen(tenantId, teamId);
  }

  @Post(':teamId/strafe')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Strafe verhaengen' })
  async strafeVerhaengen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('teamId') teamId: string,
    @Body() dto: StrafeErstellenDto,
  ) {
    return this.kasseService.strafeVerhaengen(tenantId, teamId, userId, dto);
  }

  @Post(':teamId/einzahlung')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Einzahlung buchen' })
  async einzahlungBuchen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('teamId') teamId: string,
    @Body() dto: EinzahlungErstellenDto,
  ) {
    return this.kasseService.einzahlungBuchen(tenantId, teamId, userId, dto);
  }

  @Post(':teamId/ausgabe')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Ausgabe buchen' })
  async ausgabeBuchen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('teamId') teamId: string,
    @Body() dto: AusgabeErstellenDto,
  ) {
    return this.kasseService.ausgabeBuchen(tenantId, teamId, userId, dto);
  }

  @Get(':teamId/saldo')
  @ApiOperation({ summary: 'Saldo pro Mitglied (wer schuldet was)' })
  async saldoProMitglied(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.kasseService.saldoProMitglied(tenantId, teamId);
  }

  @Get(':teamId/katalog')
  @ApiOperation({ summary: 'Strafkatalog abrufen' })
  async katalogAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.kasseService.katalogAbrufen(tenantId, teamId);
  }

  @Post(':teamId/katalog')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Strafkatalog-Eintrag erstellen' })
  async katalogEintragErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
    @Body() dto: StrafkatalogErstellenDto,
  ) {
    return this.kasseService.katalogEintragErstellen(tenantId, teamId, dto);
  }

  @Delete(':teamId/katalog/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Strafkatalog-Eintrag loeschen' })
  async katalogEintragLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
    @Param('id') id: string,
  ) {
    await this.kasseService.katalogEintragLoeschen(tenantId, teamId, id);
    return { nachricht: 'Strafkatalog-Eintrag erfolgreich geloescht.' };
  }
}
