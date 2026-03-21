import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SponsorPortalService } from './sponsor-portal.service';

@ApiTags('Sponsoren-Portal')
@Controller('sponsoren/portal')
export class SponsorPortalController {
  constructor(private portalService: SponsorPortalService) {}

  @Post('login')
  @ApiOperation({ summary: 'Magic Link an Sponsor-Login-E-Mail senden' })
  async login(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('E-Mail-Adresse ist erforderlich.');
    }
    return this.portalService.sendeMagicLink(body.email);
  }

  @Get('token/:token')
  @ApiOperation({ summary: 'Token validieren und Sponsor-Daten zurueckgeben' })
  async tokenValidieren(@Param('token') token: string) {
    const sponsor = await this.portalService.tokenValidieren(token);
    if (!sponsor) {
      throw new UnauthorizedException('Ungueltiger oder abgelaufener Token.');
    }
    return sponsor;
  }

  @Get('dashboard/:token')
  @ApiOperation({ summary: 'Sponsor-Dashboard-Daten abrufen' })
  async dashboard(@Param('token') token: string) {
    const data = await this.portalService.dashboardDaten(token);
    if (!data) {
      throw new UnauthorizedException('Ungueltiger oder abgelaufener Token.');
    }
    return data;
  }
}
