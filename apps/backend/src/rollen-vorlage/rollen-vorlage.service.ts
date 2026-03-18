import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleRollenVorlageDto } from './dto/erstelle-rollen-vorlage.dto';
import { AktualisiereRollenVorlageDto } from './dto/aktualisiere-rollen-vorlage.dto';

/** Reihenfolge der System-Rollen (hoechste zuerst) */
const ROLLEN_HIERARCHIE: Role[] = [
  Role.SUPERADMIN,
  Role.ADMIN,
  Role.TRAINER,
  Role.MEMBER,
  Role.PARENT,
];

/** Standard-Rollenvorlagen fuer neue Vereine */
const STANDARD_ROLLEN_VORLAGEN = [
  {
    name: 'Vorstand',
    beschreibung: 'Vereinsvorstand mit vollen Verwaltungsrechten',
    systemRolle: Role.ADMIN,
    berechtigungen: [
      'MITGLIEDER', 'TEAMS', 'KALENDER', 'TURNIERE', 'NACHRICHTEN',
      'BUCHHALTUNG', 'FORMULARE', 'DOKUMENTE', 'EINSTELLUNGEN',
      'FAHRGEMEINSCHAFTEN', 'HALLENBELEGUNG', 'SCHIEDSRICHTER',
      'SPONSOREN', 'WORKFLOWS', 'HOMEPAGE',
    ],
    farbe: '#1a56db',
    sortierung: 1,
  },
  {
    name: 'Trainer',
    beschreibung: 'Trainer mit Zugriff auf Teams, Kalender und Formulare',
    systemRolle: Role.TRAINER,
    berechtigungen: [
      'MITGLIEDER', 'TEAMS', 'KALENDER', 'TURNIERE', 'NACHRICHTEN',
      'FORMULARE', 'HALLENBELEGUNG', 'SCHIEDSRICHTER', 'FAHRGEMEINSCHAFTEN',
    ],
    farbe: '#16a34a',
    sortierung: 2,
  },
  {
    name: 'Kassenprufer',
    beschreibung: 'Zugriff auf Buchhaltung und Finanzdokumente',
    systemRolle: Role.ADMIN,
    berechtigungen: ['BUCHHALTUNG', 'DOKUMENTE'],
    farbe: '#ea580c',
    sortierung: 3,
  },
  {
    name: 'Innendienst',
    beschreibung: 'Verwaltungsaufgaben wie Mitglieder, Dokumente und Formulare',
    systemRolle: Role.TRAINER,
    berechtigungen: [
      'MITGLIEDER', 'FORMULARE', 'DOKUMENTE', 'NACHRICHTEN', 'KALENDER',
    ],
    farbe: '#7c3aed',
    sortierung: 4,
  },
  {
    name: 'Ehrenamt',
    beschreibung: 'Ehrenamtliche Helfer mit eingeschraenktem Zugriff',
    systemRolle: Role.MEMBER,
    berechtigungen: ['KALENDER', 'NACHRICHTEN', 'DOKUMENTE', 'FAHRGEMEINSCHAFTEN'],
    farbe: '#0891b2',
    sortierung: 5,
  },
  {
    name: 'Spieler',
    beschreibung: 'Vereinsmitglied / Spieler',
    systemRolle: Role.MEMBER,
    berechtigungen: ['KALENDER', 'NACHRICHTEN', 'TEAMS', 'TURNIERE', 'FAHRGEMEINSCHAFTEN'],
    farbe: '#64748b',
    sortierung: 6,
  },
  {
    name: 'Eltern',
    beschreibung: 'Elternteil eines Jugendmitglieds',
    systemRolle: Role.PARENT,
    berechtigungen: ['KALENDER', 'NACHRICHTEN', 'TEAMS'],
    farbe: '#db2777',
    sortierung: 7,
  },
];

@Injectable()
export class RollenVorlageService {
  constructor(private prisma: PrismaService) {}

  /** Alle Rollenvorlagen eines Vereins abrufen (sortiert nach Sortierung) */
  async alleVorlagen(tenantId: string) {
    return this.prisma.rollenVorlage.findMany({
      where: { tenantId },
      orderBy: { sortierung: 'asc' },
    });
  }

