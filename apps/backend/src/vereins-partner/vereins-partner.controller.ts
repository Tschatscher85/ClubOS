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
import { VereinsPartnerService } from './vereins-partner.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Vereins-Partner')
@Controller('vereins-partner')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class VereinsPartnerController {
  constructor(private vereinsPartnerService: VereinsPartnerService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neuen Vereins-Partner erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: {
      name: string;
      logoUrl?: string;
      webseite?: string;
      beschreibung?: string;
      kategorie: string;
      kontaktName?: string;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      notizen?: string;
    },
  ) {
    return this.vereinsPartnerService.erstellen(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Partner des Vereins abrufen' })
  async alleLaden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('kategorie') kategorie?: string,
  ) {
    return this.vereinsPartnerService.alleLaden(tenantId, kategorie);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelnen Partner mit Auftraegen abrufen' })
  async nachIdLaden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.vereinsPartnerService.nachIdLaden(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Partner aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      logoUrl?: string;
      webseite?: string;
      beschreibung?: string;
      kategorie?: string;
      kontaktName?: string;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      notizen?: string;
      istAktiv?: boolean;
    },
  ) {
    return this.vereinsPartnerService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Partner loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.vereinsPartnerService.loeschen(tenantId, id);
    return { nachricht: 'Partner erfolgreich geloescht.' };
  }

  @Post(':id/auftraege')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neuen Auftrag fuer Partner erstellen' })
  async auftragErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('userId') userId: string,
    @Param('id') partnerId: string,
    @Body() dto: {
      beschreibung: string;
      betrag?: number;
      datum?: string;
      teamId?: string;
    },
  ) {
    return this.vereinsPartnerService.auftragErstellen(tenantId, partnerId, userId, dto);
  }

  @Get(':id/auftraege')
  @ApiOperation({ summary: 'Alle Auftraege eines Partners abrufen' })
  async auftraegeLaden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') partnerId: string,
  ) {
    return this.vereinsPartnerService.auftraegeLaden(tenantId, partnerId);
  }

  @Put('auftraege/:auftragId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Auftragsstatus aktualisieren' })
  async auftragAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('auftragId') auftragId: string,
    @Body() dto: {
      status?: string;
      beschreibung?: string;
      betrag?: number;
    },
  ) {
    return this.vereinsPartnerService.auftragAktualisieren(tenantId, auftragId, dto);
  }
}
