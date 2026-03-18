import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AufstellungService } from './aufstellung.service';
import { ErstelleAufstellungDto, AktualisiereAufstellungDto } from './dto/erstelle-aufstellung.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Aufstellungen')
@Controller('aufstellungen')
export class AufstellungController {
  constructor(private aufstellungService: AufstellungService) {}

  // ==================== Oeffentlicher Zugriff ====================

  @Get('p/:url')
  @ApiOperation({ summary: 'Aufstellung oeffentlich abrufen (kein Auth)' })
  async oeffentlich(@Param('url') url: string) {
    return this.aufstellungService.nachPublicUrl(url);
  }

  // ==================== Authentifizierte Endpunkte ====================

  @Post()
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Neue Aufstellung erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleAufstellungDto,
  ) {
    return this.aufstellungService.erstellen(tenantId, dto);
  }

  @Get(':teamId')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alle Aufstellungen eines Teams abrufen' })
  async alleNachTeam(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.aufstellungService.alleNachTeam(tenantId, teamId);
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Einzelne Aufstellung abrufen' })
  async nachId(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.aufstellungService.nachId(tenantId, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aufstellung aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereAufstellungDto,
  ) {
    return this.aufstellungService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aufstellung loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.aufstellungService.loeschen(tenantId, id);
    return { nachricht: 'Aufstellung erfolgreich geloescht.' };
  }

  @Post(':id/teilen')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oeffentliche URL fuer Aufstellung generieren' })
  async teilen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.aufstellungService.teilen(tenantId, id);
  }
}