  /** Einzelne Rollenvorlage abrufen */
  async vorlageById(tenantId: string, id: string) {
    const vorlage = await this.prisma.rollenVorlage.findFirst({
      where: { id, tenantId },
    });

    if (!vorlage) {
      throw new NotFoundException('Rollenvorlage nicht gefunden.');
    }

    return vorlage;
  }

  /** Neue Rollenvorlage erstellen */
  async erstellen(tenantId: string, dto: ErstelleRollenVorlageDto) {
    return this.prisma.rollenVorlage.create({
      data: {
        tenantId,
        name: dto.name,
        beschreibung: dto.beschreibung,
        systemRolle: dto.systemRolle,
        berechtigungen: dto.berechtigungen,
        farbe: dto.farbe,
      },
    });
  }

  /** Rollenvorlage aktualisieren */
  async aktualisieren(tenantId: string, id: string, dto: AktualisiereRollenVorlageDto) {
    const vorlage = await this.prisma.rollenVorlage.findFirst({
      where: { id, tenantId },
    });

    if (!vorlage) {
      throw new NotFoundException('Rollenvorlage nicht gefunden.');
    }

    return this.prisma.rollenVorlage.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.systemRolle !== undefined && { systemRolle: dto.systemRolle }),
        ...(dto.berechtigungen !== undefined && { berechtigungen: dto.berechtigungen }),
        ...(dto.farbe !== undefined && { farbe: dto.farbe }),
      },
    });
  }

  /** Rollenvorlage loeschen (Standard-Vorlagen koennen nicht geloescht werden) */
  async loeschen(tenantId: string, id: string) {
    const vorlage = await this.prisma.rollenVorlage.findFirst({
      where: { id, tenantId },
    });

    if (!vorlage) {
      throw new NotFoundException('Rollenvorlage nicht gefunden.');
    }

    if (vorlage.istStandard) {
      throw new BadRequestException(
        'Standard-Rollenvorlagen koennen nicht geloescht werden.',
      );
    }

    return this.prisma.rollenVorlage.delete({ where: { id } });
  }

  /**
   * Berechtigungen aus Vereinsrollen berechnen.
   * Sucht die RollenVorlagen anhand der Namen, vereint alle Berechtigungen
   * und ermittelt die hoechste systemRolle.
   */
  async berechtigungenBerechnen(
    tenantId: string,
    vereinsRollen: string[],
  ): Promise<{ systemRolle: Role; berechtigungen: string[] }> {
    if (!vereinsRollen.length) {
      return { systemRolle: Role.MEMBER, berechtigungen: [] };
    }

    const vorlagen = await this.prisma.rollenVorlage.findMany({
      where: {
        tenantId,
        name: { in: vereinsRollen },
      },
    });

    // Alle Berechtigungen vereinen (deduplizieren)
    const alleBerechtigungen = new Set<string>();
    for (const vorlage of vorlagen) {
      for (const berechtigung of vorlage.berechtigungen) {
        alleBerechtigungen.add(berechtigung);
      }
    }

    // Hoechste systemRolle ermitteln (niedrigster Index in der Hierarchie gewinnt)
    let hoechsteRolle: Role = Role.MEMBER;
    for (const vorlage of vorlagen) {
      const aktuellerIndex = ROLLEN_HIERARCHIE.indexOf(vorlage.systemRolle);
      const hoechsterIndex = ROLLEN_HIERARCHIE.indexOf(hoechsteRolle);
      if (aktuellerIndex < hoechsterIndex) {
        hoechsteRolle = vorlage.systemRolle;
      }
    }

    return {
      systemRolle: hoechsteRolle,
      berechtigungen: [...alleBerechtigungen],
    };
  }

  /** Standard-Rollenvorlagen fuer einen neuen Verein erstellen */
  async standardVorlagenErstellen(tenantId: string) {
    for (const vorlage of STANDARD_ROLLEN_VORLAGEN) {
      await this.prisma.rollenVorlage.upsert({
        where: {
          tenantId_name: { tenantId, name: vorlage.name },
        },
        update: {
          berechtigungen: vorlage.berechtigungen,
          systemRolle: vorlage.systemRolle,
          beschreibung: vorlage.beschreibung,
        },
        create: {
          tenantId,
          ...vorlage,
          istStandard: true,
        },
      });
    }
  }
}
