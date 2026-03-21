import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MemberStatus, Role, Ermaessigung, NachweisStatus } from '@prisma/client';
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
        fotoErlaubnis: dto.fotoErlaubnis ?? false,
        fotoErlaubnisAm: dto.fotoErlaubnis ? new Date() : null,
        fahrgemeinschaftErlaubnis: dto.fahrgemeinschaftErlaubnis ?? false,
        fahrgemeinschaftErlaubnisAm: dto.fahrgemeinschaftErlaubnis ? new Date() : null,
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
        ...(dto.beitragsklasseId !== undefined && { beitragsklasseId: dto.beitragsklasseId }),
        ...(dto.beitragBetrag !== undefined && { beitragBetrag: dto.beitragBetrag }),
        ...(dto.beitragIntervall !== undefined && { beitragIntervall: dto.beitragIntervall }),
        ...(dto.fotoErlaubnis !== undefined && {
          fotoErlaubnis: dto.fotoErlaubnis,
          fotoErlaubnisAm: dto.fotoErlaubnis ? new Date() : null,
        }),
        ...(dto.fahrgemeinschaftErlaubnis !== undefined && {
          fahrgemeinschaftErlaubnis: dto.fahrgemeinschaftErlaubnis,
          fahrgemeinschaftErlaubnisAm: dto.fahrgemeinschaftErlaubnis ? new Date() : null,
        }),
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

  /** Alle Kinder eines Elternteils finden - BEVORZUGT Familie-Verknuepfung, Fallback: parentEmail */
  async meineKinder(tenantId: string, elternEmail: string, userId?: string) {
    // 1. Zuerst via Familie-Verknuepfung suchen (wenn userId vorhanden)
    if (userId) {
      const familienKinder = await this.kinderAusFamilie(tenantId, userId);
      if (familienKinder.length > 0) {
        return familienKinder;
      }
    }

    // 2. Fallback: Alte parentEmail-Logik
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

  /** Kinder via Familie-Verknuepfung finden */
  private async kinderAusFamilie(tenantId: string, userId: string) {
    // Finde Familie(n) wo der User Elternteil ist
    const familienMitgliedschaften = await this.prisma.familieMitglied.findMany({
      where: {
        userId,
        rolle: { in: ['MUTTER', 'VATER', 'ERZIEHUNGSBERECHTIGTER', 'PARTNER'] },
      },
      select: { familieId: true },
    });

    if (familienMitgliedschaften.length === 0) {
      return [];
    }

    const familieIds = familienMitgliedschaften.map((fm) => fm.familieId);

    // Finde alle Kinder in diesen Familien
    const kinderMitgliedschaften = await this.prisma.familieMitglied.findMany({
      where: {
        familieId: { in: familieIds },
        rolle: 'KIND',
        memberId: { not: null },
      },
      select: { memberId: true },
    });

    const kinderIds = kinderMitgliedschaften
      .map((k) => k.memberId)
      .filter((id): id is string => !!id);

    if (kinderIds.length === 0) {
      return [];
    }

    return this.prisma.member.findMany({
      where: {
        id: { in: kinderIds },
        tenantId,
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

  // ==================== Team-Zuordnung ====================

  /** Team-Zuordnungen eines Mitglieds abrufen */
  async teamsAbrufen(tenantId: string, memberId: string) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!mitglied) throw new NotFoundException('Mitglied nicht gefunden.');

    return this.prisma.teamMember.findMany({
      where: { memberId },
      include: {
        team: {
          select: { id: true, name: true, ageGroup: true, abteilungId: true },
        },
      },
    });
  }

  /** Team-Zuordnungen eines Mitglieds synchronisieren (alte loeschen, neue erstellen) */
  async teamsSetzen(tenantId: string, memberId: string, teamZuordnungen: Array<{ teamId: string; rolle?: string }> | string[]) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!mitglied) throw new NotFoundException('Mitglied nicht gefunden.');

    // Normalisieren: string[] oder {teamId, rolle}[]
    const zuordnungen: Array<{ teamId: string; rolle: string }> = (teamZuordnungen as Array<unknown>).map((z) => {
      if (typeof z === 'string') return { teamId: z, rolle: 'SPIELER' };
      const obj = z as { teamId?: string; rolle?: string };
      return { teamId: obj.teamId || '', rolle: obj.rolle || 'SPIELER' };
    }).filter((z) => z.teamId);

    const teamIds = zuordnungen.map((z) => z.teamId);

    // Pruefen ob alle Teams zum Verein gehoeren
    const teams = await this.prisma.team.findMany({
      where: { id: { in: teamIds }, tenantId },
    });
    const gueltigeTeamIds = new Set(teams.map((t) => t.id));
    const gueltigeZuordnungen = zuordnungen.filter((z) => gueltigeTeamIds.has(z.teamId));

    // Bestehende Zuordnungen abrufen
    const bestehende = await this.prisma.teamMember.findMany({
      where: { memberId },
      select: { teamId: true, rolle: true },
    });
    const bestehendMap = new Map(bestehende.map((b) => [b.teamId, b.rolle]));

    // Neue Zuordnungen (noch nicht vorhanden)
    const zuErstellen = gueltigeZuordnungen.filter((z) => !bestehendMap.has(z.teamId));

    // Rollen-Updates (bestehende Zuordnung, aber Rolle hat sich geaendert)
    const zuAktualisieren = gueltigeZuordnungen.filter(
      (z) => bestehendMap.has(z.teamId) && bestehendMap.get(z.teamId) !== z.rolle,
    );

    // Alte Zuordnungen (nicht mehr gewuenscht)
    const gewuenschteIds = new Set(gueltigeZuordnungen.map((z) => z.teamId));
    const zuLoeschen = Array.from(bestehendMap.keys()).filter(
      (id) => !gewuenschteIds.has(id),
    );

    // Transaktional ausfuehren
    await this.prisma.$transaction([
      ...(zuLoeschen.length > 0
        ? [this.prisma.teamMember.deleteMany({ where: { memberId, teamId: { in: zuLoeschen } } })]
        : []),
      ...zuErstellen.map((z) =>
        this.prisma.teamMember.create({ data: { teamId: z.teamId, memberId, rolle: z.rolle } }),
      ),
      ...zuAktualisieren.map((z) =>
        this.prisma.teamMember.updateMany({
          where: { memberId, teamId: z.teamId },
          data: { rolle: z.rolle },
        }),
      ),
    ]);

    return { nachricht: 'Team-Zuordnungen aktualisiert.', teams: gueltigeZuordnungen.length };
  }

  // ==================== Formular-Einreichungen ====================

  /** Formular-Einreichungen eines Mitglieds abrufen (ueber E-Mail) */
  async formulareAbrufen(tenantId: string, memberId: string) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!mitglied) throw new NotFoundException('Mitglied nicht gefunden.');

    if (!mitglied.email) return [];

    return this.prisma.formSubmission.findMany({
      where: { tenantId, email: mitglied.email },
      include: {
        template: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== DSGVO-Export (Art. 15 + Art. 20) ====================

  /**
   * Exportiert alle personenbezogenen Daten eines Mitglieds (DSGVO Art. 15 + Art. 20).
   * Sammelt Daten aus allen relevanten Tabellen und gibt sie als strukturiertes JSON zurueck.
   */
  async dsgvoExport(tenantId: string, mitgliedId: string) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: mitgliedId, tenantId },
      include: {
        user: true,
      },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    // Alle Daten parallel abfragen fuer bessere Performance
    const [
      anwesenheiten,
      teamMitgliedschaften,
      kasseBuchungen,
      trikotVergaben,
      verletzungen,
      entwicklungsboegen,
      formularEinreichungen,
      nachrichten,
      fahrgemeinschaften,
      mitfahrten,
    ] = await Promise.all([
      // Anwesenheiten
      this.prisma.attendance.findMany({
        where: { memberId: mitgliedId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              type: true,
              date: true,
              location: true,
            },
          },
        },
        orderBy: { event: { date: 'desc' } },
      }),

      // Team-Zugehoerigkeiten
      this.prisma.teamMember.findMany({
        where: { memberId: mitgliedId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              sport: true,
              ageGroup: true,
            },
          },
        },
      }),

      // Kasse-Buchungen
      this.prisma.kasseBuchung.findMany({
        where: { memberId: mitgliedId },
        orderBy: { erstelltAm: 'desc' },
      }),

      // Trikot-Vergaben
      this.prisma.trikotVergabe.findMany({
        where: { memberId: mitgliedId },
        include: {
          trikot: {
            select: {
              nummer: true,
              groesse: true,
              farbe: true,
            },
          },
        },
        orderBy: { vergabenAm: 'desc' },
      }),

      // Verletzungen
      this.prisma.verletzung.findMany({
        where: { memberId: mitgliedId, tenantId },
        orderBy: { datum: 'desc' },
      }),

      // Entwicklungsboegen
      this.prisma.entwicklungsbogen.findMany({
        where: { memberId: mitgliedId, tenantId },
        orderBy: { datum: 'desc' },
      }),

      // Formular-Einreichungen (ueber E-Mail)
      mitglied.email
        ? this.prisma.formSubmission.findMany({
            where: { tenantId, email: mitglied.email },
            include: {
              template: { select: { name: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // Nachrichten (gesendet vom verknuepften User)
      mitglied.userId
        ? this.prisma.message.findMany({
            where: { tenantId, senderId: mitglied.userId },
            select: {
              id: true,
              content: true,
              type: true,
              createdAt: true,
              teamId: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // Fahrgemeinschaften (als Fahrer)
      mitglied.userId
        ? this.prisma.fahrgemeinschaft.findMany({
            where: { tenantId, fahrerId: mitglied.userId },
            include: {
              mitfahrer: { select: { userId: true, createdAt: true } },
            },
            orderBy: { abfahrt: 'desc' },
          })
        : Promise.resolve([]),

      // Mitfahrten (als Mitfahrer)
      mitglied.userId
        ? this.prisma.mitfahrer.findMany({
            where: { userId: mitglied.userId },
            include: {
              fahrgemeinschaft: {
                select: {
                  id: true,
                  startort: true,
                  zielort: true,
                  abfahrt: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // Strukturiertes Export-Objekt zusammenbauen
    const exportDaten = {
      _meta: {
        exportDatum: new Date().toISOString(),
        rechtsgrundlage: 'DSGVO Art. 15 (Auskunftsrecht) + Art. 20 (Datenportabilitaet)',
        format: 'JSON',
        hinweis:
          'Dieser Export enthaelt alle personenbezogenen Daten, die zu diesem Mitglied gespeichert sind.',
      },
      stammdaten: {
        id: mitglied.id,
        mitgliedsnummer: mitglied.memberNumber,
        vorname: mitglied.firstName,
        nachname: mitglied.lastName,
        email: mitglied.email,
        geburtsdatum: mitglied.birthDate,
        telefon: mitglied.phone,
        adresse: mitglied.address,
        beitrittsdatum: mitglied.joinDate,
        austrittsdatum: mitglied.exitDate,
        status: mitglied.status,
        sportarten: mitglied.sport,
        elternEmail: mitglied.parentEmail,
        unterschriftUrl: mitglied.signatureUrl,
        qrCode: mitglied.qrCode,
        erstelltAm: mitglied.createdAt,
        aktualisiertAm: mitglied.updatedAt,
      },
      beitragsdaten: {
        beitragsArt: mitglied.beitragsArt,
        beitragBetrag: mitglied.beitragBetrag,
        beitragIntervall: mitglied.beitragIntervall,
        ermaessigung: mitglied.ermaessigung,
        ermaessigungProzent: mitglied.ermaessigungProzent,
        ermaessigungBis: mitglied.ermaessigungBis,
        nachweisStatus: mitglied.nachweisStatus,
      },
      loginDaten: mitglied.user
        ? {
            id: mitglied.user.id,
            email: mitglied.user.email,
            rolle: mitglied.user.role,
            emailVerifiziert: mitglied.user.emailVerifiziert,
            vereinsRollen: mitglied.user.vereinsRollen,
            berechtigungen: mitglied.user.berechtigungen,
            istAktiv: mitglied.user.istAktiv,
            letzterLogin: mitglied.user.letzterLogin,
            erstelltAm: mitglied.user.createdAt,
            // passwordHash wird bewusst NICHT exportiert
          }
        : null,
      anwesenheiten: anwesenheiten.map((a) => ({
        id: a.id,
        veranstaltung: a.event
          ? {
              id: a.event.id,
              titel: a.event.title,
              typ: a.event.type,
              datum: a.event.date,
              ort: a.event.location,
            }
          : null,
        status: a.status,
        grund: a.reason,
        beantwortetAm: a.answeredAt,
      })),
      teamZugehoerigkeiten: teamMitgliedschaften.map((tm) => ({
        id: tm.id,
        rolle: tm.rolle,
        beigetretenAm: tm.createdAt,
        team: {
          id: tm.team.id,
          name: tm.team.name,
          sportart: tm.team.sport,
          altersklasse: tm.team.ageGroup,
        },
      })),
      kasseBuchungen: kasseBuchungen.map((kb) => ({
        id: kb.id,
        betrag: kb.betrag,
        grund: kb.grund,
        typ: kb.typ,
        erstelltAm: kb.erstelltAm,
      })),
      trikotVergaben: trikotVergaben.map((tv) => ({
        id: tv.id,
        trikot: {
          nummer: tv.trikot.nummer,
          groesse: tv.trikot.groesse,
          farbe: tv.trikot.farbe,
        },
        vergabenAm: tv.vergabenAm,
        zurueckAm: tv.zurueckAm,
        notiz: tv.notiz,
      })),
      verletzungen: verletzungen.map((v) => ({
        id: v.id,
        art: v.art,
        koerperteil: v.koerperteil,
        datum: v.datum,
        pauseVorausTage: v.pauseVoraus,
        zurueckAm: v.zurueckAm,
        notiz: v.notiz,
        status: v.status,
        erstelltAm: v.erstelltAm,
      })),
      entwicklungsboegen: entwicklungsboegen.map((eb) => ({
        id: eb.id,
        datum: eb.datum,
        saison: eb.saison,
        bewertungen: {
          ball: eb.ball,
          passen: eb.passen,
          schuss: eb.schuss,
          zweikampf: eb.zweikampf,
          kopfball: eb.kopfball,
          spielverstaendnis: eb.spielverstaendnis,
          positionsspiel: eb.positionsspiel,
          defensivverhalten: eb.defensivverhalten,
          schnelligkeit: eb.schnelligkeit,
          ausdauer: eb.ausdauer,
          sprungkraft: eb.sprungkraft,
          teamgeist: eb.teamgeist,
          einstellung: eb.einstellung,
          coaching: eb.coaching,
        },
        staerken: eb.staerken,
        entwicklungsfelder: eb.entwicklungsfelder,
        ziele: eb.ziele,
        trainerEmpfehlung: eb.trainerEmpfehlung,
      })),
      formularEinreichungen: formularEinreichungen.map((fe) => ({
        id: fe.id,
        formular: fe.template
          ? { name: fe.template.name, typ: fe.template.type }
          : null,
        email: fe.email,
        daten: fe.daten,
        status: fe.status,
        kommentar: fe.kommentar,
        erstelltAm: fe.createdAt,
      })),
      nachrichten: nachrichten.map((n) => ({
        id: n.id,
        inhalt: n.content,
        typ: n.type,
        teamId: n.teamId,
        erstelltAm: n.createdAt,
      })),
      fahrgemeinschaften: fahrgemeinschaften.map((fg) => ({
        id: fg.id,
        startort: fg.startort,
        zielort: fg.zielort,
        abfahrt: fg.abfahrt,
        plaetze: fg.plaetze,
        kommentar: fg.kommentar,
        anzahlMitfahrer: fg.mitfahrer.length,
        erstelltAm: fg.createdAt,
      })),
      mitfahrten: mitfahrten.map((mf) => ({
        id: mf.id,
        fahrgemeinschaft: mf.fahrgemeinschaft
          ? {
              id: mf.fahrgemeinschaft.id,
              startort: mf.fahrgemeinschaft.startort,
              zielort: mf.fahrgemeinschaft.zielort,
              abfahrt: mf.fahrgemeinschaft.abfahrt,
            }
          : null,
        beigetretenAm: mf.createdAt,
      })),
    };

    return exportDaten;
  }

  // ==================== CSV Import/Export ====================

  /**
   * Importiert Mitglieder aus einer allgemeinen CSV-Datei.
   * Erkennt automatisch Semikolon- oder Komma-Trennung.
   * Erkennt Duplikate anhand von E-Mail ODER Vorname+Nachname+Geburtsdatum.
   */
  async csvImportieren(
    tenantId: string,
    csvContent: string,
  ): Promise<{ importiert: number; uebersprungen: number; fehler: string[] }> {
    const ergebnis = {
      importiert: 0,
      uebersprungen: 0,
      fehler: [] as string[],
    };

    // BOM entfernen falls vorhanden
    const bereinigterInhalt = csvContent.replace(/^\uFEFF/, '');

    const zeilen = bereinigterInhalt.split(/\r?\n/).filter((z) => z.trim());

    if (zeilen.length < 2) {
      ergebnis.fehler.push(
        'CSV-Datei enthaelt keine Daten (mindestens Kopfzeile und eine Datenzeile erforderlich).',
      );
      return ergebnis;
    }

    // Trennzeichen automatisch erkennen (Semikolon oder Komma)
    const trennzeichen = zeilen[0].includes(';') ? ';' : ',';

    // Kopfzeile parsen
    const kopfzeile = this.csvZeileParsen(zeilen[0], trennzeichen);

    // Pflichtfelder pruefen
    const pflichtfelder = ['Vorname', 'Nachname'];
    for (const feld of pflichtfelder) {
      if (!kopfzeile.map((s) => s.trim()).includes(feld)) {
        ergebnis.fehler.push(
          `Pflichtfeld "${feld}" fehlt in der CSV-Kopfzeile.`,
        );
      }
    }
    if (ergebnis.fehler.length > 0) {
      return ergebnis;
    }

    // Bestehende Mitglieder laden fuer Duplikat-Erkennung
    const bestehendeMembers = await this.prisma.member.findMany({
      where: { tenantId },
      select: { firstName: true, lastName: true, birthDate: true, email: true },
    });

    const duplikatSetName = new Set(
      bestehendeMembers.map((m) =>
        `${(m.firstName || '').toLowerCase().trim()}|${(m.lastName || '').toLowerCase().trim()}|${m.birthDate ? m.birthDate.toISOString().split('T')[0] : 'kein-datum'}`,
      ),
    );

    const duplikatSetEmail = new Set(
      bestehendeMembers
        .filter((m) => m.email)
        .map((m) => m.email!.toLowerCase().trim()),
    );

    // Aktuelle Anzahl fuer Mitgliedsnummern-Generierung
    let laufendeNummer =
      (await this.prisma.member.count({ where: { tenantId } })) + 1;

    // Datenzeilen verarbeiten
    for (let i = 1; i < zeilen.length; i++) {
      try {
        const werte = this.csvZeileParsen(zeilen[i], trennzeichen);
        const zeileObj = this.csvWerteZuObjekt(kopfzeile, werte);

        const vorname = (zeileObj['Vorname'] || '').trim();
        const nachname = (zeileObj['Nachname'] || '').trim();

        if (!vorname || !nachname) {
          ergebnis.fehler.push(
            `Zeile ${i + 1}: Vorname oder Nachname fehlt.`,
          );
          continue;
        }

        const email = (zeileObj['E-Mail'] || '').trim() || null;
        const geburtsdatum = this.deutschesDatumParsen(zeileObj['Geburtsdatum']);

        // Duplikat-Pruefung: E-Mail ODER Vorname+Nachname+Geburtsdatum
        if (email && duplikatSetEmail.has(email.toLowerCase())) {
          ergebnis.uebersprungen++;
          continue;
        }

        const nameSchluessel = `${vorname.toLowerCase()}|${nachname.toLowerCase()}|${geburtsdatum ? geburtsdatum.toISOString().split('T')[0] : 'kein-datum'}`;
        if (duplikatSetName.has(nameSchluessel)) {
          ergebnis.uebersprungen++;
          continue;
        }

        // Sportart mappen
        const sportartRaw = (zeileObj['Sportart'] || '').trim();
        const sport: string[] = sportartRaw
          ? sportartRaw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
          : [];

        // Mitgliedsnummer
        const mitgliedsnummer =
          (zeileObj['Mitgliedsnummer'] || '').trim() ||
          `M-${String(laufendeNummer).padStart(4, '0')}`;

        await this.prisma.member.create({
          data: {
            tenantId,
            memberNumber: mitgliedsnummer,
            firstName: vorname,
            lastName: nachname,
            email,
            birthDate: geburtsdatum,
            phone: (zeileObj['Telefon'] || '').trim() || null,
            address: (zeileObj['Adresse'] || '').trim() || null,
            sport,
            joinDate: new Date(),
            parentEmail: (zeileObj['Eltern-E-Mail'] || '').trim() || null,
          },
        });

        // Duplikat-Sets aktualisieren
        if (email) duplikatSetEmail.add(email.toLowerCase());
        duplikatSetName.add(nameSchluessel);
        laufendeNummer++;
        ergebnis.importiert++;
      } catch (fehler) {
        const meldung =
          fehler instanceof Error ? fehler.message : String(fehler);
        ergebnis.fehler.push(`Zeile ${i + 1}: ${meldung}`);
      }
    }

    return ergebnis;
  }

  /**
   * Exportiert alle Mitglieder des Tenants als CSV-Datei.
   * Semikolon-getrennt mit BOM fuer Excel-Kompatibilitaet.
   */
  async csvExportieren(tenantId: string): Promise<string> {
    const mitglieder = await this.prisma.member.findMany({
      where: { tenantId },
      orderBy: { lastName: 'asc' },
    });

    const bom = '\uFEFF';

    const spalten = [
      'Mitgliedsnummer',
      'Vorname',
      'Nachname',
      'E-Mail',
      'Geburtsdatum',
      'Telefon',
      'Adresse',
      'Sportart',
      'Status',
      'Beitrittsdatum',
      'Eltern-E-Mail',
    ];

    const kopfzeile = spalten.join(';');

    const datenzeilen = mitglieder.map((m) => {
      const werte = [
        this.csvWertEscapen(m.memberNumber || ''),
        this.csvWertEscapen(m.firstName || ''),
        this.csvWertEscapen(m.lastName || ''),
        this.csvWertEscapen(m.email || ''),
        this.datumFormatieren(m.birthDate),
        this.csvWertEscapen(m.phone || ''),
        this.csvWertEscapen(m.address || ''),
        this.csvWertEscapen(m.sport.join(', ')),
        this.csvWertEscapen(m.status || ''),
        this.datumFormatieren(m.joinDate),
        this.csvWertEscapen(m.parentEmail || ''),
      ];
      return werte.join(';');
    });

    return bom + [kopfzeile, ...datenzeilen].join('\r\n');
  }

  // ==================== CSV-Hilfsfunktionen ====================

  private csvZeileParsen(zeile: string, trennzeichen: string): string[] {
    const ergebnis: string[] = [];
    let aktuellerWert = '';
    let inAnfuehrungszeichen = false;

    for (let i = 0; i < zeile.length; i++) {
      const zeichen = zeile[i];

      if (zeichen === '"') {
        if (inAnfuehrungszeichen && zeile[i + 1] === '"') {
          aktuellerWert += '"';
          i++;
        } else {
          inAnfuehrungszeichen = !inAnfuehrungszeichen;
        }
      } else if (zeichen === trennzeichen && !inAnfuehrungszeichen) {
        ergebnis.push(aktuellerWert);
        aktuellerWert = '';
      } else {
        aktuellerWert += zeichen;
      }
    }

    ergebnis.push(aktuellerWert);
    return ergebnis;
  }

  private csvWerteZuObjekt(
    kopfzeile: string[],
    werte: string[],
  ): Record<string, string> {
    const obj: Record<string, string> = {};
    kopfzeile.forEach((spalte, index) => {
      obj[spalte.trim()] = (werte[index] || '').trim();
    });
    return obj;
  }

  private deutschesDatumParsen(wert: string | undefined): Date | null {
    if (!wert || !wert.trim()) return null;

    const teile = wert.trim().split('.');
    if (teile.length !== 3) return null;

    const tag = parseInt(teile[0], 10);
    const monat = parseInt(teile[1], 10);
    const jahr = parseInt(teile[2], 10);

    if (isNaN(tag) || isNaN(monat) || isNaN(jahr)) return null;
    if (tag < 1 || tag > 31 || monat < 1 || monat > 12) return null;

    return new Date(jahr, monat - 1, tag);
  }

  private datumFormatieren(datum: Date | null | undefined): string {
    if (!datum) return '';
    const d = new Date(datum);
    const tag = String(d.getDate()).padStart(2, '0');
    const monat = String(d.getMonth() + 1).padStart(2, '0');
    const jahr = d.getFullYear();
    return `${tag}.${monat}.${jahr}`;
  }

  private csvWertEscapen(wert: string): string {
    if (wert.includes(';') || wert.includes('"') || wert.includes('\n')) {
      return `"${wert.replace(/"/g, '""')}"`;
    }
    return wert;
  }

  // ==================== Beitrag & Ermaessigung ====================

  /** Ermaessigungen die einen Nachweis erfordern */
  private readonly NACHWEIS_PFLICHT: Ermaessigung[] = [
    Ermaessigung.STUDENT,
    Ermaessigung.SCHUELER,
    Ermaessigung.AZUBI,
    Ermaessigung.RENTNER,
    Ermaessigung.SCHWERBEHINDERT,
    Ermaessigung.SOZIAL,
  ];

  /** Nachweis-Dokument hochladen und Status auf EINGEREICHT setzen */
  async profilbildSetzen(tenantId: string, memberId: string, bildUrl: string | null) {
    await this.nachIdAbrufen(tenantId, memberId);
    return this.prisma.member.update({
      where: { id: memberId },
      data: { profilBildUrl: bildUrl },
    });
  }

  async nachweisHochladen(tenantId: string, memberId: string, dokUrl: string) {
    await this.nachIdAbrufen(tenantId, memberId);

    return this.prisma.member.update({
      where: { id: memberId },
      data: {
        nachweisDokUrl: dokUrl,
        nachweisStatus: NachweisStatus.EINGEREICHT,
      },
    });
  }

  /** Admin genehmigt oder lehnt Nachweis ab */
  async nachweisStatusAendern(
    tenantId: string,
    memberId: string,
    status: NachweisStatus,
  ) {
    const mitglied = await this.nachIdAbrufen(tenantId, memberId);

    // Nur GENEHMIGT oder ABGELEHNT erlaubt
    if (
      status !== NachweisStatus.GENEHMIGT &&
      status !== NachweisStatus.ABGELEHNT
    ) {
      throw new BadRequestException(
        'Nur GENEHMIGT oder ABGELEHNT ist erlaubt.',
      );
    }

    const updateData: Record<string, unknown> = {
      nachweisStatus: status,
    };

    // Wenn abgelehnt und Ermaessigung gesetzt aber kein gueltiger Nachweis:
    // Status auf AUSSTEHEND setzen
    if (
      status === NachweisStatus.ABGELEHNT &&
      mitglied.ermaessigung &&
      this.NACHWEIS_PFLICHT.includes(mitglied.ermaessigung)
    ) {
      updateData.nachweisStatus = NachweisStatus.AUSSTEHEND;
      updateData.nachweisDokUrl = null;
    }

    return this.prisma.member.update({
      where: { id: memberId },
      data: updateData,
    });
  }

  /** Beitragsdaten fuer ein Mitglied setzen */
  async beitragSetzen(
    tenantId: string,
    memberId: string,
    daten: {
      beitragsArt?: string;
      beitragBetrag?: number;
      beitragIntervall?: string;
      ermaessigung?: Ermaessigung;
      ermaessigungProzent?: number;
      ermaessigungBis?: string;
    },
  ) {
    await this.nachIdAbrufen(tenantId, memberId);

    // Bestimmen ob Nachweis erforderlich ist
    let nachweisStatus: NachweisStatus | undefined;
    if (
      daten.ermaessigung &&
      daten.ermaessigung !== Ermaessigung.KEINE &&
      this.NACHWEIS_PFLICHT.includes(daten.ermaessigung)
    ) {
      nachweisStatus = NachweisStatus.AUSSTEHEND;
    } else if (
      daten.ermaessigung === Ermaessigung.KEINE ||
      daten.ermaessigung === Ermaessigung.EHRENAMT ||
      daten.ermaessigung === Ermaessigung.FAMILIE ||
      daten.ermaessigung === Ermaessigung.SONSTIGE
    ) {
      nachweisStatus = NachweisStatus.NICHT_ERFORDERLICH;
    }

    return this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...(daten.beitragsArt !== undefined && { beitragsArt: daten.beitragsArt }),
        ...(daten.beitragBetrag !== undefined && { beitragBetrag: daten.beitragBetrag }),
        ...(daten.beitragIntervall !== undefined && { beitragIntervall: daten.beitragIntervall }),
        ...(daten.ermaessigung !== undefined && { ermaessigung: daten.ermaessigung }),
        ...(daten.ermaessigungProzent !== undefined && {
          ermaessigungProzent: daten.ermaessigungProzent,
        }),
        ...(daten.ermaessigungBis !== undefined && {
          ermaessigungBis: new Date(daten.ermaessigungBis),
        }),
        ...(nachweisStatus !== undefined && { nachweisStatus }),
      },
    });
  }

  /** Erinnerungen an Mitglieder senden, deren Nachweis AUSSTEHEND ist */
  async nachweisErinnerungenSenden(tenantId: string) {
    const siebenTageZurueck = new Date();
    siebenTageZurueck.setDate(siebenTageZurueck.getDate() - 7);

    const mitglieder = await this.prisma.member.findMany({
      where: {
        tenantId,
        nachweisStatus: NachweisStatus.AUSSTEHEND,
        OR: [
          { nachweisErinnerungGesendet: null },
          { nachweisErinnerungGesendet: { lt: siebenTageZurueck } },
        ],
      },
    });

    const jetzt = new Date();
    let gesendet = 0;

    for (const mitglied of mitglieder) {
      // Erinnerung loggen (spaeter durch echte E-Mail ersetzen)
      console.log(
        `[Nachweis-Erinnerung] Mitglied ${mitglied.firstName} ${mitglied.lastName} (${mitglied.id}): ` +
          `Nachweis fuer Ermaessigung "${mitglied.ermaessigung}" fehlt noch.`,
      );

      await this.prisma.member.update({
        where: { id: mitglied.id },
        data: { nachweisErinnerungGesendet: jetzt },
      });

      gesendet++;
    }

    return { erinnerungenGesendet: gesendet };
  }

  /** Uebersicht aller Mitglieder mit aktiver Ermaessigung */
  async ermaessigungUebersicht(tenantId: string) {
    return this.prisma.member.findMany({
      where: {
        tenantId,
        ermaessigung: { not: null },
        NOT: { ermaessigung: Ermaessigung.KEINE },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberNumber: true,
        email: true,
        ermaessigung: true,
        ermaessigungProzent: true,
        ermaessigungBis: true,
        beitragsArt: true,
        beitragBetrag: true,
        beitragIntervall: true,
        nachweisStatus: true,
        nachweisDokUrl: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  // ==================== Statistik ====================

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
