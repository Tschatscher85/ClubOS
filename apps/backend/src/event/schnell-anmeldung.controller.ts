import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventService } from './event.service';
import { SchnellAnmeldungDto } from './dto/erstelle-event.dto';

/**
 * Oeffentlicher Controller fuer Schnell-Anmeldung per Token.
 * Kein Auth-Guard — Zugriff ueber Token-Validierung gesichert.
 */
@ApiTags('Schnell-Anmeldung')
@Controller('veranstaltungen')
export class SchnellAnmeldungController {
  constructor(private eventService: EventService) {}

  @Post('schnell-anmeldung')
  @ApiOperation({
    summary: 'Schnell-Anmeldung per Token (oeffentlich, kein Login noetig)',
  })
  async schnellAnmeldung(@Body() dto: SchnellAnmeldungDto) {
    return this.eventService.schnellAnmeldung(dto.token, dto.status, dto.grund);
  }
}
