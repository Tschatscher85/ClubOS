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
import { BuchungService } from './buchung.service';
import {
  ErstelleRessourceDto,
  AktualisiereRessourceDto,
} from './dto/erstelle-ressource.dto';
import { ErstelleBuchungDto } from './dto/erstelle-buchung.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { BerechtigungenGuard } from '../common/guards/berechtigungen.guard';
import { Berechtigungen } from '../common/decorators/berechtigungen.decorator';

@ApiTags('Ressourcen & Buchungen')
@Controller()
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard, BerechtigungenGuard)
@Berechtigungen('RESSOURCEN')
@ApiBearerAuth()
export class BuchungController {
  constructor(private buchungService: BuchungService) {}

  // ==================== Ressourcen ====================

  @Get('ressourcen')
  @ApiOperation({ summary: 'Alle Ressourcen des Vereins abrufen' })
  async alleRessourcen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.buchungService.alleRessourcenAbrufen(tenantId);
  }

  @Post('ressourcen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neue Ressource erstellen' })
  async ressourceErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleRessourceDto,
  ) {
    return this.buchungService.ressourceErstellen(tenantId, dto);
  }

  @Put('ressourcen/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Ressource aktualisieren' })
  async ressourceAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereRessourceDto,
  ) {
    return this.buchungService.ressourceAktualisieren(tenantId, id, dto);
  }

  @Delete('ressourcen/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Ressource loeschen' })
  async ressourceLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.buchungService.ressourceLoeschen(tenantId, id);
    return { nachricht: 'Ressource erfolgreich geloescht.' };
  }

  // ==================== Buchungen ====================

  @Get('buchungen')
  @ApiOperation({ summary: 'Buchungen im Zeitraum abrufen' })
  async buchungenAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('ressourceId') ressourceId?: string,
    @Query('start') start?: string,
    @Query('ende') ende?: string,
  ) {
    return this.buchungService.buchungenAbrufen(
      tenantId,
      ressourceId,
      start,
      ende,
    );
  }

  @Post('buchungen')
  @ApiOperation({ summary: 'Neue Buchung erstellen (mit Konflikt-Pruefung)' })
  async buchungErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('sub') bucherId: string,
    @Body() dto: ErstelleBuchungDto,
  ) {
    return this.buchungService.buchungErstellen(tenantId, bucherId, dto);
  }

  @Delete('buchungen/:id')
  @ApiOperation({ summary: 'Buchung stornieren (eigene oder Admin)' })
  async buchungStornieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @AktuellerBenutzer('sub') userId: string,
    @AktuellerBenutzer('role') userRole: string,
  ) {
    await this.buchungService.buchungStornieren(
      tenantId,
      id,
      userId,
      userRole,
    );
    return { nachricht: 'Buchung erfolgreich storniert.' };
  }
}
