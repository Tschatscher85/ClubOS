import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FahrgemeinschaftService } from './fahrgemeinschaft.service';
import { ErstelleFahrgemeinschaftDto } from './dto/erstelle-fahrgemeinschaft.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Fahrgemeinschaften')
@Controller('fahrgemeinschaften')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class FahrgemeinschaftController {
  constructor(private fahrgemeinschaftService: FahrgemeinschaftService) {}

  @Post()
  @ApiOperation({ summary: 'Neue Fahrgemeinschaft erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleFahrgemeinschaftDto,
  ) {
    return this.fahrgemeinschaftService.erstellen(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Fahrgemeinschaften des Vereins abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.fahrgemeinschaftService.alleAbrufen(tenantId);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Fahrgemeinschaften fuer eine Veranstaltung abrufen' })
  async fuerEvent(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.fahrgemeinschaftService.fuerEvent(tenantId, eventId);
  }

  @Post(':id/mitfahren')
  @ApiOperation({ summary: 'Als Mitfahrer eintragen' })
  async mitfahren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.fahrgemeinschaftService.mitfahren(tenantId, id, userId);
  }

  @Delete(':id/mitfahren')
  @ApiOperation({ summary: 'Mitfahrt stornieren' })
  async austreten(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.fahrgemeinschaftService.austreten(tenantId, id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Fahrgemeinschaft loeschen (nur Fahrer)' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.fahrgemeinschaftService.loeschen(tenantId, id, userId);
  }
}
