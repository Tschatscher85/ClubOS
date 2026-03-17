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
import { MemberService } from './member.service';
import {
  ErstelleMitgliedDto,
  AktualisiereMitgliedDto,
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

  @Get('statistik')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Mitglieder-Statistik abrufen' })
  async statistik(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.memberService.statistik(tenantId);
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
