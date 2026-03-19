import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleNachrichtDto } from './dto/erstelle-nachricht.dto';
import { NotfallBroadcastDto } from './dto/notfall-broadcast.dto';
import { ReaktionDto } from './dto/reaktion.dto';
import { AktualisiereBenachrichtigungsEinstellungDto } from './dto/benachrichtigungs-einstellung.dto';
import { MessageType, Role, ReaktionTyp } from '@prisma/client';
import { STILLE_STUNDEN_START, STILLE_STUNDEN_ENDE } from '@vereinbase/shared';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(private prisma: PrismaService) {}

  async senden(tenantId: string, senderId: string, senderRolle: string, dto: ErstelleNachrichtDto) {
    // Eltern duerfen keine freien Nachrichten senden
    if (senderRolle === Role.PARENT && dto.typ !== MessageType.QUESTION) {
      throw new ForbiddenException(
        'Eltern koennen nur strukturierte Fragen senden.',
      );
    }

    // Announcements nur fuer Admin
    if (dto.typ === MessageType.ANNOUNCEMENT && senderRolle !== Role.ADMIN && senderRolle !== Role.SUPERADMIN) {
      throw new ForbiddenException(
        'Nur Admins koennen Ankuendigungen versenden.',
      );
    }

    return this.prisma.message.create({
      data: {
        tenantId,
        senderId,
        content: dto.inhalt,
        type: dto.typ,
        teamId: dto.teamId || null,
        silentFrom: STILLE_STUNDEN_START,
        silentTo: STILLE_STUNDEN_ENDE,
      },
      include: {
        team: { select: { id: true, name: true } },
      },
    });
  }

  async alleAbrufen(tenantId: string, teamId?: string) {
    return this.prisma.message.findMany({
      where: {
        tenantId,
        ...(teamId && { teamId }),
      },
      include: {
        team: { select: { id: true, name: true } },
        reads: { select: { userId: true, readAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const nachricht = await this.prisma.message.findFirst({
      where: { id, tenantId },
      include: {
        team: { select: { id: true, name: true } },
        reads: { select: { userId: true, readAt: true } },
      },
    });

    if (!nachricht) {
      throw new NotFoundException('Nachricht nicht gefunden.');
    }

    return nachricht;
  }

  async alsGelesenMarkieren(nachrichtId: string, userId: string) {
    // Upsert: nur einmal pro User/Nachricht
    return this.prisma.messageRead.upsert({
      where: {
        messageId_userId: { messageId: nachrichtId, userId },
      },
      create: {
        messageId: nachrichtId,
        userId,
      },
      update: {},
    });
  }

  async ungeleseneAnzahl(tenantId: string, userId: string) {
    const gesamt = await this.prisma.message.count({
      where: { tenantId },
    });

    const gelesen = await this.prisma.messageRead.count({
      where: {
        userId,
        message: { tenantId },
      },
    });

    return { ungelesen: gesamt - gelesen };
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);
    return this.prisma.message.delete({ where: { id } });
  }

  /**
   * Notfall-Broadcast senden.
   * Ignoriert Stille-Stunden und sendet an alle Mitglieder mit E-Mail-Adresse.
   * Nur fuer ADMIN und TRAINER.
   */
  async notfallBroadcastSenden(
    tenantId: string,
    senderId: string,
    dto: NotfallBroadcastDto,
  ) {
    // Nachricht ohne Stille-Stunden erstellen
    const nachricht = await this.prisma.message.create({
      data: {
        tenantId,
        senderId,
        content: dto.inhalt,
        type: MessageType.ANNOUNCEMENT,
        silentFrom: null, // Stille-Stunden werden ignoriert
        silentTo: null,
      },
    });

    // Alle Mitglieder mit E-Mail-Adresse laden
    const mitglieder = await this.prisma.member.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        email: { not: null },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // E-Mails versenden (hier wird nur geloggt - E-Mail-Service kann spaeter integriert werden)
    let emailsGesendet = 0;
    for (const mitglied of mitglieder) {
      if (mitglied.email) {
        // TODO: E-Mail-Service (z.B. Brevo) einbinden
        this.logger.warn(
          `NOTFALL-BROADCAST an ${mitglied.firstName} ${mitglied.lastName} (${mitglied.email}): ${dto.inhalt}`,
        );
        emailsGesendet++;
      }
    }

    this.logger.warn(
      `Notfall-Broadcast gesendet von ${senderId}: ${emailsGesendet} E-Mails versendet.`,
    );

    return {
      nachricht,
      emailsGesendet,
      empfaenger: mitglieder.length,
    };
  }

  // ==================== Reaktionen ====================

  /**
   * Reaktion auf eine Nachricht setzen oder aktualisieren (Upsert).
   * Pro Benutzer ist nur eine Reaktion pro Nachricht erlaubt.
   */
  async reaktionSetzen(nachrichtId: string, userId: string, dto: ReaktionDto) {
    // Pruefen ob Nachricht existiert
    const nachricht = await this.prisma.message.findUnique({
      where: { id: nachrichtId },
    });

    if (!nachricht) {
      throw new NotFoundException('Nachricht nicht gefunden.');
    }

    return this.prisma.messageReaction.upsert({
      where: {
        messageId_userId: { messageId: nachrichtId, userId },
      },
      create: {
        messageId: nachrichtId,
        userId,
        reaktion: dto.reaktion,
      },
      update: {
        reaktion: dto.reaktion,
      },
    });
  }

  /**
   * Reaktionen-Zusammenfassung fuer eine Nachricht abrufen.
   * Liefert Gesamtzahl, Aufschluesselung nach Typ und Details.
   */
  async reaktionenAbrufen(nachrichtId: string) {
    const nachricht = await this.prisma.message.findUnique({
      where: { id: nachrichtId },
    });

    if (!nachricht) {
      throw new NotFoundException('Nachricht nicht gefunden.');
    }

    const reaktionen = await this.prisma.messageReaction.findMany({
      where: { messageId: nachrichtId },
      orderBy: { createdAt: 'desc' },
    });

    const zusammenfassung = {
      gesamt: reaktionen.length,
      ja: reaktionen.filter((r) => r.reaktion === ReaktionTyp.JA).length,
      nein: reaktionen.filter((r) => r.reaktion === ReaktionTyp.NEIN).length,
      vielleicht: reaktionen.filter((r) => r.reaktion === ReaktionTyp.VIELLEICHT).length,
      gesehen: reaktionen.filter((r) => r.reaktion === ReaktionTyp.GESEHEN).length,
      details: reaktionen.map((r) => ({
        userId: r.userId,
        reaktion: r.reaktion,
        erstelltAm: r.createdAt,
      })),
    };

    return zusammenfassung;
  }

  // ==================== Benachrichtigungs-Einstellungen ====================

  /**
   * Benachrichtigungs-Einstellungen des Benutzers abrufen.
   * Erstellt Standard-Einstellungen wenn noch keine vorhanden.
   */
  async benachrichtigungenAbrufen(userId: string) {
    let einstellungen = await this.prisma.benachrichtigungsEinstellung.findUnique({
      where: { userId },
    });

    if (!einstellungen) {
      // Standard-Einstellungen erstellen
      einstellungen = await this.prisma.benachrichtigungsEinstellung.create({
        data: { userId },
      });
    }

    return einstellungen;
  }

  /**
   * Benachrichtigungs-Einstellungen des Benutzers aktualisieren.
   */
  async benachrichtigungenAktualisieren(
    userId: string,
    dto: AktualisiereBenachrichtigungsEinstellungDto,
  ) {
    return this.prisma.benachrichtigungsEinstellung.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
      },
      update: dto,
    });
  }

  // ==================== Stille-Stunden Pruefung ====================

  /**
   * Prueft ob aktuell Stille-Stunden gelten.
   * Beruecksichtigt Ueberlauf ueber Mitternacht (z.B. 22-7 Uhr).
   */
  istStilleZeit(von: number, bis: number): boolean {
    const stunde = new Date().getHours();
    if (von > bis) {
      // Ueber Mitternacht (z.B. 22:00 bis 07:00)
      return stunde >= von || stunde < bis;
    }
    return stunde >= von && stunde < bis;
  }

  /**
   * Prueft ob eine Benachrichtigung gesendet werden darf.
   * Beruecksichtigt Stille-Stunden und Notfall-Ueberschreibung.
   */
  async darfBenachrichtigenSenden(userId: string, istNotfall: boolean): Promise<boolean> {
    const einstellungen = await this.benachrichtigungenAbrufen(userId);

    // Notfall ueberschreibt Stille-Stunden wenn aktiviert
    if (istNotfall && einstellungen.notfallUeberschreiben) {
      return true;
    }

    // Pruefen ob Stille-Stunden aktiv sind
    if (this.istStilleZeit(einstellungen.stilleStundenVon, einstellungen.stilleStundenBis)) {
      this.logger.debug(
        `Benachrichtigung fuer Benutzer ${userId} zurueckgehalten (Stille Stunden: ${einstellungen.stilleStundenVon}-${einstellungen.stilleStundenBis} Uhr).`,
      );
      return false;
    }

    return true;
  }
}
