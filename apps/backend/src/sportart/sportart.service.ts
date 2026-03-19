import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Sport } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleCustomSportartDto,
  AktualisiereCustomSportartDto,
} from './dto/custom-sportart.dto';

/** Mapping aller vordefinierten Sport-Enum-Werte auf deutsche Labels */
const SPORT_LABELS: Record<Sport, string> = {
  [Sport.FUSSBALL]: 'Fussball',
  [Sport.HANDBALL]: 'Handball',
  [Sport.BASKETBALL]: 'Basketball',
  [Sport.FOOTBALL]: 'Football',
  [Sport.TENNIS]: 'Tennis',
  [Sport.TURNEN]: 'Turnen',
  [Sport.SCHWIMMEN]: 'Schwimmen',
  [Sport.LEICHTATHLETIK]: 'Leichtathletik',
  [Sport.VOLLEYBALL]: 'Volleyball',
  [Sport.TISCHTENNIS]: 'Tischtennis',
  [Sport.BADMINTON]: 'Badminton',
  [Sport.HOCKEY]: 'Hockey',
  [Sport.RUGBY]: 'Rugby',
  [Sport.BASEBALL]: 'Baseball',
  [Sport.SOFTBALL]: 'Softball',
  [Sport.EISHOCKEY]: 'Eishockey',
  [Sport.WASSERBALL]: 'Wasserball',
  [Sport.RINGEN]: 'Ringen',
  [Sport.JUDO]: 'Judo',
  [Sport.KARATE]: 'Karate',
  [Sport.TAEKWONDO]: 'Taekwondo',
  [Sport.BOXEN]: 'Boxen',
  [Sport.FECHTEN]: 'Fechten',
  [Sport.REITEN]: 'Reiten',
  [Sport.GOLF]: 'Golf',
  [Sport.KLETTERN]: 'Klettern',
  [Sport.SKIFAHREN]: 'Skifahren',
  [Sport.SNOWBOARD]: 'Snowboard',
  [Sport.RADSPORT]: 'Radsport',
  [Sport.TRIATHLON]: 'Triathlon',
  [Sport.RUDERN]: 'Rudern',
  [Sport.KANU]: 'Kanu',
  [Sport.SEGELN]: 'Segeln',
  [Sport.TANZEN]: 'Tanzen',
  [Sport.YOGA]: 'Yoga',
  [Sport.FITNESS]: 'Fitness',
  [Sport.CROSSFIT]: 'CrossFit',
  [Sport.WANDERN]: 'Wandern',
  [Sport.LAUFEN]: 'Laufen',
  [Sport.DART]: 'Dart',
  [Sport.BILLARD]: 'Billard',
  [Sport.SCHACH]: 'Schach',
  [Sport.ESPORT]: 'E-Sport',
  [Sport.CHEERLEADING]: 'Cheerleading',
  [Sport.AKROBATIK]: 'Akrobatik',
  [Sport.TRAMPOLINTURNEN]: 'Trampolinturnen',
  [Sport.RHYTHMISCHE_SPORTGYMNASTIK]: 'Rhythmische Sportgymnastik',
  [Sport.EISKUNSTLAUF]: 'Eiskunstlauf',
  [Sport.BOGENSCHIESSEN]: 'Bogenschiessen',
  [Sport.SCHIESSEN]: 'Schiessen',
  [Sport.ANGELN]: 'Angeln',
  [Sport.MOTORSPORT]: 'Motorsport',
  [Sport.FLOORBALL]: 'Floorball',
  [Sport.LACROSSE]: 'Lacrosse',
  [Sport.CRICKET]: 'Cricket',
  [Sport.SQUASH]: 'Squash',
  [Sport.KICKBOXEN]: 'Kickboxen',
  [Sport.MMA]: 'Mixed Martial Arts',
  [Sport.CAPOEIRA]: 'Capoeira',
  [Sport.PARKOUR]: 'Parkour',
  [Sport.SKATEBOARD]: 'Skateboard',
  [Sport.SURFEN]: 'Surfen',
  [Sport.TAUCHEN]: 'Tauchen',
  [Sport.WASSERSKI]: 'Wasserski',
  [Sport.GEWICHTHEBEN]: 'Gewichtheben',
  [Sport.POWERLIFTING]: 'Powerlifting',
  [Sport.ROLLSPORT]: 'Rollsport',
  [Sport.PETANQUE]: 'Petanque',
  [Sport.CURLING]: 'Curling',
  [Sport.SONSTIGES]: 'Sonstiges',
  [Sport.CUSTOM]: 'Eigene Sportart',
};

@Injectable()
export class SportartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Alle verfuegbaren Sportarten abrufen:
   * Vordefinierte Enum-Werte + eigene Sportarten des Vereins
   */
  async alleAbrufen(tenantId: string) {
    // Vordefinierte Sportarten (ohne CUSTOM, da das nur ein Platzhalter ist)
    const vordefinierte = Object.entries(SPORT_LABELS)
      .filter(([key]) => key !== Sport.CUSTOM)
      .map(([key, label]) => ({
        id: key,
        name: label,
        beschreibung: '',
        icon: '',
        istVordefiniert: true,
      }));

    // Eigene Sportarten des Vereins
    const customSportarten = await this.prisma.customSportart.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    const eigene = customSportarten.map((cs) => ({
      id: cs.id,
      name: cs.name,
      beschreibung: cs.beschreibung || '',
      icon: cs.icon || '',
      istVordefiniert: false,
    }));

    return [...vordefinierte, ...eigene];
  }

  /**
   * Eigene Sportart erstellen
   */
  async customErstellen(tenantId: string, dto: ErstelleCustomSportartDto) {
    // Pruefen ob Name bereits existiert (fuer diesen Verein)
    const bestehend = await this.prisma.customSportart.findUnique({
      where: {
        tenantId_name: { tenantId, name: dto.name },
      },
    });

    if (bestehend) {
      throw new ConflictException(
        `Eine eigene Sportart mit dem Namen "${dto.name}" existiert bereits.`,
      );
    }

    return this.prisma.customSportart.create({
      data: {
        tenantId,
        name: dto.name,
        beschreibung: dto.beschreibung,
        icon: dto.icon,
      },
    });
  }

  /**
   * Eigene Sportart aktualisieren
   */
  async customAktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereCustomSportartDto,
  ) {
    const sportart = await this.prisma.customSportart.findFirst({
      where: { id, tenantId },
    });

    if (!sportart) {
      throw new NotFoundException('Eigene Sportart nicht gefunden.');
    }

    // Falls Name geaendert wird, pruefen ob neuer Name schon existiert
    if (dto.name && dto.name !== sportart.name) {
      const bestehend = await this.prisma.customSportart.findUnique({
        where: {
          tenantId_name: { tenantId, name: dto.name },
        },
      });

      if (bestehend) {
        throw new ConflictException(
          `Eine eigene Sportart mit dem Namen "${dto.name}" existiert bereits.`,
        );
      }
    }

    return this.prisma.customSportart.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });
  }

  /**
   * Eigene Sportart loeschen
   */
  async customLoeschen(tenantId: string, id: string) {
    const sportart = await this.prisma.customSportart.findFirst({
      where: { id, tenantId },
    });

    if (!sportart) {
      throw new NotFoundException('Eigene Sportart nicht gefunden.');
    }

    return this.prisma.customSportart.delete({ where: { id } });
  }
}
