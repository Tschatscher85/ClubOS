import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';
import { Role, Plan } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RollenGuard)
@Rollen(Role.SUPERADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  /** Plattform-Statistiken */
  @Get('statistiken')
  async statistiken() {
    return this.adminService.plattformStatistiken();
  }

  /** Alle Vereine auflisten */
  @Get('vereine')
  async alleVereine() {
    return this.adminService.alleVereine();
  }

  /** Einzelnen Verein mit Details */
  @Get('vereine/:id')
  async vereinDetail(@Param('id') id: string) {
    return this.adminService.vereinDetail(id);
  }

  /** Verein sperren */
  @Put('vereine/:id/sperren')
  async vereinSperren(
    @Param('id') id: string,
    @Body('grund') grund: string,
    @AktuellerBenutzer() benutzer: { id: string; email: string },
    @Req() req: Request,
  ) {
    return this.adminService.vereinSperren(
      id,
      grund || 'Kein Grund angegeben',
      { userId: benutzer.id, userEmail: benutzer.email, ipAdresse: req.ip },
    );
  }

  /** Verein entsperren */
  @Put('vereine/:id/entsperren')
  async vereinEntsperren(
    @Param('id') id: string,
    @AktuellerBenutzer() benutzer: { id: string; email: string },
    @Req() req: Request,
  ) {
    return this.adminService.vereinEntsperren(id, {
      userId: benutzer.id,
      userEmail: benutzer.email,
      ipAdresse: req.ip,
    });
  }

  /** Plan aendern */
  @Put('vereine/:id/plan')
  async planAendern(
    @Param('id') id: string,
    @Body('plan') plan: Plan,
    @AktuellerBenutzer() benutzer: { id: string; email: string },
    @Req() req: Request,
  ) {
    return this.adminService.planAendern(id, plan, {
      userId: benutzer.id,
      userEmail: benutzer.email,
      ipAdresse: req.ip,
    });
  }

  /** Als Verein einloggen (Impersonation) */
  @Post('vereine/:id/impersonate')
  async impersonate(
    @Param('id') id: string,
    @AktuellerBenutzer() benutzer: { id: string; email: string },
    @Req() req: Request,
  ) {
    return this.adminService.impersonate(id, {
      userId: benutzer.id,
      userEmail: benutzer.email,
      ipAdresse: req.ip,
    });
  }

  /** KI pro Verein freischalten / sperren + Provider waehlen */
  @Put('vereine/:id/ki')
  async kiToggle(
    @Param('id') id: string,
    @Body() body: { freigeschaltet: boolean; provider?: string },
    @AktuellerBenutzer() benutzer: { id: string; email: string },
    @Req() req: Request,
  ) {
    return this.adminService.kiToggle(id, body.freigeschaltet, body.provider, {
      userId: benutzer.id,
      userEmail: benutzer.email,
      ipAdresse: req.ip,
    });
  }

  /** Plattform KI-Einstellungen laden */
  @Get('ki-einstellungen')
  async plattformKiLaden() {
    return this.adminService.plattformKiLaden();
  }

  /** Plattform KI-Einstellungen speichern */
  @Put('ki-einstellungen')
  async plattformKiSpeichern(
    @Body() daten: { anthropicApiKey?: string; openaiApiKey?: string; standardProvider?: string; standardModell?: string },
    @AktuellerBenutzer() benutzer: { id: string; email: string },
    @Req() req: Request,
  ) {
    return this.adminService.plattformKiSpeichern(daten, {
      userId: benutzer.id,
      userEmail: benutzer.email,
      ipAdresse: req.ip,
    });
  }

  /** Plattform E-Mail (SMTP/IMAP) laden */
  @Get('email-einstellungen')
  async plattformEmailLaden() {
    return this.adminService.plattformEmailLaden();
  }

  /** Plattform E-Mail (SMTP/IMAP) speichern */
  @Put('email-einstellungen')
  async plattformEmailSpeichern(
    @Body() daten: {
      smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPass?: string;
      smtpFrom?: string; smtpFromName?: string;
      imapHost?: string; imapPort?: number; imapUser?: string; imapPass?: string;
    },
    @AktuellerBenutzer() benutzer: { id: string; email: string },
    @Req() req: Request,
  ) {
    return this.adminService.plattformEmailSpeichern(daten, {
      userId: benutzer.id,
      userEmail: benutzer.email,
      ipAdresse: req.ip,
    });
  }

  /** Test-Mail senden */
  @Post('email-test')
  async testMailSenden(
    @Body() daten: { empfaenger: string },
    @AktuellerBenutzer() benutzer: { id: string; email: string },
  ) {
    return this.adminService.testMailSenden(daten.empfaenger, benutzer.email);
  }

  /** Vereins-Daten exportieren */
  @Get('vereine/:id/export')
  async vereinExport(@Param('id') id: string) {
    return this.adminService.vereinExport(id);
  }

  /** Audit-Log abrufen */
  @Get('audit-log')
  async auditLog(
    @Query('seite') seite?: string,
    @Query('aktion') aktion?: string,
    @Query('von') von?: string,
    @Query('bis') bis?: string,
  ) {
    return this.auditService.alleAbrufen({
      seite: seite ? parseInt(seite, 10) : 1,
      aktion: aktion || undefined,
      von: von || undefined,
      bis: bis || undefined,
    });
  }

  /** System-Status abrufen */
  @Get('system-status')
  async systemStatus() {
    return this.adminService.systemStatus();
  }
}
