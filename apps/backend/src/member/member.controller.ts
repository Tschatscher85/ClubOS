import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MemberService } from './member.service';
import {
  ErstelleMitgliedDto,
  AktualisiereMitgliedDto,
  VerknuepfeMitgliedDto,
  StatusAendernDto,
  BatchFreigebenDto,
} from './dto/erstelle-mitglied.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Mitglieder')
@Controller('mitglieder')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neues Mitglied anlegen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleMitgliedDto,
  ) {
    return this.memberService.erstellen(tenantId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Mitglieder des Vereins abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.memberService.alleAbrufen(tenantId);
  }

  @Get('suchen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglieder suchen' })
  @ApiQuery({ name: 'q', required: true, description: 'Suchbegriff (Vor-/Nachname/E-Mail)' })
  @ApiQuery({ name: 'status', required: false, description: 'Mitgliedsstatus filtern' })
  @ApiQuery({ name: 'sportart', required: false, description: 'Sportart filtern' })
  async suchen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('q') suchbegriff: string,
    @Query('status') status?: string,
    @Query('sportart') sportart?: string,
  ) {
    return this.memberService.suchen(tenantId, suchbegriff, status, sportart);
  }

  @Post('batch-freigeben')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mehrere Mitglieder gleichzeitig freigeben (mit Auto-Login)' })
  async batchFreigeben(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: BatchFreigebenDto,
  ) {
    return this.memberService.batchFreigeben(tenantId, dto.ids);
  }

  // ==================== Eltern-Portal ====================

  @Get('meine-kinder')
  @Rollen(Role.PARENT)
  @ApiOperation({ summary: 'Eigene Kinder abrufen (Eltern-Portal)' })
  async meineKinder(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('email') elternEmail: string,
  ) {
    return this.memberService.meineKinder(tenantId, elternEmail);
  }

  @Get('meine-kinder/teams')
  @Rollen(Role.PARENT)
  @ApiOperation({ summary: 'Teams der eigenen Kinder abrufen (Eltern-Portal)' })
  async meineKinderTeams(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('email') elternEmail: string,
  ) {
    return this.memberService.meineKinderTeams(tenantId, elternEmail);
  }

  @Get('meine-kinder/abteilungen')
  @Rollen(Role.PARENT)
  @ApiOperation({ summary: 'Abteilungen der eigenen Kinder abrufen (Eltern-Portal)' })
  async meineKinderAbteilungen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('email') elternEmail: string,
  ) {
    return this.memberService.meineKinderAbteilungen(tenantId, elternEmail);
  }

  @Get('statistik')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglieder-Statistik abrufen' })
  async statistik(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.memberService.statistik(tenantId);
  }

  // ==================== Login-Verwaltung ====================

  @Post(':id/login-erstellen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Login fuer Mitglied erstellen (User-Account anlegen)' })
  async loginErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.memberService.loginErstellen(tenantId, id);
  }

  @Get(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglied nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.memberService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglied aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereMitgliedDto,
  ) {
    return this.memberService.aktualisieren(tenantId, id, dto);
  }

  @Put(':id/status')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitgliedsstatus aendern (bei ACTIVE wird Login erstellt)' })
  async statusAendern(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: StatusAendernDto,
  ) {
    return this.memberService.statusAendern(tenantId, id, dto.status);
  }

  @Put(':id/verknuepfen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mitglied mit Benutzer verknuepfen' })
  async mitBenutzerVerknuepfen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: VerknuepfeMitgliedDto,
  ) {
    return this.memberService.mitBenutzerVerknuepfen(tenantId, id, dto.userId);
  }

  @Delete(':id/verknuepfen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Verknuepfung zwischen Mitglied und Benutzer aufheben' })
  async verknuepfungAufheben(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.memberService.verknuepfungAufheben(tenantId, id);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Mitglied loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.memberService.loeschen(tenantId, id);
    return { nachricht: 'Mitglied erfolgreich geloescht.' };
  }
}
