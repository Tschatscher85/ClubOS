import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EinladungService } from './einladung.service';
import { OeffentlicheEinreichungDto } from './dto/einreichung.dto';

/**
 * Oeffentlicher Controller fuer Einladungen — kein Auth-Guard.
 * Ermoeglicht das Abrufen und Abschliessen von Einladungen per Token.
 */
@ApiTags('Einladungen (Oeffentlich)')
@Controller('einladungen/token')
export class EinladungPublicController {
  constructor(private einladungService: EinladungService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Einladung per Token abrufen (oeffentlich)',
    description:
      'Laedt die Einladungsdaten inkl. Vereinsinfo und optionaler Formularvorlage. Setzt den Status auf GEOEFFNET.',
  })
  async einladungAbrufen(@Param('token') token: string) {
    return this.einladungService.einladungAbrufen(token);
  }

  @Post(':token/ausgefuellt')
  @ApiOperation({
    summary: 'Einladung als ausgefuellt markieren (oeffentlich)',
    description: 'Markiert die Einladung als AUSGEFUELLT, nachdem das Formular eingereicht wurde.',
  })
  async alsAusgefuellt(@Param('token') token: string) {
    return this.einladungService.alsAusgefuellt(token);
  }

  @Get('oeffentlich/:token')
  @ApiOperation({
    summary: 'Einladung oeffentlich laden (mit Formularvorlagen)',
    description:
      'Laedt die Einladungsdaten inkl. Vereinsinfo und Formularvorlagen. Prueft Ablauf und setzt Status auf GEOEFFNET.',
  })
  async oeffentlichLaden(@Param('token') token: string) {
    return this.einladungService.oeffentlichLaden(token);
  }

  @Post('oeffentlich/:token/einreichen')
  @ApiOperation({
    summary: 'Mitgliedsantrag oeffentlich einreichen (mit Unterschrift)',
    description:
      'Reicht alle Formulare ein, erstellt FormSubmissions mit Signaturdaten, setzt Einladung auf AUSGEFUELLT und generiert eine HTML-Quittung.',
  })
  async einreichen(
    @Param('token') token: string,
    @Body() dto: OeffentlicheEinreichungDto,
  ) {
    return this.einladungService.einreichen(token, dto);
  }
}
