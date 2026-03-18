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
import { AbteilungService } from './abteilung.service';
import {
  ErstelleAbteilungDto,
  AktualisiereAbteilungDto,
} from './dto/erstelle-abteilung.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Abteilungen')
@Controller('abteilungen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class AbteilungController {
  constructor(private abteilungService: AbteilungService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neue Abteilung erstellen (z.B. Fussball, Handball)' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleAbteilungDto,
  ) {
    return this.abteilungService.erstellen(tenantId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Abteilungen des Vereins abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.abteilungService.alleAbrufen(tenantId);
  }

  @Get(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Abteilung nach ID abrufen (mit Teams und Mitgliedern)' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.abteilungService.nachIdAbrufen(tenantId, id);
  }

  @Get(':id/bericht')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Abteilungsbericht abrufen (Statistik, Teams, Mitglieder)' })
  async bericht(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.abteilungService.bericht(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Abteilung aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereAbteilungDto,
  ) {
    return this.abteilungService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Abteilung loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.abteilungService.loeschen(tenantId, id);
    return { nachricht: 'Abteilung erfolgreich geloescht.' };
  }
}
