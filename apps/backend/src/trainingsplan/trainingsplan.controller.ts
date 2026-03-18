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
import { TrainingsplanService } from './trainingsplan.service';
import { ErstelleTrainingsplanDto } from './dto/erstelle-trainingsplan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Trainingsplaene')
@Controller('trainingsplaene')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class TrainingsplanController {
  constructor(private trainingsplanService: TrainingsplanService) {}

  @Post(':teamId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Trainingsplan per KI generieren und speichern' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
    @Body() dto: ErstelleTrainingsplanDto,
  ) {
    return this.trainingsplanService.erstellen(tenantId, teamId, dto);
  }

  @Get(':teamId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Trainingsplaene eines Teams laden' })
  async alleVonTeam(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.trainingsplanService.alleVonTeam(tenantId, teamId);
  }

  @Get('detail/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Einzelnen Trainingsplan laden' })
  async abrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.trainingsplanService.abrufen(tenantId, id);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Trainingsplan loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.trainingsplanService.loeschen(tenantId, id);
  }
}
