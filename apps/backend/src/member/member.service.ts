import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleMitgliedDto,
  AktualisiereMitgliedDto,
} from './dto/erstelle-mitglied.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async erstellen(tenantId: string, dto: ErstelleMitgliedDto) {
    // Mitgliedsnummer generieren
    const anzahl = await this.prisma.member.count({ where: { tenantId } });
    const mitgliedsnummer = `M-${String(anzahl + 1).padStart(4, '0')}`;

    return this.prisma.member.create({
      data: {
        tenantId,
        memberNumber: mitgliedsnummer,
        firstName: dto.vorname,
        lastName: dto.nachname,
        birthDate: dto.geburtsdatum ? new Date(dto.geburtsdatum) : null,
        phone: dto.telefon,
        address: dto.adresse,
        sport: dto.sportarten || [],
        parentEmail: dto.elternEmail,
      },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.member.findMany({
      where: { tenantId },
      orderBy: { lastName: 'asc' },
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id, tenantId },
      include: {
        teamMembers: {
          include: {
            team: {
              select: { id: true, name: true, sport: true, ageGroup: true },
            },
          },
        },
        user: { select: { id: true, email: true, role: true } },
      },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    return mitglied;
  }

  async aktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereMitgliedDto,
  ) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.member.update({
      where: { id },
      data: {
        ...(dto.vorname !== undefined && { firstName: dto.vorname }),
        ...(dto.nachname !== undefined && { lastName: dto.nachname }),
        ...(dto.geburtsdatum !== undefined && {
          birthDate: dto.geburtsdatum ? new Date(dto.geburtsdatum) : null,
        }),
        ...(dto.telefon !== undefined && { phone: dto.telefon }),
        ...(dto.adresse !== undefined && { address: dto.adresse }),
        ...(dto.sportarten !== undefined && { sport: dto.sportarten }),
        ...(dto.elternEmail !== undefined && { parentEmail: dto.elternEmail }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.member.delete({
      where: { id },
    });
  }

  // ==================== Mitglied-User-Verknuepfung ====================

  async mitBenutzerVerknuepfen(tenantId: string, memberId: string, userId: string) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    const benutzer = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    if (mitglied.userId) {
      throw new ConflictException('Dieses Mitglied ist bereits mit einem Benutzer verknuepft.');
    }

    const bereitsVerknuepft = await this.prisma.member.findFirst({
      where: { userId, tenantId },
    });
    if (bereitsVerknuepft) {
      throw new ConflictException('Dieser Benutzer ist bereits mit einem anderen Mitglied verknuepft.');
    }

    return this.prisma.member.update({
      where: { id: memberId },
      data: { userId },
    });
  }

  async verknuepfungAufheben(tenantId: string, memberId: string) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    if (!mitglied.userId) {
      throw new BadRequestException('Dieses Mitglied ist mit keinem Benutzer verknuepft.');
    }

    return this.prisma.member.update({
      where: { id: memberId },
      data: { userId: null },
    });
  }

  // ==================== Status & Suche ====================

  async statusAendern(tenantId: string, id: string, neuerStatus: MemberStatus) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.member.update({
      where: { id },
      data: { status: neuerStatus },
    });
  }

  async batchFreigeben(tenantId: string, ids: string[]) {
    const ergebnis = await this.prisma.member.updateMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      data: { status: MemberStatus.ACTIVE },
    });

    return { aktualisiert: ergebnis.count };
  }

  async suchen(tenantId: string, suchbegriff: string, status?: string, sportart?: string) {
    return this.prisma.member.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: suchbegriff, mode: 'insensitive' } },
          { lastName: { contains: suchbegriff, mode: 'insensitive' } },
        ],
        ...(status && { status: status as MemberStatus }),
        ...(sportart && { sport: { has: sportart } }),
      },
      orderBy: { lastName: 'asc' },
    });
  }

  // ==================== Eltern-Portal ====================

  /** Alle Kinder eines Elternteils anhand der E-Mail-Adresse finden */
  async meineKinder(tenantId: string, elternEmail: string) {
    return this.prisma.member.findMany({
      where: {
        tenantId,
        parentEmail: elternEmail,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  /** Teams der Kinder eines Elternteils finden */
  async meineKinderTeams(tenantId: string, elternEmail: string) {
    const kinder = await this.prisma.member.findMany({
      where: {
        tenantId,
        parentEmail: elternEmail,
      },
      select: { id: true },
    });

    if (kinder.length === 0) {
      return [];
    }

    const kinderIds = kinder.map((k) => k.id);

    const teamMitgliedschaften = await this.prisma.teamMember.findMany({
      where: {
        memberId: { in: kinderIds },
      },
      include: {
        team: {
          include: {
            _count: { select: { events: true, teamMembers: true } },
          },
        },
      },
    });

    // Einzigartige Teams zurueckgeben
    const teamsMap = new Map<string, (typeof teamMitgliedschaften)[number]['team']>();
    for (const tm of teamMitgliedschaften) {
      if (tm.team.tenantId === tenantId) {
        teamsMap.set(tm.team.id, tm.team);
      }
    }

    return Array.from(teamsMap.values());
  }

  async statistik(tenantId: string) {
    const [gesamt, aktiv, ausstehend] = await Promise.all([
      this.prisma.member.count({ where: { tenantId } }),
      this.prisma.member.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.member.count({
        where: { tenantId, status: 'PENDING' },
      }),
    ]);

    return { gesamt, aktiv, ausstehend };
  }
}
