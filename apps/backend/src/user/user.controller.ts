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
import { UserService } from './user.service';
import { ErstelleUserDto, AktualisiereUserDto } from './dto/erstelle-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Benutzer')
@Controller('benutzer')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Neuen Benutzer im Verein erstellen' })
  async erstellen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Body() dto: ErstelleUserDto,
  ) {
    return this.userService.erstellen(tenantId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Alle Benutzer des Vereins abrufen' })
  async alleAbrufen(@AktuellerBenutzer('tenantId') tenantId: string) {
    return this.userService.alleAbrufen(tenantId);
  }

  @Get(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Benutzer nach ID abrufen' })
  async nachIdAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.userService.nachIdAbrufen(tenantId, id);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Benutzer aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AktualisiereUserDto,
  ) {
    return this.userService.aktualisieren(tenantId, id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Benutzer loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.userService.loeschen(tenantId, id);
    return { nachricht: 'Benutzer erfolgreich geloescht.' };
  }
}
