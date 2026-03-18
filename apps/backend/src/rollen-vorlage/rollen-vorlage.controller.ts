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
import { RollenVorlageService } from './rollen-vorlage.service';
import { ErstelleRollenVorlageDto } from './dto/erstelle-rollen-vorlage.dto';
import { AktualisiereRollenVorlageDto } from './dto/aktualisiere-rollen-vorlage.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Rollen-Vorlagen')
@Controller('rollen-vorlagen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class RollenVorlageController {
  constructor(private rollenVorlageService: RollenVorlageService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Rollenvorlagen des Vereins abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.rollenVorlageService.alleVorlagen(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelne Rollenvorlage abrufen' })
  async abrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.rollenVorlageService.vorlageById(tenantId, id);
  }

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neue Rollenvorlage erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleRollenVorlageDto,
  ) {
    return this.rollenVorlageService.erstellen(tenantId, dto);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Rollenvorlage aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereRollenVorlageDto,
  ) {
    return this.rollenVorlageService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Rollenvorlage loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.rollenVorlageService.loeschen(tenantId, id);
    return { nachricht: 'Rollenvorlage erfolgreich geloescht.' };
  }
}
