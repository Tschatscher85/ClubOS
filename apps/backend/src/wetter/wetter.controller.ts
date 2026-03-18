import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WetterService, WetterDaten } from './wetter.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('wetter')
@UseGuards(JwtAuthGuard)
export class WetterController {
  constructor(private readonly wetterService: WetterService) {}

  /**
   * GET /wetter?lat=X&lng=Y&datum=ISO
   * Wetterdaten fuer einen bestimmten Ort und Zeitpunkt abrufen.
   */
  @Get()
  async getWetter(
    @Query('lat') latStr: string,
    @Query('lng') lngStr: string,
    @Query('datum') datumStr: string,
  ): Promise<WetterDaten> {
    if (!latStr || !lngStr || !datumStr) {
      throw new BadRequestException(
        'Parameter "lat", "lng" und "datum" sind erforderlich.',
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException(
        'Parameter "lat" und "lng" muessen gueltige Zahlen sein.',
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException(
        'Koordinaten ausserhalb des gueltigen Bereichs (lat: -90 bis 90, lng: -180 bis 180).',
      );
    }

    const datum = new Date(datumStr);
    if (isNaN(datum.getTime())) {
      throw new BadRequestException(
        'Parameter "datum" muss ein gueltiges ISO-Datum sein (z.B. 2026-03-20T15:00:00Z).',
      );
    }

    const wetter = await this.wetterService.getWetter(lat, lng, datum);
    if (!wetter) {
      throw new NotFoundException(
        'Wetterdaten konnten nicht geladen werden. Bitte spaeter erneut versuchen.',
      );
    }

    return wetter;
  }

  /**
   * GET /wetter/event/:eventId
   * Wetterdaten fuer ein bestimmtes Event abrufen (wenn lat/lng vorhanden).
   */
  @Get('event/:eventId')
  async getWetterFuerEvent(
    @Param('eventId') eventId: string,
    @Request() req: { user: { tenantId: string } },
  ): Promise<WetterDaten> {
    if (!eventId) {
      throw new BadRequestException('Event-ID ist erforderlich.');
    }

    const wetter = await this.wetterService.getWetterFuerEvent(
      eventId,
      req.user.tenantId,
    );

    if (!wetter) {
      throw new NotFoundException(
        'Wetterdaten nicht verfuegbar. Moegliche Gruende: Event hat keine Koordinaten oder die API ist nicht erreichbar.',
      );
    }

    return wetter;
  }
}
