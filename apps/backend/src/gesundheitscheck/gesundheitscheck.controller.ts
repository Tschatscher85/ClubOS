import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GesundheitscheckService } from './gesundheitscheck.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Gesundheitscheck')
@Controller('gesundheitscheck')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class GesundheitscheckController {
  constructor(private gesundheitscheckService: GesundheitscheckService) {}

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Vereins-Gesundheitscheck abrufen (Score 0-100)' })
  async analyse(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.gesundheitscheckService.analyse(tenantId);
  }
}
