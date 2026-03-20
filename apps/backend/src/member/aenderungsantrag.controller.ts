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
import { IsString, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';
import { AenderungsantragService } from './aenderungsantrag.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

class ErstelleAenderungsantragDto {
  @IsString()
  @IsNotEmpty()
  feld!: string;

  @IsString()
  @IsNotEmpty()
  neuerWert!: string;
}

@ApiTags('Mitglieder-Selbstverwaltung')
@Controller('mitglieder')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class AenderungsantragController {
  constructor(private aenderungsantragService: AenderungsantragService) {}

  @Get('mein-profil')
  @ApiOperation({ summary: 'Eigenes Mitgliedsprofil abrufen' })
  async meinProfil(
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.aenderungsantragService.meinProfilAbrufen(userId, tenantId);
  }

  @Post('aenderungsantrag')
  @ApiOperation({ summary: 'Änderungsantrag einreichen' })
  async antragErstellen(
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleAenderungsantragDto,
  ) {
    return this.aenderungsantragService.antragErstellen(
      userId,
      tenantId,
      dto.feld,
      dto.neuerWert,
    );
  }

  @Get('aenderungsantraege')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Alle offenen Änderungsanträge abrufen' })
  async alleOffene(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.aenderungsantragService.alleOffenenAbrufen(tenantId);
  }

  @Put('aenderungsantrag/:id/genehmigen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Änderungsantrag genehmigen' })
  async genehmigen(
    @Param('id') id: string,
    @AktuellerBenutzer('id') adminUserId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.aenderungsantragService.genehmigen(id, tenantId, adminUserId);
  }

  @Put('aenderungsantrag/:id/ablehnen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Änderungsantrag ablehnen' })
  async ablehnen(
    @Param('id') id: string,
    @AktuellerBenutzer('id') adminUserId: string,
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.aenderungsantragService.ablehnen(id, tenantId, adminUserId);
  }
}
