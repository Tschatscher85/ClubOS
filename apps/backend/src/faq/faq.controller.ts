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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FaqService } from './faq.service';
import { ErstelleFaqDto, AktualisiereFaqDto, FrageDto } from './dto/erstelle-faq.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('FAQ')
@Controller('faqs')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class FaqController {
  constructor(private faqService: FaqService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'FAQ erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleFaqDto,
  ) {
    return this.faqService.faqErstellen(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle FAQs abrufen (optional nach Team filtern)' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.faqService.alleAbrufen(tenantId, teamId);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'FAQ aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereFaqDto,
  ) {
    return this.faqService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'FAQ loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.faqService.loeschen(tenantId, id);
    return { nachricht: 'FAQ erfolgreich geloescht.' };
  }

  @Post('fragen')
  @Rollen(Role.PARENT, Role.MEMBER, Role.TRAINER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Frage stellen (KI-FAQ-System)' })
  async frageStellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: FrageDto,
  ) {
    return this.faqService.automatischAntworten(tenantId, dto.frage, dto.teamId);
  }
}
