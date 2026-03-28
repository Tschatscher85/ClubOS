import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  SpielerpassService,
  ErstelleSpielerpassDto,
  AktualisiereSpielerpassDto,
} from './spielerpass.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Spielerpass')
@Controller('spielerpass')
export class SpielerpassController {
  constructor(private spielerpassService: SpielerpassService) {}

  @Post(':memberId')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Spielerpass fuer ein Mitglied erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
    @Body() dto: ErstelleSpielerpassDto,
  ) {
    return this.spielerpassService.erstellen(tenantId, memberId, dto);
  }

  @Get('pruefen/:qrToken')
  @ApiOperation({ summary: 'Spielerpass oeffentlich pruefen (QR-Code Scan)' })
  async pruefen(@Param('qrToken') qrToken: string) {
    return this.spielerpassService.pruefen(qrToken);
  }

  @Get(':memberId')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN, Role.MEMBER, Role.PARENT)
  @ApiOperation({ summary: 'Spielerpass eines Mitglieds abrufen' })
  async abrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.spielerpassService.abrufen(tenantId, memberId);
  }

  @Put(':memberId')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Spielerpass aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
    @Body() dto: AktualisiereSpielerpassDto,
  ) {
    return this.spielerpassService.aktualisieren(tenantId, memberId, dto);
  }

  @Delete(':memberId')
  @UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
  @ApiBearerAuth()
  @Rollen(Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Spielerpass loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.spielerpassService.loeschen(tenantId, memberId);
    return { nachricht: 'Spielerpass erfolgreich geloescht.' };
  }
}
