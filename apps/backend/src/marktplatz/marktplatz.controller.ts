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
import { Role, InseratKategorie, InseratTyp } from '@prisma/client';
import {
  MarktplatzService,
  ErstelleInseratDto,
  AktualisiereInseratDto,
  BewerbenDto,
  StatusUpdateDto,
} from './marktplatz.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Marktplatz')
@Controller('marktplatz')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class MarktplatzController {
  constructor(private marktplatzService: MarktplatzService) {}

  // ==================== Inserate ====================

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Inserat erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleInseratDto,
  ) {
    return this.marktplatzService.erstellen(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle aktiven Inserate abrufen (vereinsuebergreifend)' })
  async alleAbrufen(
    @Query('kategorie') kategorie?: InseratKategorie,
    @Query('typ') typ?: InseratTyp,
    @Query('sportart') sportart?: string,
    @Query('plz') plz?: string,
    @Query('umkreis') umkreis?: string,
    @Query('suche') suche?: string,
  ) {
    return this.marktplatzService.alleAbrufen({
      kategorie,
      typ,
      sportart,
      plz,
      umkreis: umkreis ? parseInt(umkreis, 10) : undefined,
      suche,
    });
  }

  @Get('meine')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Eigene Inserate des Vereins abrufen' })
  async meineAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.marktplatzService.meineAbrufen(tenantId);
  }

  @Get('bewerbungen-eingehend')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Alle eingehenden Bewerbungen auf eigene Inserate' })
  async alleBewerbungenAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.marktplatzService.alleBewerbungenAbrufen(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Inserat-Details abrufen' })
  async einzelnAbrufen(
    @Param('id') id: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.marktplatzService.einzelnAbrufen(id, tenantId);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Inserat aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereInseratDto,
  ) {
    return this.marktplatzService.aktualisieren(tenantId, id, userId, rolle, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inserat loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
  ) {
    await this.marktplatzService.loeschen(tenantId, id, userId, rolle);
    return { nachricht: 'Inserat erfolgreich geloescht.' };
  }

  // ==================== Bewerbungen ====================

  @Post(':id/bewerben')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Auf Inserat bewerben/anfragen' })
  async bewerben(
    @Param('id') inseratId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: BewerbenDto,
  ) {
    return this.marktplatzService.bewerben(inseratId, tenantId, userId, dto);
  }

  @Get(':id/bewerbungen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Bewerbungen fuer ein Inserat abrufen' })
  async bewerbungenAbrufen(
    @Param('id') inseratId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.marktplatzService.bewerbungenAbrufen(inseratId, tenantId);
  }

  @Put('bewerbung/:id/status')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Bewerbungsstatus aendern' })
  async bewerbungStatusAendern(
    @Param('id') bewerbungId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: StatusUpdateDto,
  ) {
    return this.marktplatzService.bewerbungStatusAendern(bewerbungId, tenantId, dto);
  }
}
