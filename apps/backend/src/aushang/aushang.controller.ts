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
import { AushangService, ErstelleAushangDto, AktualisiereAushangDto } from './aushang.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Aushaenge')
@Controller('aushaenge')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class AushangController {
  constructor(private aushangService: AushangService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Aushang erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleAushangDto,
  ) {
    return this.aushangService.erstellen(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Aushaenge abrufen (MEMBER/PARENT: nur eigene Teams)' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
  ) {
    return this.aushangService.alleAbrufen(tenantId, userId, rolle);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Aushang aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereAushangDto,
  ) {
    return this.aushangService.aktualisieren(tenantId, id, userId, rolle, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aushang loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @AktuellerBenutzer('rolle') rolle: string,
    @Param('id') id: string,
  ) {
    await this.aushangService.loeschen(tenantId, id, userId, rolle);
    return { nachricht: 'Aushang erfolgreich geloescht.' };
  }
}
