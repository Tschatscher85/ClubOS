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
import { UserService } from './user.service';
import {
  ErstelleUserDto,
  AktualisiereUserDto,
  PasswortZuruecksetzenDto,
  ErstelleBenutzerDto,
  AktualisiereBenutzerDto,
  AktualisiereBerechtigungenDto,
} from './dto/erstelle-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Benutzer')
@Controller('benutzer')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neuen Benutzer im Verein erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleUserDto,
  ) {
    return this.userService.erstellen(tenantId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Benutzer des Vereins abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.userService.alleAbrufen(tenantId);
  }

  @Get(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Benutzer nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.userService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Benutzer aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereUserDto,
  ) {
    return this.userService.aktualisieren(tenantId, id, dto);
  }

  @Put(':id/passwort')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Passwort eines Benutzers zuruecksetzen' })
  async passwortZuruecksetzen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: PasswortZuruecksetzenDto,
  ) {
    return this.userService.passwortZuruecksetzen(tenantId, id, dto.neuesPasswort);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Benutzer loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.userService.loeschen(tenantId, id);
    return { nachricht: 'Benutzer erfolgreich geloescht.' };
  }

  // ==================== Benutzerverwaltung (Staff Management) ====================

  @Get('verwaltung/liste')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Alle Benutzer des Vereins mit Berechtigungen auflisten' })
  async benutzerAuflisten(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.userService.benutzerAuflisten(tenantId);
  }

  @Post('verwaltung/erstellen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neuen Benutzer mit temporaerem Passwort erstellen' })
  async benutzerErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('sub') eingeladenVonId: string,
    @Body() dto: ErstelleBenutzerDto,
  ) {
    return this.userService.benutzerErstellen(tenantId, eingeladenVonId, dto);
  }

  @Put('verwaltung/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Benutzer aktualisieren (Rolle, Berechtigungen, Status)' })
  async benutzerAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereBenutzerDto,
  ) {
    return this.userService.benutzerAktualisieren(tenantId, id, dto);
  }

  @Put('verwaltung/:id/berechtigungen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Berechtigungen eines Benutzers aktualisieren' })
  async berechtigungenAktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereBerechtigungenDto,
  ) {
    return this.userService.berechtigungenAktualisieren(tenantId, id, dto);
  }

  @Put('verwaltung/:id/deaktivieren')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Benutzer deaktivieren' })
  async benutzerDeaktivieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.userService.benutzerDeaktivieren(tenantId, id);
  }

  @Put('verwaltung/:id/aktivieren')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Benutzer reaktivieren' })
  async benutzerAktivieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.userService.benutzerAktivieren(tenantId, id);
  }

  @Put('verwaltung/:id/vereinsrollen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Vereinsrollen eines Benutzers zuweisen (berechnet Berechtigungen automatisch)' })
  async vereinsRollenZuweisen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: { vereinsRollen: string[]; zusaetzlicheBerechtigungen?: string[] },
  ) {
    return this.userService.vereinsRollenZuweisen(
      tenantId,
      id,
      dto.vereinsRollen,
      dto.zusaetzlicheBerechtigungen,
    );
  }

  @Delete('verwaltung/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Benutzer endgueltig loeschen (nicht sich selbst)' })
  async benutzerLoeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('sub') aktuellerBenutzerId: string,
    @Param('id') id: string,
  ) {
    return this.userService.benutzerLoeschen(tenantId, id, aktuellerBenutzerId);
  }
}
