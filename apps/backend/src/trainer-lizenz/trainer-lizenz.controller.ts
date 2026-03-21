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
import { Role } from '@prisma/client';
import {
  TrainerLizenzService,
  ErstelleLizenzDto,
  AktualisiereLizenzDto,
} from './trainer-lizenz.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Trainer-Lizenzen')
@Controller('trainer-lizenzen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class TrainerLizenzController {
  constructor(private trainerLizenzService: TrainerLizenzService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neue Trainer-Lizenz anlegen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Body() dto: ErstelleLizenzDto,
  ) {
    return this.trainerLizenzService.erstellen(tenantId, userId, rolle, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Lizenzen auflisten (Admin: alle, Trainer: eigene)' })
  async auflisten(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
  ) {
    return this.trainerLizenzService.auflisten(tenantId, userId, rolle);
  }

  @Get('uebersicht')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Uebersicht: Alle Trainer mit Lizenzstatus' })
  async uebersicht(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.trainerLizenzService.uebersicht(tenantId);
  }

  @Get('ablaufend')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Lizenzen die in den naechsten 3 Monaten ablaufen' })
  async ablaufend(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.trainerLizenzService.ablaufend(tenantId);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Lizenz aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereLizenzDto,
  ) {
    return this.trainerLizenzService.aktualisieren(
      tenantId,
      id,
      userId,
      rolle,
      dto,
    );
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lizenz loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
  ) {
    await this.trainerLizenzService.loeschen(tenantId, id, userId, rolle);
    return { nachricht: 'Lizenz erfolgreich geloescht.' };
  }
}
