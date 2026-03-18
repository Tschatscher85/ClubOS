import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SpielberichtService } from './spielbericht.service';
import { ErstelleSpielberichtDto, AktualisiereSpielberichtDto } from './dto/erstelle-spielbericht.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Spielberichte')
@Controller('spielberichte')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class SpielberichtController {
  constructor(private spielberichtService: SpielberichtService) {}

  @Post(':eventId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Spielbericht erstellen oder aktualisieren + KI-Text generieren' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
    @Body() dto: ErstelleSpielberichtDto,
  ) {
    return this.spielberichtService.erstellenOderAktualisieren(tenantId, eventId, dto);
  }

  @Get(':eventId')
  @ApiOperation({ summary: 'Spielbericht fuer ein Event abrufen' })
  async abrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.spielberichtService.abrufen(tenantId, eventId);
  }

  @Put(':eventId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Spielbericht aktualisieren (KI-Text bearbeiten, veroeffentlichen)' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
    @Body() dto: AktualisiereSpielberichtDto,
  ) {
    return this.spielberichtService.aktualisieren(tenantId, eventId, dto);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Alle Spielberichte eines Teams abrufen' })
  async alleVonTeam(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.spielberichtService.alleVonTeam(tenantId, teamId);
  }
}
