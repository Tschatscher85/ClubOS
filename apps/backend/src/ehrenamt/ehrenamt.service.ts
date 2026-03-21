import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { AufgabenStatus, MeldungStatus } from '@prisma/client';

// ==================== DTOs ====================

export interface ErstelleAufgabeDto {
  titel: string;
  beschreibung?: string;
  datum?: string;
  frist?: string;
  maxHelfer?: number;
  teamId?: string;
}

export interface AktualisiereAufgabeDto {
  titel?: string;
  beschreibung?: string;
  datum?: string | null;
  frist?: string | null;
  maxHelfer?: number | null;
  teamId?: string | null;
}

export interface StatusAendernDto {
  status: AufgabenStatus;
}

export interface StundenErfassenDto {
  datum: string;
  stunden: number;
  beschreibung?: string;
}

// ==================== Service ====================

@Injectable()
export class EhrenamtService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  // ==================== Aufgaben ====================

  /** Neue Helfer-Aufgabe erstellen und Team/Verein benachrichtigen. */
  async aufgabeErstellen(
    tenantId: string,
    userId: string,
    dto: ErstelleAufgabeDto,
  ) {
    const aufgabe = await this.prisma.ehrenamtAufgabe.create({
      data: {
        tenantId,
        erstelltVon: userId,
        titel: dto.titel,
        beschreibung: dto.beschreibung || null,
        datum: dto.datum ? new Date(dto.datum) : null,
        frist: dto.frist ? new Date(dto.frist) : null,
        maxHelfer: dto.maxHelfer ?? null,
        teamId: dto.teamId || null,
      },
      include: {
        team: { select: { id: true, name: true } },
        meldungen: true,
      },
    });

    // Push-Benachrichtigung an Team-Mitglieder oder alle Vereinsmitglieder
    try {
      let userIds: string[] = [];

      if (dto.teamId) {
        const teamMitglieder = await this.prisma.teamMember.findMany({
          where: { teamId: dto.teamId },
          include: { member: { select: { userId: true } } },
        });
        userIds = teamMitglieder
          .map((tm) => tm.member.userId)
          .filter((id): id is string => id !== null && id !== userId);
      } else {
        const mitglieder = await this.prisma.member.findMany({
          where: { tenantId, status: 'ACTIVE' },
          select: { userId: true },
        });
        userIds = mitglieder
          .map((m) => m.userId)
          .filter((id): id is string => id !== null && id !== userId);
      }

      for (const empfaengerId of userIds) {
        await this.queueService.pushBenachrichtigungSenden({
          empfaengerId,
          titel: 'Helfer gesucht!',
          nachricht: `Neue Aufgabe: ${dto.titel}`,
        });
      }
    } catch {
      // Push-Fehler sollen das Erstellen nicht verhindern
    }

    return aufgabe;
  }

  /** Alle Aufgaben eines Vereins auflisten. */
  async aufgabenAuflisten(tenantId: string) {
    return this.prisma.ehrenamtAufgabe.findMany({
      where: { tenantId },
      include: {
        team: { select: { id: true, name: true } },
        meldungen: {
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /** Aufgabe mit allen Meldungen abrufen. */
  async aufgabeDetail(tenantId: string, aufgabeId: string) {
    const aufgabe = await this.prisma.ehrenamtAufgabe.findFirst({
      where: { id: aufgabeId, tenantId },
      include: {
        team: { select: { id: true, name: true } },
        meldungen: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userId: true,
              },
            },
          },
          orderBy: { erstelltAm: 'asc' },
        },
      },
    });

    if (!aufgabe) {
      throw new NotFoundException('Aufgabe nicht gefunden.');
    }

    return aufgabe;
  }

  /** Aufgabe aktualisieren (nur Ersteller oder ADMIN). */
  async aufgabeAktualisieren(
    tenantId: string,
    aufgabeId: string,
    userId: string,
    rolle: string,
    dto: AktualisiereAufgabeDto,
  ) {
    const aufgabe = await this.prisma.ehrenamtAufgabe.findFirst({
      where: { id: aufgabeId, tenantId },
    });

    if (!aufgabe) {
      throw new NotFoundException('Aufgabe nicht gefunden.');
    }

    if (
      aufgabe.erstelltVon !== userId &&
      !['SUPERADMIN', 'ADMIN'].includes(rolle)
    ) {
      throw new ForbiddenException('Keine Berechtigung zum Bearbeiten.');
    }

    return this.prisma.ehrenamtAufgabe.update({
      where: { id: aufgabeId },
      data: {
        ...(dto.titel !== undefined && { titel: dto.titel }),
        ...(dto.beschreibung !== undefined && {
          beschreibung: dto.beschreibung || null,
        }),
        ...(dto.datum !== undefined && {
          datum: dto.datum ? new Date(dto.datum) : null,
        }),
        ...(dto.frist !== undefined && {
          frist: dto.frist ? new Date(dto.frist) : null,
        }),
        ...(dto.maxHelfer !== undefined && { maxHelfer: dto.maxHelfer }),
        ...(dto.teamId !== undefined && { teamId: dto.teamId || null }),
      },
      include: {
        team: { select: { id: true, name: true } },
        meldungen: {
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  /** Aufgabe loeschen. */
  async aufgabeLoeschen(
    tenantId: string,
    aufgabeId: string,
    userId: string,
    rolle: string,
  ) {
    const aufgabe = await this.prisma.ehrenamtAufgabe.findFirst({
      where: { id: aufgabeId, tenantId },
    });

    if (!aufgabe) {
      throw new NotFoundException('Aufgabe nicht gefunden.');
    }

    if (
      aufgabe.erstelltVon !== userId &&
      !['SUPERADMIN', 'ADMIN'].includes(rolle)
    ) {
      throw new ForbiddenException('Keine Berechtigung zum Loeschen.');
    }

    return this.prisma.ehrenamtAufgabe.delete({ where: { id: aufgabeId } });
  }

  /** Aufgaben-Status aendern (BESETZT/ABGESCHLOSSEN/ABGESAGT). */
  async statusAendern(
    tenantId: string,
    aufgabeId: string,
    userId: string,
    rolle: string,
    dto: StatusAendernDto,
  ) {
    const aufgabe = await this.prisma.ehrenamtAufgabe.findFirst({
      where: { id: aufgabeId, tenantId },
    });

    if (!aufgabe) {
      throw new NotFoundException('Aufgabe nicht gefunden.');
    }

    if (
      aufgabe.erstelltVon !== userId &&
      !['SUPERADMIN', 'ADMIN'].includes(rolle)
    ) {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    return this.prisma.ehrenamtAufgabe.update({
      where: { id: aufgabeId },
      data: { status: dto.status },
      include: {
        team: { select: { id: true, name: true } },
        meldungen: {
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  // ==================== Meldungen ====================

  /** Als Helfer fuer eine Aufgabe anmelden. */
  async melden(tenantId: string, aufgabeId: string, userId: string) {
    const aufgabe = await this.prisma.ehrenamtAufgabe.findFirst({
      where: { id: aufgabeId, tenantId },
      include: { meldungen: true },
    });

    if (!aufgabe) {
      throw new NotFoundException('Aufgabe nicht gefunden.');
    }

    if (aufgabe.status !== 'OFFEN') {
      throw new BadRequestException(
        'Fuer diese Aufgabe kann man sich nicht mehr anmelden.',
      );
    }

    // Frist pruefen
    if (aufgabe.frist && new Date() > aufgabe.frist) {
      throw new BadRequestException('Die Anmeldefrist ist abgelaufen.');
    }

    // Mitglied des Users finden
    const member = await this.prisma.member.findFirst({
      where: { userId, tenantId },
    });

    if (!member) {
      throw new BadRequestException(
        'Kein Mitgliedsprofil gefunden. Bitte lege zuerst ein Profil an.',
      );
    }

    // Pruefen ob bereits angemeldet
    const bestehend = await this.prisma.ehrenamtMeldung.findUnique({
      where: {
        aufgabeId_mitgliedId: {
          aufgabeId,
          mitgliedId: member.id,
        },
      },
    });

    if (bestehend) {
      throw new BadRequestException('Du bist bereits fuer diese Aufgabe angemeldet.');
    }

    // Pruefen ob maxHelfer erreicht
    if (aufgabe.maxHelfer !== null) {
      const aktuelleAnzahl = aufgabe.meldungen.filter(
        (m) => m.status !== 'ABGELEHNT',
      ).length;
      if (aktuelleAnzahl >= aufgabe.maxHelfer) {
        throw new BadRequestException(
          'Die maximale Helferanzahl ist bereits erreicht.',
        );
      }
    }

    const meldung = await this.prisma.ehrenamtMeldung.create({
      data: {
        aufgabeId,
        mitgliedId: member.id,
      },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Auto-Status BESETZT wenn maxHelfer erreicht
    if (aufgabe.maxHelfer !== null) {
      const neueAnzahl = aufgabe.meldungen.filter(
        (m) => m.status !== 'ABGELEHNT',
      ).length + 1;
      if (neueAnzahl >= aufgabe.maxHelfer) {
        await this.prisma.ehrenamtAufgabe.update({
          where: { id: aufgabeId },
          data: { status: 'BESETZT' },
        });
      }
    }

    // Ersteller benachrichtigen
    try {
      await this.queueService.pushBenachrichtigungSenden({
        empfaengerId: aufgabe.erstelltVon,
        titel: 'Neuer Helfer!',
        nachricht: `${member.firstName} ${member.lastName} hat sich fuer "${aufgabe.titel}" gemeldet.`,
      });
    } catch {
      // Push-Fehler ignorieren
    }

    return meldung;
  }

  /** Meldung zurueckziehen. */
  async meldungZurueckziehen(
    tenantId: string,
    aufgabeId: string,
    userId: string,
  ) {
    const aufgabe = await this.prisma.ehrenamtAufgabe.findFirst({
      where: { id: aufgabeId, tenantId },
    });

    if (!aufgabe) {
      throw new NotFoundException('Aufgabe nicht gefunden.');
    }

    const member = await this.prisma.member.findFirst({
      where: { userId, tenantId },
    });

    if (!member) {
      throw new BadRequestException('Kein Mitgliedsprofil gefunden.');
    }

    const meldung = await this.prisma.ehrenamtMeldung.findUnique({
      where: {
        aufgabeId_mitgliedId: {
          aufgabeId,
          mitgliedId: member.id,
        },
      },
    });

    if (!meldung) {
      throw new NotFoundException('Keine Anmeldung gefunden.');
    }

    await this.prisma.ehrenamtMeldung.delete({
      where: { id: meldung.id },
    });

    // Wenn Aufgabe BESETZT war und jetzt Platz frei ist → zurueck auf OFFEN
    if (aufgabe.status === 'BESETZT' && aufgabe.maxHelfer !== null) {
      const verbleibend = await this.prisma.ehrenamtMeldung.count({
        where: { aufgabeId, status: { not: 'ABGELEHNT' } },
      });
      if (verbleibend < aufgabe.maxHelfer) {
        await this.prisma.ehrenamtAufgabe.update({
          where: { id: aufgabeId },
          data: { status: 'OFFEN' },
        });
      }
    }

    return { nachricht: 'Anmeldung zurueckgezogen.' };
  }

  /** Helfer-Meldung bestaetigen (TRAINER/ADMIN). */
  async meldungBestaetigen(
    tenantId: string,
    meldungId: string,
    userId: string,
    rolle: string,
  ) {
    const meldung = await this.prisma.ehrenamtMeldung.findFirst({
      where: { id: meldungId },
      include: {
        aufgabe: true,
        member: {
          select: { id: true, firstName: true, lastName: true, userId: true },
        },
      },
    });

    if (!meldung || meldung.aufgabe.tenantId !== tenantId) {
      throw new NotFoundException('Meldung nicht gefunden.');
    }

    if (
      meldung.aufgabe.erstelltVon !== userId &&
      !['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(rolle)
    ) {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    const aktualisiert = await this.prisma.ehrenamtMeldung.update({
      where: { id: meldungId },
      data: { status: 'BESTAETIGT' },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, userId: true },
        },
      },
    });

    // Helfer benachrichtigen
    if (meldung.member.userId) {
      try {
        await this.queueService.pushBenachrichtigungSenden({
          empfaengerId: meldung.member.userId,
          titel: 'Meldung bestaetigt!',
          nachricht: `Deine Meldung fuer "${meldung.aufgabe.titel}" wurde bestaetigt.`,
        });
      } catch {
        // Push-Fehler ignorieren
      }
    }

    return aktualisiert;
  }

  /** Helfer-Meldung ablehnen (TRAINER/ADMIN). */
  async meldungAblehnen(
    tenantId: string,
    meldungId: string,
    userId: string,
    rolle: string,
  ) {
    const meldung = await this.prisma.ehrenamtMeldung.findFirst({
      where: { id: meldungId },
      include: {
        aufgabe: true,
        member: {
          select: { id: true, firstName: true, lastName: true, userId: true },
        },
      },
    });

    if (!meldung || meldung.aufgabe.tenantId !== tenantId) {
      throw new NotFoundException('Meldung nicht gefunden.');
    }

    if (
      meldung.aufgabe.erstelltVon !== userId &&
      !['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(rolle)
    ) {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    const aktualisiert = await this.prisma.ehrenamtMeldung.update({
      where: { id: meldungId },
      data: { status: 'ABGELEHNT' },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, userId: true },
        },
      },
    });

    // Helfer benachrichtigen
    if (meldung.member.userId) {
      try {
        await this.queueService.pushBenachrichtigungSenden({
          empfaengerId: meldung.member.userId,
          titel: 'Meldung abgelehnt',
          nachricht: `Deine Meldung fuer "${meldung.aufgabe.titel}" wurde leider abgelehnt.`,
        });
      } catch {
        // Push-Fehler ignorieren
      }
    }

    return aktualisiert;
  }

  // ==================== Uebungsleiter-Stunden ====================

  /** Stunden fuer Uebungsleiterpauschale erfassen. */
  async stundenErfassen(
    tenantId: string,
    userId: string,
    dto: StundenErfassenDto,
  ) {
    if (dto.stunden <= 0 || dto.stunden > 24) {
      throw new BadRequestException(
        'Stunden muessen zwischen 0 und 24 liegen.',
      );
    }

    return this.prisma.uebungsleiterStunden.create({
      data: {
        tenantId,
        userId,
        datum: new Date(dto.datum),
        stunden: dto.stunden,
        beschreibung: dto.beschreibung || null,
      },
    });
  }

  /** Eigene Stunden abrufen (aktuelles Jahr). */
  async meineStunden(tenantId: string, userId: string, jahr?: number) {
    const aktuellesJahr = jahr || new Date().getFullYear();
    const von = new Date(aktuellesJahr, 0, 1);
    const bis = new Date(aktuellesJahr + 1, 0, 1);

    const stunden = await this.prisma.uebungsleiterStunden.findMany({
      where: {
        tenantId,
        userId,
        datum: { gte: von, lt: bis },
      },
      orderBy: { datum: 'desc' },
    });

    const jahresSumme = stunden.reduce((sum, s) => sum + s.stunden, 0);
    // Schaetzung: 20 EUR/Stunde als Standardsatz
    const geschaetzterBetrag = jahresSumme * 20;

    return {
      stunden,
      jahresSumme,
      geschaetzterBetrag,
      warnung: geschaetzterBetrag >= 2800,
      jahr: aktuellesJahr,
    };
  }

  /** Uebersicht aller Trainer-Stunden (ADMIN). */
  async stundenUebersicht(tenantId: string, jahr?: number) {
    const aktuellesJahr = jahr || new Date().getFullYear();
    const von = new Date(aktuellesJahr, 0, 1);
    const bis = new Date(aktuellesJahr + 1, 0, 1);

    const stunden = await this.prisma.uebungsleiterStunden.findMany({
      where: {
        tenantId,
        datum: { gte: von, lt: bis },
      },
    });

    // Nach User gruppieren
    const proTrainer: Record<
      string,
      { userId: string; summeStunden: number }
    > = {};

    for (const s of stunden) {
      if (!proTrainer[s.userId]) {
        proTrainer[s.userId] = { userId: s.userId, summeStunden: 0 };
      }
      proTrainer[s.userId].summeStunden += s.stunden;
    }

    // User-Infos laden
    const userIds = Object.keys(proTrainer);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, tenantId },
      select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const ergebnis = Object.values(proTrainer).map((t) => {
      const user = userMap.get(t.userId);
      const geschaetzterBetrag = t.summeStunden * 20;
      return {
        userId: t.userId,
        email: user?.email || 'Unbekannt',
        vorname: user?.profile?.firstName || '',
        nachname: user?.profile?.lastName || '',
        summeStunden: t.summeStunden,
        geschaetzterBetrag,
        warnung: geschaetzterBetrag >= 2800,
        kritisch: geschaetzterBetrag >= 3300,
      };
    });

    return {
      jahr: aktuellesJahr,
      trainer: ergebnis.sort((a, b) => b.summeStunden - a.summeStunden),
    };
  }

  /** Jahressumme pro Trainer mit 3300 EUR Warnung. */
  async jahresUebersicht(tenantId: string, jahr?: number) {
    return this.stundenUebersicht(tenantId, jahr);
  }
}
