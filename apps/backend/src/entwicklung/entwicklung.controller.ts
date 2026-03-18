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
import { EntwicklungService } from './entwicklung.service';
import { ErstelleEntwicklungsbogenDto } from './dto/erstelle-entwicklungsbogen.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Entwicklung')
@Controller('entwicklung')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class EntwicklungController {
  constructor(private entwicklungService: EntwicklungService) {}

  @Get('team/:teamId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Letzte Boegen aller Teammitglieder' })
  async letzteVonTeam(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.entwicklungService.letzteVonTeam(tenantId, teamId);
  }

  @Get(':memberId/trend')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Trend-Daten fuer Radar-Chart' })
  async trend(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.entwicklungService.trend(tenantId, memberId);
  }

  @Get(':memberId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Entwicklungsboegen eines Spielers laden' })
  async alleVonMitglied(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.entwicklungService.alleVonMitglied(tenantId, memberId);
  }

  @Post(':memberId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neuen Entwicklungsbogen fuer ein Mitglied anlegen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('sub') userId: string,
    @Param('memberId') memberId: string,
    @Body() dto: ErstelleEntwicklungsbogenDto,
  ) {
    return this.entwicklungService.erstellen(tenantId, memberId, userId, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Entwicklungsbogen loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.entwicklungService.loeschen(tenantId, id);
  }
}
