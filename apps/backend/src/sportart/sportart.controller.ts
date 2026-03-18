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
import { SportartService } from './sportart.service';
import {
  ErstelleCustomSportartDto,
  AktualisiereCustomSportartDto,
} from './dto/custom-sportart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Sportarten')
@Controller('sportarten')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class SportartController {
  constructor(private sportartService: SportartService) {}

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER, Role.MEMBER, Role.PARENT)
  @ApiOperation({ summary: 'Alle verfuegbaren Sportarten abrufen (vordefinierte + eigene)' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.sportartService.alleAbrufen(tenantId);
  }

  @Post('custom')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Eigene Sportart erstellen' })
  async customErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleCustomSportartDto,
  ) {
    return this.sportartService.customErstellen(tenantId, dto);
  }

  @Put('custom/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Eigene Sportart aktualisieren' })
  async customAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereCustomSportartDto,
  ) {
    return this.sportartService.customAktualisieren(tenantId, id, dto);
  }

  @Delete('custom/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Eigene Sportart loeschen' })
  async customLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.sportartService.customLoeschen(tenantId, id);
    return { nachricht: 'Eigene Sportart erfolgreich geloescht.' };
  }
}
