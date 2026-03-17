import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleUserDto, AktualisiereUserDto } from './dto/erstelle-user.dto';
import { BCRYPT_ROUNDS } from '@clubos/shared';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async erstellen(tenantId: string, dto: ErstelleUserDto) {
    const existierend = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existierend) {
      throw new ConflictException(
        'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.',
      );
    }

    const passwortHash = await bcrypt.hash(dto.passwort, BCRYPT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: passwortHash,
        role: dto.rolle,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const benutzer = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    return benutzer;
  }

  async aktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereUserDto,
  ) {
    await this.nachIdAbrufen(tenantId, id);

    if (dto.email) {
      const existierend = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existierend) {
        throw new ConflictException(
          'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.rolle && { role: dto.rolle }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });
  }

  async passwortZuruecksetzen(tenantId: string, id: string, neuesPasswort: string) {
    await this.nachIdAbrufen(tenantId, id);
    const passwortHash = await bcrypt.hash(neuesPasswort, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: passwortHash },
    });
    return { nachricht: 'Passwort erfolgreich zurueckgesetzt.' };
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
