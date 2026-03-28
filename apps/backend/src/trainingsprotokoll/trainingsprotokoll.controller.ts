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
import { TrainingsprotokollService } from './trainingsprotokoll.service';
import { ErstelleTrainingsprotokollDto } from './dto/erstelle-trainingsprotokoll.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Trainingsprotokolle')
@Controller('trainingsprotokolle')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class TrainingsprotokollController {
  constructor(private trainingsprotokollService: TrainingsprotokollService) {}

  @Post(':teamId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Trainingsprotokoll erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('sub') trainerId: string,
    @Param('teamId') teamId: string,
    @Body() dto: ErstelleTrainingsprotokollDto,
  ) {
    return this.trainingsprotokollService.erstellen(tenantId, teamId, trainerId, dto);
  }

  @Get(':teamId')
  @ApiOperation({ summary: 'Alle Trainingsprotokolle eines Teams laden' })
  async alleVonTeam(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.trainingsprotokollService.alleVonTeam(tenantId, teamId);
  }

  @Get('detail/:id')
  @ApiOperation({ summary: 'Einzelnes Trainingsprotokoll laden' })
  async abrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.trainingsprotokollService.abrufen(tenantId, id);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Trainingsprotokoll loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.trainingsprotokollService.loeschen(tenantId, id);
  }
}
