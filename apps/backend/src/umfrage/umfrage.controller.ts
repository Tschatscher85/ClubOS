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
import { UmfrageService } from './umfrage.service';
import { ErstelleUmfrageDto, AbstimmenDto, TokenAbstimmenDto } from './dto/umfrage.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Umfragen')
@Controller('umfragen')
export class UmfrageController {
  constructor(private umfrageService: UmfrageService) {}

  // ==================== Oeffentliche Token-Endpoints (OHNE Auth) ====================

  @Get('token/:token')
  @ApiOperation({ summary: 'Umfrage via oeffentlichem Token abrufen (kein Auth)' })
  async tokenAbrufen(@Param('token') token: string) {
    return this.umfrageService.tokenAbrufen(token);
  }

  @Post('token/:token')
  @ApiOperation({ summary: 'Via Token abstimmen (kein Auth)' })
  async tokenAbstimmen(
    @Param('token') token: string,
    @Body() dto: TokenAbstimmenDto,
  ) {
    return this.umfrageService.tokenAbstimmen(token, dto.option, dto.name);
  }

  // ==================== Authentifizierte Endpoints ====================

  @Post()
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Neue Umfrage erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleUmfrageDto,
  ) {
    return this.umfrageService.erstellen(tenantId, userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alle Umfragen des Vereins abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.umfrageService.alleAbrufen(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Umfrage-Details mit Statistiken abrufen' })
  async detailAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.umfrageService.detailAbrufen(id, tenantId);
  }

  @Post(':id/abstimmen')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'An Umfrage abstimmen (angemeldeter Benutzer)' })
  async abstimmen(
    @AktuellerBenutzer('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AbstimmenDto,
  ) {
    return this.umfrageService.abstimmen(id, userId, dto.option, dto.mitgliedName);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Umfrage loeschen (nur Ersteller oder Admin)' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
  ) {
    await this.umfrageService.loeschen(id, tenantId, userId, rolle);
    return { nachricht: 'Umfrage erfolgreich geloescht.' };
  }
}
