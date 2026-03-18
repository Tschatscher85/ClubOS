import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SchiedsrichterService } from './schiedsrichter.service';
import { ErstelleEinteilungDto } from './dto/erstelle-einteilung.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Schiedsrichter')
@Controller('schiedsrichter')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class SchiedsrichterController {
  constructor(private schiedsrichterService: SchiedsrichterService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Schiedsrichter manuell einteilen' })
  async einteilen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleEinteilungDto,
  ) {
    return this.schiedsrichterService.einteilen(tenantId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Schiedsrichter-Einteilungen abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.schiedsrichterService.alleAbrufen(tenantId, eventId);
  }

  @Post(':id/bestaetigen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Schiedsrichter-Einteilung bestaetigen' })
  async bestaetigen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.schiedsrichterService.bestaetigen(tenantId, id);
  }

  @Post(':id/ablehnen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Schiedsrichter-Einteilung ablehnen' })
  async ablehnen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('grund') grund?: string,
  ) {
    return this.schiedsrichterService.ablehnen(tenantId, id, grund);
  }

  @Post('auto/:eventId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Schiedsrichter automatisch einteilen (faire Rotation)' })
  async automatischEinteilen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.schiedsrichterService.automatischEinteilen(tenantId, eventId);
  }
}
