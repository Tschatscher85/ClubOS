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
import { SkipThrottle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import {
  FundingService,
  ErstelleProjektDto,
  AktualisiereProjektDto,
  SpendeDto,
} from './funding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Funding')
@Controller('funding')
export class FundingController {
  constructor(private fundingService: FundingService) {}

  // ==================== Geschuetzte Endpoints ====================

  @Post()
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crowdfunding-Projekt erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('userId') userId: string,
    @Body() dto: ErstelleProjektDto,
  ) {
    return this.fundingService.erstellen(tenantId, userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crowdfunding-Projekte auflisten' })
  async auflisten(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.fundingService.auflisten(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crowdfunding-Projekt Detail' })
  async detail(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.fundingService.detail(tenantId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crowdfunding-Projekt aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereProjektDto,
  ) {
    return this.fundingService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Crowdfunding-Projekt schliessen/loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.fundingService.loeschen(tenantId, id);
  }

  @Post(':id/spenden')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Spende abgeben (authentifiziert)' })
  async spenden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SpendeDto,
  ) {
    return this.fundingService.spenden(tenantId, id, dto);
  }

  // ==================== Oeffentliche Endpoints ====================

  @Get('public/:slug/:id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliches Crowdfunding-Projekt laden' })
  async oeffentlichLaden(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    return this.fundingService.oeffentlichLaden(slug, id);
  }

  @Post('public/:slug/:id/spenden')
  @SkipThrottle()
  @ApiOperation({ summary: 'Oeffentliche Spende abgeben' })
  async oeffentlichSpenden(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: SpendeDto,
  ) {
    return this.fundingService.oeffentlichSpenden(slug, id, dto);
  }
}
