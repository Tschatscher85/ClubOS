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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  FestService,
  ErstelleSchichtDto,
  ErstelleEinkaufDto,
  AktualisiereEinkaufDto,
  ErstelleKasseDto,
} from './fest.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Vereinsfest')
@Controller('fest')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class FestController {
  constructor(private festService: FestService) {}

  // ==================== Schichten ====================

  @Post(':eventId/schichten')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Fest-Schicht erstellen' })
  async schichtErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
    @Body() dto: ErstelleSchichtDto,
  ) {
    return this.festService.schichtErstellen(tenantId, eventId, dto);
  }

  @Get(':eventId/schichten')
  @ApiOperation({ summary: 'Alle Schichten eines Events auflisten' })
  async schichtenAuflisten(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.festService.schichtenAuflisten(tenantId, eventId);
  }

  @Delete('schicht/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schicht loeschen' })
  async schichtLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.festService.schichtLoeschen(tenantId, id);
  }

  @Post('schicht/:id/eintragen')
  @ApiOperation({ summary: 'In Schicht eintragen' })
  async schichtEintragen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.festService.schichtEintragen(tenantId, id, userId);
  }

  @Delete('schicht/:id/austragen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aus Schicht austragen' })
  async schichtAustragen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.festService.schichtAustragen(tenantId, id, userId);
  }

  // ==================== Einkaufsliste ====================

  @Post(':eventId/einkauf')
  @ApiOperation({ summary: 'Einkaufsartikel hinzufuegen' })
  async einkaufErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
    @Body() dto: ErstelleEinkaufDto,
  ) {
    return this.festService.einkaufErstellen(tenantId, eventId, dto);
  }

  @Get(':eventId/einkauf')
  @ApiOperation({ summary: 'Einkaufsliste abrufen' })
  async einkaufAuflisten(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.festService.einkaufAuflisten(tenantId, eventId);
  }

  @Put('einkauf/:id')
  @ApiOperation({ summary: 'Einkaufsartikel aktualisieren' })
  async einkaufAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereEinkaufDto,
  ) {
    return this.festService.einkaufAktualisieren(tenantId, id, dto);
  }

  @Delete('einkauf/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Einkaufsartikel loeschen' })
  async einkaufLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.festService.einkaufLoeschen(tenantId, id);
  }

  // ==================== Kasse ====================

  @Post(':eventId/kasse')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Kassenbuchung erstellen' })
  async kasseErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
    @Body() dto: ErstelleKasseDto,
  ) {
    return this.festService.kasseErstellen(tenantId, eventId, dto);
  }

  @Get(':eventId/kasse')
  @ApiOperation({ summary: 'Kasse mit Saldo abrufen' })
  async kasseAuflisten(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.festService.kasseAuflisten(tenantId, eventId);
  }

  @Delete('kasse/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kasseneintrag loeschen' })
  async kasseLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.festService.kasseLoeschen(tenantId, id);
  }

  // ==================== Zusammenfassung ====================

  @Get(':eventId/zusammenfassung')
  @ApiOperation({ summary: 'Vollstaendige Fest-Zusammenfassung' })
  async zusammenfassung(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.festService.zusammenfassung(tenantId, eventId);
  }
}
