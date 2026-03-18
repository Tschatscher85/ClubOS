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
import { PinboardService } from './pinboard.service';
import {
  ErstellePinboardItemDto,
  AktualisierePinboardItemDto,
} from './dto/pinboard.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Pinboard')
@Controller('pinboard')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class PinboardController {
  constructor(private pinboardService: PinboardService) {}

  @Get(':teamId')
  @ApiOperation({ summary: 'Alle Pinboard-Eintraege eines Teams abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.pinboardService.alleAbrufen(tenantId, teamId);
  }

  @Post(':teamId')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neuen Pinboard-Eintrag erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Param('teamId') teamId: string,
    @Body() dto: ErstellePinboardItemDto,
  ) {
    return this.pinboardService.erstellen(tenantId, teamId, userId, dto);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Pinboard-Eintrag aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisierePinboardItemDto,
  ) {
    return this.pinboardService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Pinboard-Eintrag loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.pinboardService.loeschen(tenantId, id);
    return { nachricht: 'Pinboard-Eintrag erfolgreich geloescht.' };
  }
}
