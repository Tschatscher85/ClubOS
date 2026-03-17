import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FormService } from './form.service';
import {
  ErstelleTemplateDto,
  ErstelleSubmissionDto,
  StatusAendernDto,
} from './dto/erstelle-submission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Formulare')
@Controller('formulare')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class FormController {
  constructor(private formService: FormService) {}

  // ==================== Vorlagen ====================

  @Get('vorlagen')
  @ApiOperation({ summary: 'Alle Formularvorlagen abrufen' })
  async alleVorlagen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.formService.alleTemplatesAbrufen(tenantId);
  }

  @Post('vorlagen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neue Formularvorlage erstellen' })
  async vorlageErstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleTemplateDto,
  ) {
    return this.formService.templateErstellen(tenantId, dto);
  }

  @Get('vorlagen/:id')
  @ApiOperation({ summary: 'Formularvorlage nach ID abrufen' })
  async vorlageAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.formService.templateAbrufen(tenantId, id);
  }

  // ==================== Einreichungen ====================

  @Post('vorlagen/:id/einreichen')
  @ApiOperation({ summary: 'Formular einreichen (Online-Antrag)' })
  async einreichen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') templateId: string,
    @Body() dto: ErstelleSubmissionDto,
  ) {
    return this.formService.einreichen(tenantId, templateId, dto);
  }

  @Get('einreichungen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Einreichungen abrufen' })
  @ApiQuery({ name: 'templateId', required: false, description: 'Nach Vorlage filtern' })
  async alleEinreichungen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('templateId') templateId?: string,
  ) {
    return this.formService.alleEinreichungenAbrufen(tenantId, templateId);
  }

  @Get('einreichungen/:id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Einzelne Einreichung abrufen' })
  async einreichungAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.formService.einreichungAbrufen(tenantId, id);
  }

  @Put('einreichungen/:id/status')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Status einer Einreichung aendern' })
  async statusAendern(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: StatusAendernDto,
  ) {
    return this.formService.statusAendern(
      tenantId,
      id,
      dto.status,
      dto.kommentar,
    );
  }

  @Get('einreichungen/:id/pdf')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Einreichung als PDF-Daten abrufen' })
  async einreichungAlsPdf(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.formService.einreichungAlsPdf(tenantId, id);
  }
}
