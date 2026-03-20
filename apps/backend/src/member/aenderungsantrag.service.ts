import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AenderungsStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

/** Erlaubte Felder fuer Aenderungsantraege */
const ERLAUBTE_FELDER = [
  'phone',
  'address',
  'iban',
  'notfallKontakt',
  'notfallTelefon',
] as const;

type ErlaubtesFeld = (typeof ERLAUBTE_FELDER)[number];

const FELD_LABEL: Record<string, string> = {
  phone: 'Telefon',
  address: 'Adresse',
  iban: 'IBAN',
  notfallKontakt: 'Notfallkontakt',
  notfallTelefon: 'Notfall-Telefon',
};

@Injectable()
export class AenderungsantragService {
  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  /**
   * Eigenes Mitgliedsprofil abrufen (fuer eingeloggten Benutzer)
   */
  async meinProfilAbrufen(userId: string, tenantId: string) {
    const mitglied = await this.prisma.member.findFirst({
      where: { userId, tenantId },
      include: {
        aenderungsantraege: {
          where: { status: AenderungsStatus.PENDING },
          orderBy: { erstelltAm: 'desc' },
        },
      },
    });

    if (!mitglied) {
      throw new NotFoundException(
        'Kein Mitgliedsprofil gefunden. Bitte wenden Sie sich an den Vorstand.',
      );
    }

    return mitglied;
  }

  /**
   * Neuen Aenderungsantrag erstellen
   */
  async antragErstellen(
    userId: string,
    tenantId: string,
    feld: string,
    neuerWert: string,
  ) {
    // Feld validieren
    if (!ERLAUBTE_FELDER.includes(feld as ErlaubtesFeld)) {
      throw new BadRequestException(
        `Ungültiges Feld: ${feld}. Erlaubt sind: ${ERLAUBTE_FELDER.join(', ')}`,
      );
    }

    // Mitglied des Benutzers finden
    const mitglied = await this.prisma.member.findFirst({
      where: { userId, tenantId },
    });

    if (!mitglied) {
      throw new NotFoundException(
        'Kein Mitgliedsprofil gefunden. Bitte wenden Sie sich an den Vorstand.',
      );
    }

    // Pruefen ob bereits ein offener Antrag fuer dieses Feld existiert
    const offenerAntrag = await this.prisma.memberAenderungsantrag.findFirst({
      where: {
        memberId: mitglied.id,
        feld,
        status: AenderungsStatus.PENDING,
      },
    });

    if (offenerAntrag) {
      throw new BadRequestException(
        `Es gibt bereits einen offenen Änderungsantrag für das Feld "${FELD_LABEL[feld] || feld}".`,
      );
    }

    // Aktuellen Wert auslesen
    const alterWert = (mitglied as Record<string, unknown>)[feld] as string | null;

    return this.prisma.memberAenderungsantrag.create({
      data: {
        tenantId,
        memberId: mitglied.id,
        feld,
        alterWert: alterWert || null,
        neuerWert,
      },
    });
  }

  /**
   * Alle offenen Antraege des Tenants abrufen (fuer Admin)
   */
  async alleOffenenAbrufen(tenantId: string) {
    return this.prisma.memberAenderungsantrag.findMany({
      where: {
        tenantId,
        status: AenderungsStatus.PENDING,
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
      orderBy: { erstelltAm: 'asc' },
    });
  }

  /**
   * Antrag genehmigen — Feld am Mitglied aktualisieren
   */
  async genehmigen(id: string, tenantId: string, adminUserId: string) {
    const antrag = await this.prisma.memberAenderungsantrag.findFirst({
      where: { id, tenantId },
      include: { member: true },
    });

    if (!antrag) {
      throw new NotFoundException('Änderungsantrag nicht gefunden.');
    }

    if (antrag.status !== AenderungsStatus.PENDING) {
      throw new BadRequestException('Dieser Antrag wurde bereits bearbeitet.');
    }

    // Feld am Mitglied aktualisieren
    await this.prisma.member.update({
      where: { id: antrag.memberId },
      data: { [antrag.feld]: antrag.neuerWert },
    });

    // Antrag als genehmigt markieren
    const aktualisiert = await this.prisma.memberAenderungsantrag.update({
      where: { id },
      data: {
        status: AenderungsStatus.GENEHMIGT,
        bearbeitetAm: new Date(),
        bearbeitetVon: adminUserId,
      },
    });

    // Push-Benachrichtigung an das Mitglied
    if (antrag.member.userId) {
      await this.pushService.sendePush(antrag.member.userId, {
        title: 'Änderung genehmigt',
        body: `Ihre Änderung am Feld "${FELD_LABEL[antrag.feld] || antrag.feld}" wurde genehmigt.`,
        url: '/mein-profil',
      });
    }

    return aktualisiert;
  }

  /**
   * Antrag ablehnen
   */
  async ablehnen(id: string, tenantId: string, adminUserId: string) {
    const antrag = await this.prisma.memberAenderungsantrag.findFirst({
      where: { id, tenantId },
      include: { member: true },
    });

    if (!antrag) {
      throw new NotFoundException('Änderungsantrag nicht gefunden.');
    }

    if (antrag.status !== AenderungsStatus.PENDING) {
      throw new BadRequestException('Dieser Antrag wurde bereits bearbeitet.');
    }

    const aktualisiert = await this.prisma.memberAenderungsantrag.update({
      where: { id },
      data: {
        status: AenderungsStatus.ABGELEHNT,
        bearbeitetAm: new Date(),
        bearbeitetVon: adminUserId,
      },
    });

    // Push-Benachrichtigung an das Mitglied
    if (antrag.member.userId) {
      await this.pushService.sendePush(antrag.member.userId, {
        title: 'Änderung abgelehnt',
        body: `Ihre Änderung am Feld "${FELD_LABEL[antrag.feld] || antrag.feld}" wurde leider abgelehnt.`,
        url: '/mein-profil',
      });
    }

    return aktualisiert;
  }
}
