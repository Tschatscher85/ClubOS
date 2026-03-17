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
import { EventService } from './event.service';
import { ErstelleEventDto, AktualisiereEventDto } from './dto/erstelle-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Veranstaltungen')
@Controller('veranstaltungen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class EventController {
  constructor(private eventService: EventService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neue Veranstaltung erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleEventDto,
  ) {
    return this.eventService.erstellen(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle Veranstaltungen abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.eventService.alleAbrufen(tenantId);
  }

  @Get('kommende')
  @ApiOperation({ summary: 'Kommende Veranstaltungen abrufen' })
  async kommendeAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.eventService.kommendeAbrufen(tenantId);
  }

  @Get('naechstes')
  @ApiOperation({ summary: 'Naechste Veranstaltung abrufen' })
  async naechstesEvent(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.eventService.naechstesEvent(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Veranstaltung nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.eventService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Veranstaltung aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereEventDto,
  ) {
    return this.eventService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Veranstaltung loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.eventService.loeschen(tenantId, id);
    return { nachricht: 'Veranstaltung erfolgreich geloescht.' };
  }
}
