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
import {
  WikiService,
  ErstelleWikiSeiteDto,
  AktualisiereWikiSeiteDto,
} from './wiki.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Wiki')
@Controller('wiki')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class WikiController {
  constructor(private wikiService: WikiService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neue Wiki-Seite erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleWikiSeiteDto,
  ) {
    return this.wikiService.erstellen(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Wiki-Seiten auflisten' })
  async alleListen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('kategorie') kategorie?: string,
  ) {
    return this.wikiService.alleListen(tenantId, kategorie);
  }

  @Get('suche')
  @ApiOperation({ summary: 'Wiki-Seiten durchsuchen' })
  async suchen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('q') suchbegriff: string,
  ) {
    return this.wikiService.suchen(tenantId, suchbegriff || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelne Wiki-Seite laden' })
  async einzeln(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.wikiService.einzeln(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Wiki-Seite bearbeiten' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereWikiSeiteDto,
  ) {
    return this.wikiService.aktualisieren(tenantId, id, userId, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Wiki-Seite loeschen (nur Admin)' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
  ) {
    return this.wikiService.loeschen(tenantId, id, rolle);
  }
}
