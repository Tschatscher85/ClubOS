import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Empfehlungsprogramm')
@Controller('referral')
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Get('mein-code')
  @UseGuards(JwtAuthGuard, RollenGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eigenen Empfehlungscode abrufen (wird bei Bedarf erstellt)' })
  @ApiResponse({ status: 200, description: 'Empfehlungscode mit Statistik' })
  async meinCode(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.referralService.meinCodeAbrufen(tenantId);
  }

  @Post('einloesen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Empfehlungscode einloesen (waehrend Registrierung, ohne Auth)' })
  @ApiResponse({ status: 200, description: 'Code erfolgreich eingeloest' })
  @ApiResponse({ status: 404, description: 'Ungueltiger Empfehlungscode' })
  @ApiResponse({ status: 400, description: 'Code bereits eingeloest oder eigener Code' })
  async einloesen(@Body() body: { code: string; tenantId: string }) {
    return this.referralService.einloesen(body.code, body.tenantId);
  }

  @Get('statistik')
  @UseGuards(JwtAuthGuard, RollenGuard)
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detaillierte Empfehlungsstatistik abrufen' })
  @ApiResponse({ status: 200, description: 'Empfehlungsstatistik' })
  async statistik(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.referralService.statistikAbrufen(tenantId);
  }
}
