import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EmailEinstellungenService } from './email-einstellungen.service';
import { EmailEinstellungenDto } from './dto/email-einstellungen.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('E-Mail-Einstellungen')
@Controller('email-einstellungen')
@UseGuards(JwtAuthGuard, RollenGuard)
@ApiBearerAuth()
export class EmailEinstellungenController {
  constructor(
    private emailEinstellungenService: EmailEinstellungenService,
  ) {}

  @Put()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'SMTP-Einstellungen speichern oder aktualisieren' })
  async speichern(
    @AktuellerBenutzer('id') userId: string,
    @Body() dto: EmailEinstellungenDto,
  ) {
    return this.emailEinstellungenService.speichern(userId, dto);
  }

  @Get()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Eigene SMTP-Einstellungen abrufen (Passwort maskiert)' })
  async abrufen(
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.emailEinstellungenService.abrufen(userId);
  }

  @Delete()
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Eigene SMTP-Einstellungen loeschen' })
  async loeschen(
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.emailEinstellungenService.loeschen(userId);
  }

  @Post('testen')
  @Rollen(Role.SUPERADMIN, Role.ADMIN, Role.TRAINER)
  @ApiOperation({ summary: 'Test-E-Mail senden, um SMTP-Konfiguration zu pruefen' })
  async testen(
    @AktuellerBenutzer('id') userId: string,
  ) {
    return this.emailEinstellungenService.testen(userId);
  }
}
