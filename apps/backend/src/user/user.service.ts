import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleUserDto,
  AktualisiereUserDto,
  ErstelleBenutzerDto,
  AktualisiereBenutzerDto,
  AktualisiereBerechtigungenDto,
} from './dto/erstelle-user.dto';
import { BCRYPT_ROUNDS } from '@vereinbase/shared';

/** Standard-Berechtigungen pro Rolle */
const STANDARD_BERECHTIGUNGEN: Record<string, string[]> = {
  [Role.ADMIN]: [
    'MITGLIEDER',
    'TEAMS',
    'KALENDER',
    'TURNIERE',
    'NACHRICHTEN',
    'BUCHHALTUNG',
    'FORMULARE',
    'DOKUMENTE',
    'EINSTELLUNGEN',
  ],
  [Role.TRAINER]: [
    'MITGLIEDER',
    'TEAMS',
    'KALENDER',
    'TURNIERE',
    'NACHRICHTEN',
    'FORMULARE',
  ],
  [Role.MEMBER]: ['KALENDER', 'NACHRICHTEN'],
  [Role.PARENT]: ['KALENDER', 'NACHRICHTEN'],
  [Role.SUPERADMIN]: [
    'MITGLIEDER',
    'TEAMS',
    'KALENDER',
    'TURNIERE',
    'NACHRICHTEN',
    'BUCHHALTUNG',
    'FORMULARE',
    'DOKUMENTE',
    'EINSTELLUNGEN',
  ],
};

