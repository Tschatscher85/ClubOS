import {
  Controller,
  Get,
  Post,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EinladungService } from './einladung.service';

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
}
