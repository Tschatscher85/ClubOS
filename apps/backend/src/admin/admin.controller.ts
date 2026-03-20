import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { Role, Plan } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RollenGuard)
@Rollen(Role.SUPERADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
  ) {
    return this.adminService.vereinSperren(
      id,
      grund || 'Kein Grund angegeben',
    );
  }

  /** Verein entsperren */
  @Put('vereine/:id/entsperren')
  async vereinEntsperren(@Param('id') id: string) {
    return this.adminService.vereinEntsperren(id);
  }

  /** Plan aendern */
  @Put('vereine/:id/plan')
  async planAendern(
    @Param('id') id: string,
    @Body('plan') plan: Plan,
  ) {
    return this.adminService.planAendern(id, plan);
  }

  /** Als Verein einloggen (Impersonation) */
  @Post('vereine/:id/impersonate')
  async impersonate(@Param('id') id: string) {
    return this.adminService.impersonate(id);
  }

  /** KI pro Verein freischalten / sperren + Provider waehlen */
  @Put('vereine/:id/ki')
  async kiToggle(
    @Param('id') id: string,
    @Body() body: { freigeschaltet: boolean; provider?: string },
  ) {
    return this.adminService.kiToggle(id, body.freigeschaltet, body.provider);
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
  ) {
    return this.adminService.plattformKiSpeichern(daten);
  }

  /** Vereins-Daten exportieren */
  @Get('vereine/:id/export')
  async vereinExport(@Param('id') id: string) {
    return this.adminService.vereinExport(id);
  }
}
