import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EinladungService } from './einladung.service';
import { ErstelleEinladungDto } from './dto/erstelle-einladung.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Einladungen')
@Controller('einladungen')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class EinladungController {
  constructor(private einladungService: EinladungService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Neue Einladung erstellen und per E-Mail versenden' })
  async einladen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: ErstelleEinladungDto,
  ) {
    return this.einladungService.einladen(tenantId, userId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Alle Einladungen des Vereins abrufen' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
  ) {
    return this.einladungService.alleAbrufen(tenantId);
  }
}
