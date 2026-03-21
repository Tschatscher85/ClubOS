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
import { Role, PartnerKategorie } from '@prisma/client';
import { KooperationspartnerService } from './kooperationspartner.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RollenGuard } from '../common/guards/rollen.guard';
import { Rollen } from '../common/decorators/rollen.decorator';
import { AktuellerBenutzer } from '../common/decorators/aktueller-benutzer.decorator';

@ApiTags('Kooperationspartner')
@Controller('kooperationspartner')
@UseGuards(JwtAuthGuard, RollenGuard)
@ApiBearerAuth()
export class KooperationspartnerController {
  constructor(private kooperationspartnerService: KooperationspartnerService) {}

  @Post()
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Neuen Kooperationspartner erstellen' })
  async erstellen(
    @AktuellerBenutzer() _benutzer: unknown,
    @Body()
    dto: {
      name: string;
      logoUrl?: string;
      webseite?: string;
      beschreibung?: string;
      kategorie: PartnerKategorie;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      provisionProzent?: number;
      rabattProzent?: number;
      rabattCode?: string;
      prioritaet?: number;
    },
  ) {
    return this.kooperationspartnerService.erstellen(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Alle aktiven Kooperationspartner abrufen' })
  async alleLaden(
    @AktuellerBenutzer() _benutzer: unknown,
    @Query('kategorie') kategorie?: PartnerKategorie,
  ) {
    return this.kooperationspartnerService.alleLaden(kategorie);
  }

  @Put(':id')
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Kooperationspartner aktualisieren' })
  async aktualisieren(
    @AktuellerBenutzer() _benutzer: unknown,
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      logoUrl?: string;
      webseite?: string;
      beschreibung?: string;
      kategorie?: PartnerKategorie;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      provisionProzent?: number;
      rabattProzent?: number;
      rabattCode?: string;
      istAktiv?: boolean;
      prioritaet?: number;
    },
  ) {
    return this.kooperationspartnerService.aktualisieren(id, dto);
  }

  @Delete(':id')
  @Rollen(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Kooperationspartner loeschen' })
  async loeschen(
    @AktuellerBenutzer() _benutzer: unknown,
    @Param('id') id: string,
  ) {
    await this.kooperationspartnerService.loeschen(id);
    return { nachricht: 'Kooperationspartner erfolgreich geloescht.' };
  }
}