/** Benutzer-Select fuer Benutzerverwaltung (mit neuen Feldern) */
const BENUTZER_SELECT = {
  id: true,
  email: true,
  role: true,
  tenantId: true,
  vereinsRollen: true,
  berechtigungen: true,
  istAktiv: true,
  letzterLogin: true,
  eingeladenVon: true,
  notizen: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== Bestehende Methoden ====================

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
        berechtigungen: STANDARD_BERECHTIGUNGEN[dto.rolle] || [],
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

  // ==================== Benutzerverwaltung (neu) ====================

  /**
   * Alle Benutzer eines Vereins abrufen (mit Berechtigungen)
   */
  async benutzerAuflisten(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: BENUTZER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Neuen Benutzer erstellen mit temporaerem Passwort
   */
  async benutzerErstellen(
    tenantId: string,
    eingeladenVonId: string,
    dto: ErstelleBenutzerDto,
  ) {
    const existierend = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existierend) {
      throw new ConflictException(
        'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.',
      );
    }

    // Temporaeres Passwort generieren (8 Zeichen)
    const tempPasswort = this.generiereTemporaeresPasswort(8);
    const passwortHash = await bcrypt.hash(tempPasswort, BCRYPT_ROUNDS);

    // Berechtigungen: uebergebene oder Standard basierend auf Rolle
    const berechtigungen =
      dto.berechtigungen && dto.berechtigungen.length > 0
        ? dto.berechtigungen
        : STANDARD_BERECHTIGUNGEN[dto.rolle] || [];

    const benutzer = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: passwortHash,
        role: dto.rolle,
        tenantId,
        berechtigungen,
        eingeladenVon: eingeladenVonId,
        notizen: dto.notizen,
      },
      select: BENUTZER_SELECT,
    });

    // Temporaeres Passwort loggen (SMTP nicht konfiguriert)
    this.logger.log(
      `Neuer Benutzer erstellt: ${dto.email} | Temporaeres Passwort: ${tempPasswort} | Rolle: ${dto.rolle}`,
    );

    return {
      ...benutzer,
      temporaeresPasswort: tempPasswort,
    };
  }

  /**
   * Benutzer aktualisieren (Rolle, Berechtigungen, Status, Notizen)
   */
  async benutzerAktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereBenutzerDto,
  ) {
    const benutzer = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.rolle !== undefined && { role: dto.rolle }),
        ...(dto.berechtigungen !== undefined && { berechtigungen: dto.berechtigungen }),
        ...(dto.istAktiv !== undefined && { istAktiv: dto.istAktiv }),
        ...(dto.notizen !== undefined && { notizen: dto.notizen }),
      },
      select: BENUTZER_SELECT,
    });
  }

  /**
   * Nur Berechtigungen eines Benutzers aktualisieren
   */
  async berechtigungenAktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereBerechtigungenDto,
  ) {
    const benutzer = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { berechtigungen: dto.berechtigungen },
      select: BENUTZER_SELECT,
    });
  }

  /**
   * Benutzer deaktivieren
   */
  async benutzerDeaktivieren(tenantId: string, id: string) {
    const benutzer = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { istAktiv: false },
      select: BENUTZER_SELECT,
    });
  }

  /**
   * Benutzer aktivieren
   */
  async benutzerAktivieren(tenantId: string, id: string) {
    const benutzer = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { istAktiv: true },
      select: BENUTZER_SELECT,
    });
  }

  /**
   * Benutzer loeschen (ADMIN darf sich nicht selbst loeschen)
   */
  async benutzerLoeschen(tenantId: string, id: string, aktuellerBenutzerId: string) {
    if (id === aktuellerBenutzerId) {
      throw new ForbiddenException('Sie koennen sich nicht selbst loeschen.');
    }

    const benutzer = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    await this.prisma.user.delete({ where: { id } });

    return { nachricht: 'Benutzer erfolgreich geloescht.' };
  }

  // ==================== Vereinsrollen ====================

  /**
   * Berechnet Berechtigungen und System-Rolle aus Vereinsrollen.
   * Liest die RollenVorlagen aus der DB und bildet die Vereinigung aller Berechtigungen.
   * Die System-Rolle wird auf die hoechste gesetzte Rolle gesetzt.
   */
  async berechtigungenAusRollenBerechnen(
    tenantId: string,
    vereinsRollen: string[],
  ): Promise<{ systemRolle: Role; berechtigungen: string[] }> {
    if (vereinsRollen.length === 0) {
      return { systemRolle: Role.MEMBER, berechtigungen: [] };
    }

    const vorlagen = await this.prisma.rollenVorlage.findMany({
      where: {
        tenantId,
        name: { in: vereinsRollen },
      },
    });

    // Berechtigungen zusammenfuehren (Vereinigung)
    const alleBerechtigungen = new Set<string>();
    for (const vorlage of vorlagen) {
      for (const b of vorlage.berechtigungen) {
        alleBerechtigungen.add(b);
      }
    }

    // Hoechste System-Rolle bestimmen
    const ROLLEN_HIERARCHIE: Record<string, number> = {
      [Role.PARENT]: 0,
      [Role.MEMBER]: 1,
      [Role.TRAINER]: 2,
      [Role.ADMIN]: 3,
      [Role.SUPERADMIN]: 4,
    };

    let hoechsteRolle: Role = Role.MEMBER;
    for (const vorlage of vorlagen) {
      if (
        ROLLEN_HIERARCHIE[vorlage.systemRolle] >
        ROLLEN_HIERARCHIE[hoechsteRolle]
      ) {
        hoechsteRolle = vorlage.systemRolle as Role;
      }
    }

    return {
      systemRolle: hoechsteRolle,
      berechtigungen: Array.from(alleBerechtigungen),
    };
  }

  /**
   * Vereinsrollen eines Benutzers aktualisieren.
   * Berechnet automatisch die Berechtigungen und System-Rolle neu.
   * Optionale individuelle Berechtigungen werden addiert.
   */
  async vereinsRollenZuweisen(
    tenantId: string,
    id: string,
    vereinsRollen: string[],
    zusaetzlicheBerechtigungen?: string[],
  ) {
    const benutzer = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!benutzer) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    const { systemRolle, berechtigungen } =
      await this.berechtigungenAusRollenBerechnen(tenantId, vereinsRollen);

    // Zusaetzliche individuelle Berechtigungen hinzufuegen
    const alleBerechtigungen = new Set(berechtigungen);
    if (zusaetzlicheBerechtigungen) {
      for (const b of zusaetzlicheBerechtigungen) {
        alleBerechtigungen.add(b);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        vereinsRollen,
        role: systemRolle,
        berechtigungen: Array.from(alleBerechtigungen),
      },
      select: BENUTZER_SELECT,
    });
  }

  // ==================== Hilfsmethoden ====================

  /**
   * Generiert ein temporaeres Passwort mit Gross-/Kleinbuchstaben und Ziffern
   */
  private generiereTemporaeresPasswort(laenge: number): string {
    const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let passwort = '';
    for (let i = 0; i < laenge; i++) {
      passwort += zeichen.charAt(Math.floor(Math.random() * zeichen.length));
    }
    return passwort;
  }
}
