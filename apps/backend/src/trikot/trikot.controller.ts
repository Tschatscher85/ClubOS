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
import { TrikotService } from './trikot.service';
import { ErstelleTrikotDto } from './dto/erstelle-trikot.dto';
import { TrikotAusgebenDto } from './dto/trikot-ausgeben.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Trikots')
@Controller('trikots')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class TrikotController {
  constructor(private trikotService: TrikotService) {}

  @Get(':teamId')
  @ApiOperation({ summary: 'Alle Trikots eines Teams abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.trikotService.alleAbrufen(tenantId, teamId);
  }

  @Post(':teamId')
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Neues Trikot erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
    @Body() dto: ErstelleTrikotDto,
  ) {
    return this.trikotService.erstellen(tenantId, teamId, dto);
  }

  @Post(':id/ausgeben')
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Trikot an Mitglied ausgeben' })
  async ausgeben(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') trikotId: string,
    @Body() dto: TrikotAusgebenDto,
  ) {
    return this.trikotService.ausgeben(tenantId, trikotId, dto);
  }

  @Post(':id/zurueck')
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Trikot zurueckbuchen' })
  async zurueckbuchen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') trikotId: string,
  ) {
    return this.trikotService.zurueckbuchen(tenantId, trikotId);
  }

  @Delete(':id')
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Trikot loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') trikotId: string,
  ) {
    await this.trikotService.loeschen(tenantId, trikotId);
    return { nachricht: 'Trikot erfolgreich geloescht.' };
  }

  @Get(':teamId/ausstehend')
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Alle ausstehenden Trikots eines Teams' })
  async ausstehend(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.trikotService.ausstehend(tenantId, teamId);
  }
}
