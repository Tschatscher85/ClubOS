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
import { SponsorService } from './sponsor.service';
import { ErstelleSponsorDto, AktualisiereSponsorDto } from './dto/erstelle-sponsor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Sponsoren')
@Controller('sponsoren')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class SponsorController {
  constructor(private sponsorService: SponsorService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neuen Sponsor erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleSponsorDto,
  ) {
    return this.sponsorService.sponsorErstellen(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Sponsoren des Vereins abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('nurAktive') nurAktive?: string,
  ) {
    return this.sponsorService.alleAbrufen(tenantId, nurAktive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelnen Sponsor abrufen' })
  async abrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.sponsorService.sponsorAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Sponsor aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereSponsorDto,
  ) {
    return this.sponsorService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Sponsor loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.sponsorService.loeschen(tenantId, id);
    return { nachricht: 'Sponsor erfolgreich geloescht.' };
  }
}
