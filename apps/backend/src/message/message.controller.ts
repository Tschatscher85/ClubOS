import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MessageService } from './message.service';
import { ErstelleNachrichtDto } from './dto/erstelle-nachricht.dto';
import { NotfallBroadcastDto } from './dto/notfall-broadcast.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Nachrichten')
@Controller('nachrichten')
@UseGuards(JwtAuthGuard, RollenGuard, TenantGuard)
@ApiBearerAuth()
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Post()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER, Role.PARENT)
  @ApiOperation({ summary: 'Nachricht senden' })
  async senden(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') senderId: string,
    @AktuellerBenutzer('rolle') senderRolle: string,
    @Body() dto: ErstelleNachrichtDto,
  ) {
    return this.messageService.senden(tenantId, senderId, senderRolle, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Nachrichten abrufen (optional nach Team filtern)' })
  async alleAbrufen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.messageService.alleAbrufen(tenantId, teamId);
  }

  @Get('ungelesen')
  @ApiOperation({ summary: 'Anzahl ungelesener Nachrichten' })
  async ungeleseneAnzahl(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.messageService.ungeleseneAnzahl(tenantId, userId);
  }

  @Post('notfall')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Notfall-Broadcast senden (ignoriert Stille-Stunden)' })
  async notfallBroadcast(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @AktuellerBenutzer('id') senderId: string,
    @Body() dto: NotfallBroadcastDto,
  ) {
    return this.messageService.notfallBroadcastSenden(tenantId, senderId, dto);
  }

  @Post(':id/gelesen')
  @ApiOperation({ summary: 'Nachricht als gelesen markieren' })
  async alsGelesenMarkieren(
    @Param('id') nachrichtId: string,
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.messageService.alsGelesenMarkieren(nachrichtId, userId);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Nachricht loeschen' })
  async loeschen(
    @AktuellerBenutzer('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.messageService.loeschen(tenantId, id);
    return { nachricht: 'Nachricht erfolgreich geloescht.' };
  }
}
