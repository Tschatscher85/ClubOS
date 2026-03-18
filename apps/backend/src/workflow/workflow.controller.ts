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
import { WorkflowService } from './workflow.service';
import {
  ErstelleWorkflowDto,
  AktualisiereWorkflowDto,
} from './dto/erstelle-workflow.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neuen Workflow erstellen (nur Admin/Vorstand)' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleWorkflowDto,
  ) {
    return this.workflowService.erstellen(tenantId, userId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Workflows abrufen (Trainer koennen ausfuehren, nur Admin bearbeiten)' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.workflowService.alleAbrufen(tenantId);
  }

  @Get(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Workflow nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.workflowService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Workflow bearbeiten (nur Admin/Vorstand)' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereWorkflowDto,
  ) {
    return this.workflowService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Workflow loeschen (nur Admin/Vorstand)' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.workflowService.loeschen(tenantId, id);
    return { nachricht: 'Workflow erfolgreich geloescht.' };
  }
}
