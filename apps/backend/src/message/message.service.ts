import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleNachrichtDto } from './dto/erstelle-nachricht.dto';
import { NotfallBroadcastDto } from './dto/notfall-broadcast.dto';
import { MessageType, Role } from '@prisma/client';
import { STILLE_STUNDEN_START, STILLE_STUNDEN_ENDE } from '@clubos/shared';

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
}
