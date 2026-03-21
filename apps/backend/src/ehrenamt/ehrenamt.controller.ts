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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  EhrenamtService,
  ErstelleAufgabeDto,
  AktualisiereAufgabeDto,
  StatusAendernDto,
  StundenErfassenDto,
} from './ehrenamt.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Ehrenamt')
@Controller('ehrenamt')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class EhrenamtController {
  constructor(private ehrenamtService: EhrenamtService) {}

  // ==================== Aufgaben ====================

  @Post('aufgaben')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Helfer-Aufgabe erstellen' })
  async aufgabeErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleAufgabeDto,
  ) {
    return this.ehrenamtService.aufgabeErstellen(tenantId, userId, dto);
  }

  @Get('aufgaben')
  @ApiOperation({ summary: 'Alle Helfer-Aufgaben abrufen' })
  async aufgabenAuflisten(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.ehrenamtService.aufgabenAuflisten(tenantId);
  }

  @Get('aufgaben/:id')
  @ApiOperation({ summary: 'Aufgabe mit Meldungen anzeigen' })
  async aufgabeDetail(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.ehrenamtService.aufgabeDetail(tenantId, id);
  }

  @Put('aufgaben/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Aufgabe aktualisieren' })
  async aufgabeAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereAufgabeDto,
  ) {
    return this.ehrenamtService.aufgabeAktualisieren(
      tenantId,
      id,
      userId,
      rolle,
      dto,
    );
  }

  @Delete('aufgaben/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aufgabe loeschen' })
  async aufgabeLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
  ) {
    await this.ehrenamtService.aufgabeLoeschen(tenantId, id, userId, rolle);
    return { nachricht: 'Aufgabe erfolgreich geloescht.' };
  }

  @Put('aufgaben/:id/status')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Aufgaben-Status aendern' })
  async statusAendern(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
    @Body() dto: StatusAendernDto,
  ) {
    return this.ehrenamtService.statusAendern(
      tenantId,
      id,
      userId,
      rolle,
      dto,
    );
  }

  // ==================== Meldungen ====================

  @Post('aufgaben/:id/melden')
  @ApiOperation({ summary: 'Als Helfer fuer Aufgabe anmelden' })
  async melden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.ehrenamtService.melden(tenantId, id, userId);
  }

  @Delete('aufgaben/:id/melden')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meldung zurueckziehen' })
  async meldungZurueckziehen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.ehrenamtService.meldungZurueckziehen(tenantId, id, userId);
  }

  @Put('meldung/:id/bestaetigen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Helfer-Meldung bestaetigen' })
  async meldungBestaetigen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
  ) {
    return this.ehrenamtService.meldungBestaetigen(tenantId, id, userId, rolle);
  }

  @Put('meldung/:id/ablehnen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Helfer-Meldung ablehnen' })
  async meldungAblehnen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
  ) {
    return this.ehrenamtService.meldungAblehnen(tenantId, id, userId, rolle);
  }

  // ==================== Uebungsleiter-Stunden ====================

  @Post('stunden')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Uebungsleiter-Stunden erfassen' })
  async stundenErfassen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: StundenErfassenDto,
  ) {
    return this.ehrenamtService.stundenErfassen(tenantId, userId, dto);
  }

  @Get('stunden')
  @ApiOperation({ summary: 'Meine Stunden abrufen' })
  async meineStunden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Query('jahr') jahr?: string,
  ) {
    return this.ehrenamtService.meineStunden(
      tenantId,
      userId,
      jahr ? parseInt(jahr, 10) : undefined,
    );
  }

  @Get('stunden/uebersicht')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Uebungsleiter-Stunden Uebersicht (alle Trainer)' })
  async stundenUebersicht(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('jahr') jahr?: string,
  ) {
    return this.ehrenamtService.stundenUebersicht(
      tenantId,
      jahr ? parseInt(jahr, 10) : undefined,
    );
  }

  @Get('stunden/jahressumme')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Jahressumme pro Trainer mit 3300 EUR Warnung' })
  async jahresUebersicht(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('jahr') jahr?: string,
  ) {
    return this.ehrenamtService.jahresUebersicht(
      tenantId,
      jahr ? parseInt(jahr, 10) : undefined,
    );
  }
}
