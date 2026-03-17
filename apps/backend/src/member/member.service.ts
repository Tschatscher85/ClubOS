import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
