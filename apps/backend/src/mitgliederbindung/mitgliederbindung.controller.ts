import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MitgliederbindungService } from './mitgliederbindung.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Mitgliederbindung')
@Controller('mitgliederbindung')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class MitgliederbindungController {
  constructor(private mitgliederbindungService: MitgliederbindungService) {}

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Risiko-Analyse aller aktiven Mitglieder' })
  async risikoAnalyse(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.mitgliederbindungService.risikoAnalyse(tenantId);
  }

  @Get(':id/vorschlag')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'KI-Kontaktvorschlag fuer ein Mitglied generieren' })
  async kontaktVorschlag(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') mitgliedId: string,
  ) {
    return this.mitgliederbindungService.kontaktVorschlag(tenantId, mitgliedId);
  }
}
