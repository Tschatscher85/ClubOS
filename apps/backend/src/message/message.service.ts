import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleNachrichtDto } from './dto/erstelle-nachricht.dto';
import { MessageType, Role } from '@prisma/client';
import { STILLE_STUNDEN_START, STILLE_STUNDEN_ENDE } from '@clubos/shared';

@Injectable()
export class MessageService {
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
}
