import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { WartelisteService } from './warteliste.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { BerechtigungenGuard } from '../common/guards/berechtigungen.guard';
import { Berechtigungen } from '../common/decorators/berechtigungen.decorator';

@ApiTags('Warteliste')
@Controller('warteliste')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard, BerechtigungenGuard)
@Berechtigungen('TEAMS')
@ApiBearerAuth()
export class WartelisteController {
  constructor(private readonly wartelisteService: WartelisteService) {}

  @Get('team/:teamId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Warteliste eines Teams abrufen' })
  async wartelisteAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.wartelisteService.wartelisteAbrufen(teamId, tenantId);
  }

  @Post('team/:teamId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglied auf die Warteliste setzen' })
  async aufWartelisteSetzen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
    @Body() body: { mitgliedId: string },
  ) {
    return this.wartelisteService.aufWartelisteSetzen(
      teamId,
      body.mitgliedId,
      tenantId,
    );
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Eintrag von der Warteliste entfernen' })
  async entfernen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.wartelisteService.entfernen(id, tenantId);
    return { nachricht: 'Wartelisten-Eintrag erfolgreich entfernt.' };
  }

  @Post(':id/bestaetigen')
  @ApiOperation({ summary: 'Einladung von der Warteliste bestaetigen' })
  async bestaetigen(
    @AktuellerBenutzer('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.wartelisteService.bestaetigen(id, userId);
  }

  @Post('team/:teamId/naechsten-einladen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Naechsten auf der Warteliste manuell einladen' })
  async naechstenEinladen(
    @Param('teamId') teamId: string,
  ) {
    const ergebnis = await this.wartelisteService.naechstenEinladen(teamId);
    if (!ergebnis) {
      return { nachricht: 'Keine wartenden Eintraege vorhanden.' };
    }
    return ergebnis;
  }
}
