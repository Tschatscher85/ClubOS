import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class WartelisteService {
  private readonly logger = new Logger(WartelisteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Mitglied auf die Warteliste eines Teams setzen.
   * Prueft vorher ob das Team voll ist (maxKader).
   */
  async aufWartelisteSetzen(teamId: string, mitgliedId: string, tenantId: string) {
    // Team laden
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
      include: { _count: { select: { teamMembers: true } } },
    });

    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    // Pruefen ob Mitglied zum Verein gehoert
    const mitglied = await this.prisma.member.findFirst({
      where: { id: mitgliedId, tenantId },
    });
    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    // Pruefen ob bereits im Team
    const bereitsImTeam = await this.prisma.teamMember.findUnique({
      where: { teamId_memberId: { teamId, memberId: mitgliedId } },
    });
    if (bereitsImTeam) {
      throw new ConflictException('Mitglied ist bereits im Team.');
    }

    // Pruefen ob bereits auf der Warteliste
    const bereitsAufWarteliste = await this.prisma.warteliste.findUnique({
      where: { teamId_mitgliedId: { teamId, mitgliedId } },
    });
    if (bereitsAufWarteliste) {
      throw new ConflictException('Mitglied steht bereits auf der Warteliste.');
    }

    // Wenn Team nicht voll ist, direkt zum Team hinzufuegen
    if (team.maxKader === null || team._count.teamMembers < team.maxKader) {
      throw new BadRequestException(
        'Das Team ist nicht voll. Mitglied kann direkt hinzugefuegt werden.',
      );
    }

    // Auf Warteliste setzen
    return this.prisma.warteliste.create({
      data: {
        teamId,
        mitgliedId,
        tenantId,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });
  }

  /**
   * Warteliste eines Teams abrufen, sortiert nach Anmeldedatum.
   */
  async wartelisteAbrufen(teamId: string, tenantId: string) {
    // Team pruefen
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });
    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    return this.prisma.warteliste.findMany({
      where: { teamId, tenantId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { angemeldetAm: 'asc' },
    });
  }

  /**
   * Eintrag von der Warteliste entfernen.
   */
  async entfernen(id: string, tenantId: string) {
    const eintrag = await this.prisma.warteliste.findFirst({
      where: { id, tenantId },
    });
    if (!eintrag) {
      throw new NotFoundException('Wartelisten-Eintrag nicht gefunden.');
    }

    return this.prisma.warteliste.delete({ where: { id } });
  }

  /**
   * Einladung bestaetigen: Mitglied wird ins Team aufgenommen.
   */
  async bestaetigen(id: string, userId: string) {
    const eintrag = await this.prisma.warteliste.findFirst({
      where: { id },
      include: { team: true, member: true },
    });

    if (!eintrag) {
      throw new NotFoundException('Wartelisten-Eintrag nicht gefunden.');
    }

    if (eintrag.status !== 'EINGELADEN') {
      throw new BadRequestException(
        'Nur eingeladene Eintraege koennen bestaetigt werden.',
      );
    }

    // Frist pruefen
    if (eintrag.bestaetigtBis && new Date() > eintrag.bestaetigtBis) {
      throw new BadRequestException(
        'Die Einladungsfrist ist abgelaufen.',
      );
    }

    // Pruefen ob der User das Mitglied ist (oder Admin/Trainer)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new ForbiddenException('Benutzer nicht gefunden.');
    }

    const istAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'TRAINER';
    const istMitglied = user.profile?.id === eintrag.mitgliedId;

    if (!istAdmin && !istMitglied) {
      throw new ForbiddenException(
        'Nur das eingeladene Mitglied oder ein Admin/Trainer kann bestaetigen.',
      );
    }

    // In einer Transaktion: TeamMember erstellen + Warteliste aktualisieren
    const [teamMember] = await this.prisma.$transaction([
      this.prisma.teamMember.create({
        data: {
          teamId: eintrag.teamId,
          memberId: eintrag.mitgliedId,
          rolle: 'SPIELER',
        },
        include: { member: true },
      }),
      this.prisma.warteliste.update({
        where: { id },
        data: { status: 'BESTAETIGT' },
      }),
    ]);

    this.logger.log(
      `Mitglied ${eintrag.mitgliedId} hat Wartelisten-Einladung fuer Team ${eintrag.teamId} bestaetigt.`,
    );

    return teamMember;
  }

  /**
   * Naechsten Wartenden einladen.
   * Setzt den Status auf EINGELADEN, sendet Push + E-Mail, setzt 48h Frist.
   */
  async naechstenEinladen(teamId: string) {
    const naechster = await this.prisma.warteliste.findFirst({
      where: { teamId, status: 'WARTEND' },
      orderBy: { angemeldetAm: 'asc' },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userId: true,
          },
        },
        team: {
          select: { name: true, tenantId: true },
        },
      },
    });

    if (!naechster) {
      this.logger.log(`Keine wartenden Eintraege fuer Team ${teamId}.`);
      return null;
    }

    const bestaetigtBis = new Date(Date.now() + 48 * 60 * 60 * 1000); // +48h

    const aktualisiert = await this.prisma.warteliste.update({
      where: { id: naechster.id },
      data: {
        status: 'EINGELADEN',
        benachrichtigtAm: new Date(),
        bestaetigtBis,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userId: true,
          },
        },
      },
    });

    // Push-Benachrichtigung senden
    if (naechster.member.userId) {
      try {
        await this.queueService.pushBenachrichtigungSenden({
          empfaengerId: naechster.member.userId,
          titel: 'Platz frei im Team!',
          nachricht: `Ein Platz im Team "${naechster.team.name}" ist frei geworden. Du hast 48 Stunden zum Bestaetigen.`,
          daten: { teamId, wartelisteId: naechster.id },
        });
      } catch (err) {
        this.logger.warn(`Push-Benachrichtigung fehlgeschlagen: ${err}`);
      }
    }

    // E-Mail senden
    if (naechster.member.email) {
      try {
        // Tenant laden fuer Vereinsname
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: naechster.team.tenantId },
          select: { name: true },
        });

        await this.queueService.einladungEmailSenden({
          email: naechster.member.email,
          vorname: naechster.member.firstName,
          vereinsname: tenant?.name || 'Verein',
          link: `/teams/${teamId}`,
        });
      } catch (err) {
        this.logger.warn(`E-Mail-Benachrichtigung fehlgeschlagen: ${err}`);
      }
    }

    this.logger.log(
      `Mitglied ${naechster.member.firstName} ${naechster.member.lastName} fuer Team ${teamId} eingeladen (Frist: ${bestaetigtBis.toISOString()}).`,
    );

    return aktualisiert;
  }

  /**
   * Abgelaufene Einladungen verarbeiten.
   * Wird per BullMQ-CronJob stuendlich aufgerufen.
   */
  async abgelaufeneVerarbeiten() {
    const jetzt = new Date();

    // Alle abgelaufenen EINGELADEN-Eintraege finden
    const abgelaufene = await this.prisma.warteliste.findMany({
      where: {
        status: 'EINGELADEN',
        bestaetigtBis: { lt: jetzt },
      },
      select: { id: true, teamId: true },
    });

    if (abgelaufene.length === 0) {
      this.logger.log('Keine abgelaufenen Wartelisten-Einladungen.');
      return;
    }

    this.logger.log(`${abgelaufene.length} abgelaufene Einladung(en) gefunden.`);

    // Status auf ABGELAUFEN setzen
    await this.prisma.warteliste.updateMany({
      where: {
        id: { in: abgelaufene.map((e) => e.id) },
      },
      data: { status: 'ABGELAUFEN' },
    });

    // Fuer jedes betroffene Team den naechsten einladen
    const betroffeneTeams = [...new Set(abgelaufene.map((e) => e.teamId))];
    for (const teamId of betroffeneTeams) {
      try {
        await this.naechstenEinladen(teamId);
      } catch (err) {
        this.logger.warn(`Fehler beim Einladen des Naechsten fuer Team ${teamId}: ${err}`);
      }
    }
  }

  /**
   * Wird aufgerufen wenn ein Mitglied aus dem Team entfernt wird.
   * Prueft ob Wartelisten-Eintraege vorhanden sind und laedt den naechsten ein.
   */
  async nachMitgliedEntfernung(teamId: string) {
    const wartelisteAnzahl = await this.prisma.warteliste.count({
      where: { teamId, status: 'WARTEND' },
    });

    if (wartelisteAnzahl > 0) {
      this.logger.log(
        `Team ${teamId}: Mitglied entfernt, ${wartelisteAnzahl} auf Warteliste. Lade naechsten ein.`,
      );
      await this.naechstenEinladen(teamId);
    }
  }
}
