import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FamilieService } from './familie.service';
import { ErstelleFamilieDto, FamilieMitgliedHinzufuegenDto } from './dto/familie.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Familien')
@Controller('familien')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class FamilieController {
  constructor(private familieService: FamilieService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neue Familie erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleFamilieDto,
  ) {
    return this.familieService.erstellen(tenantId, dto.name);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Familien des Vereins abrufen (optional: memberId-Filter)' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('memberId') memberId?: string,
  ) {
    if (memberId) {
      return this.familieService.nachMitglied(tenantId, memberId);
    }
    return this.familieService.alleAbrufen(tenantId);
  }

  @Get('meine')
  @ApiOperation({ summary: 'Eigene Familie abrufen (alle Rollen)' })
  async meineFamilie(
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    const familie = await this.familieService.meineFamilie(userId, tenantId);
    return familie || { nachricht: 'Keine Familie zugeordnet.' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Familie-Detail mit allen Mitgliedern' })
  async detailAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.familieService.detailAbrufen(id, tenantId);
  }

  @Post(':id/mitglied')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mitglied zur Familie hinzufuegen' })
  async mitgliedHinzufuegen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') familieId: string,
    @Body() dto: FamilieMitgliedHinzufuegenDto,
  ) {
    return this.familieService.mitgliedHinzufuegen(familieId, tenantId, {
      memberId: dto.memberId,
      userId: dto.userId,
      rolle: dto.rolle,
    });
  }

  @Delete(':id/mitglied/:fmId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mitglied aus Familie entfernen' })
  async mitgliedEntfernen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') familieId: string,
    @Param('fmId') familieMitgliedId: string,
  ) {
    await this.familieService.mitgliedEntfernen(familieId, familieMitgliedId, tenantId);
    return { nachricht: 'Familienmitglied entfernt.' };
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Familie loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.familieService.loeschen(id, tenantId);
    return { nachricht: 'Familie erfolgreich geloescht.' };
  }
}
