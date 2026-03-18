import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MemberStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
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
        email: dto.email,
        birthDate: dto.geburtsdatum ? new Date(dto.geburtsdatum) : null,
        phone: dto.telefon,
        address: dto.adresse,
        sport: dto.sportarten || [],
        joinDate: dto.eintrittsdatum ? new Date(dto.eintrittsdatum) : new Date(),
        parentEmail: dto.elternEmail,
      },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.member.findMany({
      where: { tenantId },
      orderBy: { lastName: 'asc' },
      include: {
        teamMembers: {
          include: {
            team: {
              select: { id: true, name: true, sport: true, ageGroup: true },
            },
          },
        },
      },
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
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.geburtsdatum !== undefined && {
          birthDate: dto.geburtsdatum ? new Date(dto.geburtsdatum) : null,
        }),
        ...(dto.telefon !== undefined && { phone: dto.telefon }),
        ...(dto.adresse !== undefined && { address: dto.adresse }),
        ...(dto.sportarten !== undefined && { sport: dto.sportarten }),
        ...(dto.eintrittsdatum !== undefined && {
          joinDate: new Date(dto.eintrittsdatum),
        }),
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

  // ==================== Login-Erstellung bei Aktivierung ====================

  /**
   * Erstellt automatisch einen Login (User) fuer ein Mitglied,
   * wenn es aktiviert wird und eine E-Mail hat.
   * Gibt das temporaere Passwort zurueck (fuer Einladungs-E-Mail).
   */
  async loginErstellen(tenantId: string, memberId: string, rolle: Role = Role.MEMBER) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    if (mitglied.userId) {
      throw new ConflictException('Dieses Mitglied hat bereits einen Login.');
    }

    const loginEmail = mitglied.email || mitglied.parentEmail;
    if (!loginEmail) {
      throw new BadRequestException(
        'Mitglied hat keine E-Mail-Adresse. Bitte zuerst eine E-Mail hinterlegen.',
      );
    }

    // Pruefen ob E-Mail schon vergeben ist
    const bestehenderUser = await this.prisma.user.findUnique({
      where: { email: loginEmail },
    });

    if (bestehenderUser) {
      // Falls User im selben Tenant existiert, verknuepfen
      if (bestehenderUser.tenantId === tenantId) {
        await this.prisma.member.update({
          where: { id: memberId },
          data: { userId: bestehenderUser.id },
        });
        return { mitglied, user: bestehenderUser, temporaeresPasswort: null };
      }
      throw new ConflictException('Diese E-Mail-Adresse wird bereits in einem anderen Verein verwendet.');
    }

    // Temporaeres Passwort generieren
    const temporaeresPasswort = randomBytes(6).toString('hex');
    const passwortHash = await bcrypt.hash(temporaeresPasswort, 12);

    const neuerUser = await this.prisma.user.create({
      data: {
        email: loginEmail,
        passwordHash: passwortHash,
        role: rolle,
        tenantId,
      },
    });

    // Mitglied mit User verknuepfen
    await this.prisma.member.update({
      where: { id: memberId },
      data: { userId: neuerUser.id },
    });

    return {
      mitglied,
      user: neuerUser,
      temporaeresPasswort,
    };
  }

  // ==================== Status & Suche ====================

  async statusAendern(tenantId: string, id: string, neuerStatus: MemberStatus) {
    await this.nachIdAbrufen(tenantId, id);

    const aktualisiert = await this.prisma.member.update({
      where: { id },
      data: { status: neuerStatus },
    });

    // Bei Aktivierung automatisch Login erstellen (falls E-Mail vorhanden)
    if (neuerStatus === MemberStatus.ACTIVE && !aktualisiert.userId) {
      const loginEmail = aktualisiert.email || aktualisiert.parentEmail;
      if (loginEmail) {
        try {
          await this.loginErstellen(tenantId, id);
        } catch {
          // Login-Erstellung ist optional, Fehler nicht weiterwerfen
        }
      }
    }

    return aktualisiert;
  }

  async batchFreigeben(tenantId: string, ids: string[]) {
    const ergebnis = await this.prisma.member.updateMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      data: { status: MemberStatus.ACTIVE },
    });

    // Login fuer alle aktivierten Mitglieder mit E-Mail erstellen
    const mitglieder = await this.prisma.member.findMany({
      where: {
        id: { in: ids },
        tenantId,
        userId: null,
        OR: [
          { email: { not: null } },
          { parentEmail: { not: null } },
        ],
      },
    });

    for (const mitglied of mitglieder) {
      try {
        await this.loginErstellen(tenantId, mitglied.id);
      } catch {
        // Weiter mit dem naechsten
      }
    }

    return { aktualisiert: ergebnis.count };
  }

  async suchen(tenantId: string, suchbegriff: string, status?: string, sportart?: string) {
    return this.prisma.member.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: suchbegriff, mode: 'insensitive' } },
          { lastName: { contains: suchbegriff, mode: 'insensitive' } },
          { email: { contains: suchbegriff, mode: 'insensitive' } },
        ],
        ...(status && { status: status as MemberStatus }),
        ...(sportart && { sport: { has: sportart } }),
      },
      orderBy: { lastName: 'asc' },
      include: {
        teamMembers: {
          include: {
            team: {
              select: { id: true, name: true, sport: true, ageGroup: true },
            },
          },
        },
      },
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
      include: {
        teamMembers: {
          include: {
            team: {
              select: { id: true, name: true, sport: true, ageGroup: true, abteilungId: true },
            },
          },
        },
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
            abteilung: { select: { id: true, name: true, sport: true } },
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

  /** Abteilungen der Kinder eines Elternteils finden */
  async meineKinderAbteilungen(tenantId: string, elternEmail: string) {
    const teams = await this.meineKinderTeams(tenantId, elternEmail);
    const abteilungIds = [...new Set(
      teams.map((t) => t.abteilungId).filter((id): id is string => !!id),
    )];

    if (abteilungIds.length === 0) {
      return [];
    }

    return this.prisma.abteilung.findMany({
      where: {
        id: { in: abteilungIds },
        tenantId,
      },
      include: {
        teams: {
          select: { id: true, name: true, ageGroup: true },
        },
      },
    });
  }

  async statistik(tenantId: string) {
    const [gesamt, aktiv, ausstehend, sportarten] = await Promise.all([
      this.prisma.member.count({ where: { tenantId } }),
      this.prisma.member.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.member.count({
        where: { tenantId, status: 'PENDING' },
      }),
      this.prisma.member.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { sport: true },
      }),
    ]);

    // Sportarten zaehlen
    const sportartenCount: Record<string, number> = {};
    for (const m of sportarten) {
      for (const s of m.sport) {
        sportartenCount[s] = (sportartenCount[s] || 0) + 1;
      }
    }

    return { gesamt, aktiv, ausstehend, sportartenVerteilung: sportartenCount };
  }
}
