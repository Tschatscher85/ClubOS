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
import { TenantService } from './tenant.service';
import { ErstelleTenantDto, AktualisiereTenantDto } from './dto/erstelle-tenant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';

@ApiTags('Vereine')
@Controller('vereine')
@UseGuards(JwtAuthGuard, RollenGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Neuen Verein erstellen (nur Superadmin)' })
  async erstellen(@Body() dto: ErstelleTenantDto) {
    return this.tenantService.erstellen(dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Alle Vereine abrufen (nur Superadmin)' })
  async alleAbrufen() {
    return this.tenantService.alleAbrufen();
  }

  @Get(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Verein nach ID abrufen' })
  async nachIdAbrufen(@Param('id') id: string) {
    return this.tenantService.nachIdAbrufen(id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Verein aktualisieren' })
  async aktualisieren(
    @Param('id') id: string,
    @Body() dto: AktualisiereTenantDto,
  ) {
    return this.tenantService.aktualisieren(id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Verein loeschen (nur Superadmin)' })
  async loeschen(@Param('id') id: string) {
    return this.tenantService.loeschen(id);
  }
}
