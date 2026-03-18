import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BeitragService } from './beitrag.service';
import {
  ErstelleBeitragsklasseDto,
  AktualisiereBeitragsklasseDto,
  ZuweiseBeitragsklasseDto,
} from './dto/erstelle-beitragsklasse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Beitragsklassen')
@Controller('beitragsklassen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class BeitragController {
  constructor(private beitragService: BeitragService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Beitragsklassen des Vereins abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.beitragService.alleAbrufen(tenantId);
  }

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neue Beitragsklasse erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleBeitragsklasseDto,
  ) {
    return this.beitragService.erstellen(tenantId, dto);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Beitragsklasse aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereBeitragsklasseDto,
  ) {
    return this.beitragService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Beitragsklasse loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.beitragService.loeschen(tenantId, id);
  }

  @Get('uebersicht')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Beitrags-Uebersicht (Soll vs Ist pro Monat)' })
  async uebersicht(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.beitragService.uebersicht(tenantId);
  }

  @Post('zuweisen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Beitragsklasse einem Mitglied zuweisen' })
  async zuweisen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ZuweiseBeitragsklasseDto,
  ) {
    return this.beitragService.zuweisen(tenantId, dto);
  }
}
