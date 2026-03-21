import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import {
  InseratKategorie,
  InseratTyp,
  BewerbungStatus,
  Prisma,
} from '@prisma/client';

// ==================== DTOs ====================

export interface ErstelleInseratDto {
  kategorie: InseratKategorie;
  typ: InseratTyp;
  titel: string;
  beschreibung: string;
  sportart?: string;
  bildUrl?: string;
  preis?: number | null;
  kontaktEmail?: string;
  kontaktTelefon?: string;
  datum?: string;
  altersgruppe?: string;
  ablaufDatum?: string;
}

export interface AktualisiereInseratDto {
  kategorie?: InseratKategorie;
  typ?: InseratTyp;
  titel?: string;
  beschreibung?: string;
  sportart?: string | null;
  bildUrl?: string | null;
  preis?: number | null;
  kontaktEmail?: string;
  kontaktTelefon?: string | null;
  datum?: string | null;
  altersgruppe?: string | null;
  ablaufDatum?: string | null;
  aktiv?: boolean;
}

export interface InseratFilter {
  kategorie?: InseratKategorie;
  typ?: InseratTyp;
  sportart?: string;
  plz?: string;
  umkreis?: number; // 20 oder 50 km
  suche?: string;
}

export interface BewerbenDto {
  nachricht: string;
  kontaktEmail?: string;
}

export interface StatusUpdateDto {
  status: BewerbungStatus;
}

// ==================== Service ====================

@Injectable()
export class MarktplatzService {
  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  /**
   * Inserat erstellen (ADMIN/SUPERADMIN).
   * PLZ + Ort werden automatisch vom Tenant uebernommen.
   */
  async erstellen(
    tenantId: string,
    userId: string,
    dto: ErstelleInseratDto,
  ) {
    // Tenant-Daten fuer PLZ, Ort und Kontakt-Email holen
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plz: true, ort: true, email: true, name: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    if (!tenant.plz || !tenant.ort) {
      throw new ForbiddenException(
        'Bitte zuerst PLZ und Ort in den Vereinseinstellungen hinterlegen.',
      );
    }

    return this.prisma.marktplatzInserat.create({
      data: {
        tenantId,
        erstelltVon: userId,
        kategorie: dto.kategorie,
        typ: dto.typ,
        titel: dto.titel,
        beschreibung: dto.beschreibung,
        sportart: dto.sportart || null,
        bildUrl: dto.bildUrl || null,
        preis: dto.preis ?? null,
        plz: tenant.plz,
        ort: tenant.ort,
        kontaktEmail: dto.kontaktEmail || tenant.email || '',
        kontaktTelefon: dto.kontaktTelefon || null,
        datum: dto.datum ? new Date(dto.datum) : null,
        altersgruppe: dto.altersgruppe || null,
        ablaufDatum: dto.ablaufDatum ? new Date(dto.ablaufDatum) : null,
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        _count: { select: { bewerbungen: true } },
      },
    });
  }

  /**
   * Alle aktiven Inserate abrufen (CROSS-TENANT!).
   * Kein tenantId-Filter — alle Vereine sehen alles.
   */
  async alleAbrufen(filter: InseratFilter) {
    const jetzt = new Date();

    const where: Prisma.MarktplatzInseratWhereInput = {
      aktiv: true,
      OR: [
        { ablaufDatum: null },
        { ablaufDatum: { gte: jetzt } },
      ],
    };

    // Kategorie-Filter
    if (filter.kategorie) {
      where.kategorie = filter.kategorie;
    }

    // Typ-Filter (ANGEBOT / GESUCH)
    if (filter.typ) {
      where.typ = filter.typ;
    }

    // Sportart-Filter
    if (filter.sportart) {
      where.sportart = filter.sportart;
    }

    // PLZ-basierte Naehe (einfach: erste 2-3 Stellen vergleichen)
    if (filter.plz) {
      const plzPrefix = filter.umkreis && filter.umkreis <= 20
        ? filter.plz.substring(0, 3)  // ~20 km: erste 3 Stellen
        : filter.plz.substring(0, 2); // ~50 km: erste 2 Stellen

      where.plz = { startsWith: plzPrefix };
    }

    // Freitext-Suche
    if (filter.suche) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { titel: { contains: filter.suche, mode: 'insensitive' } },
            { beschreibung: { contains: filter.suche, mode: 'insensitive' } },
            { ort: { contains: filter.suche, mode: 'insensitive' } },
          ],
        },
      ];
    }

    return this.prisma.marktplatzInserat.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        _count: { select: { bewerbungen: true } },
      },
      orderBy: { erstelltAm: 'desc' },
      take: 100,
    });
  }

  /**
   * Nur eigene Inserate des Vereins abrufen.
   */
  async meineAbrufen(tenantId: string) {
    return this.prisma.marktplatzInserat.findMany({
      where: { tenantId },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        _count: { select: { bewerbungen: true } },
      },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /**
   * Einzelnes Inserat abrufen (mit Bewerbungen, wenn eigenes).
   */
  async einzelnAbrufen(id: string, tenantId: string) {
    const inserat = await this.prisma.marktplatzInserat.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        bewerbungen: {
          where: { inseratId: id },
          orderBy: { erstelltAm: 'desc' },
        },
        _count: { select: { bewerbungen: true } },
      },
    });

    if (!inserat) {
      throw new NotFoundException('Inserat nicht gefunden.');
    }

    // Bewerbungen nur anzeigen, wenn eigenes Inserat
    if (inserat.tenantId !== tenantId) {
      return {
        ...inserat,
        bewerbungen: [],
      };
    }

    return inserat;
  }

  /**
   * Inserat aktualisieren (nur eigener Verein).
   */
  async aktualisieren(
    tenantId: string,
    id: string,
    userId: string,
    rolle: string,
    dto: AktualisiereInseratDto,
  ) {
    const inserat = await this.prisma.marktplatzInserat.findFirst({
      where: { id, tenantId },
    });

    if (!inserat) {
      throw new NotFoundException('Inserat nicht gefunden.');
    }

    if (inserat.erstelltVon !== userId && !['SUPERADMIN', 'ADMIN'].includes(rolle)) {
      throw new ForbiddenException('Keine Berechtigung zum Bearbeiten.');
    }

    return this.prisma.marktplatzInserat.update({
      where: { id },
      data: {
        ...(dto.kategorie !== undefined && { kategorie: dto.kategorie }),
        ...(dto.typ !== undefined && { typ: dto.typ }),
        ...(dto.titel !== undefined && { titel: dto.titel }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.sportart !== undefined && { sportart: dto.sportart || null }),
        ...(dto.bildUrl !== undefined && { bildUrl: dto.bildUrl || null }),
        ...(dto.preis !== undefined && { preis: dto.preis }),
        ...(dto.kontaktEmail !== undefined && { kontaktEmail: dto.kontaktEmail }),
        ...(dto.kontaktTelefon !== undefined && { kontaktTelefon: dto.kontaktTelefon || null }),
        ...(dto.datum !== undefined && { datum: dto.datum ? new Date(dto.datum) : null }),
        ...(dto.altersgruppe !== undefined && { altersgruppe: dto.altersgruppe || null }),
        ...(dto.ablaufDatum !== undefined && { ablaufDatum: dto.ablaufDatum ? new Date(dto.ablaufDatum) : null }),
        ...(dto.aktiv !== undefined && { aktiv: dto.aktiv }),
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        _count: { select: { bewerbungen: true } },
      },
    });
  }

  /**
   * Inserat loeschen/deaktivieren (eigener Verein oder SUPERADMIN).
   */
  async loeschen(tenantId: string, id: string, userId: string, rolle: string) {
    const inserat = await this.prisma.marktplatzInserat.findFirst({
      where: { id },
    });

    if (!inserat) {
      throw new NotFoundException('Inserat nicht gefunden.');
    }

    // Nur eigener Verein oder SUPERADMIN darf loeschen
    if (inserat.tenantId !== tenantId && rolle !== 'SUPERADMIN') {
      throw new ForbiddenException('Keine Berechtigung zum Loeschen.');
    }

    return this.prisma.marktplatzInserat.delete({ where: { id } });
  }

  /**
   * Auf ein Inserat bewerben/anfragen (ADMIN eines anderen Vereins).
   */
  async bewerben(
    inseratId: string,
    bewerberTenantId: string,
    bewerberUserId: string,
    dto: BewerbenDto,
  ) {
    const inserat = await this.prisma.marktplatzInserat.findUnique({
      where: { id: inseratId },
      select: {
        id: true,
        tenantId: true,
        erstelltVon: true,
        titel: true,
        aktiv: true,
      },
    });

    if (!inserat || !inserat.aktiv) {
      throw new NotFoundException('Inserat nicht gefunden oder nicht mehr aktiv.');
    }

    // Eigene Inserate koennen nicht beantwortet werden
    if (inserat.tenantId === bewerberTenantId) {
      throw new ForbiddenException('Sie koennen nicht auf eigene Inserate antworten.');
    }

    // Vereinsname des Bewerbers holen
    const bewerberTenant = await this.prisma.tenant.findUnique({
      where: { id: bewerberTenantId },
      select: { name: true, email: true },
    });

    if (!bewerberTenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    const bewerbung = await this.prisma.marktplatzBewerbung.create({
      data: {
        inseratId,
        bewerberTenantId,
        bewerberUserId,
        bewerberName: bewerberTenant.name,
        nachricht: dto.nachricht,
        kontaktEmail: dto.kontaktEmail || bewerberTenant.email || '',
      },
    });

    // Push-Benachrichtigung an Inserat-Ersteller
    try {
      await this.pushService.sendePushAnMehrere([inserat.erstelltVon], {
        title: 'Neue Marktplatz-Anfrage',
        body: `${bewerberTenant.name} hat auf "${inserat.titel}" geantwortet.`,
        url: '/marktplatz',
      });
    } catch {
      // Push-Fehler sollen das Bewerben nicht verhindern
    }

    return bewerbung;
  }

  /**
   * Bewerbungen fuer ein Inserat abrufen (nur Ersteller).
   */
  async bewerbungenAbrufen(inseratId: string, tenantId: string) {
    const inserat = await this.prisma.marktplatzInserat.findFirst({
      where: { id: inseratId, tenantId },
    });

    if (!inserat) {
      throw new NotFoundException('Inserat nicht gefunden oder keine Berechtigung.');
    }

    return this.prisma.marktplatzBewerbung.findMany({
      where: { inseratId },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /**
   * Bewerbungsstatus aktualisieren (nur Inserat-Ersteller).
   */
  async bewerbungStatusAendern(
    bewerbungId: string,
    tenantId: string,
    dto: StatusUpdateDto,
  ) {
    const bewerbung = await this.prisma.marktplatzBewerbung.findUnique({
      where: { id: bewerbungId },
      include: {
        inserat: { select: { tenantId: true } },
      },
    });

    if (!bewerbung) {
      throw new NotFoundException('Bewerbung nicht gefunden.');
    }

    if (bewerbung.inserat.tenantId !== tenantId) {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    return this.prisma.marktplatzBewerbung.update({
      where: { id: bewerbungId },
      data: { status: dto.status },
    });
  }

  /**
   * Alle eingehenden Bewerbungen auf eigene Inserate abrufen.
   */
  async alleBewerbungenAbrufen(tenantId: string) {
    return this.prisma.marktplatzBewerbung.findMany({
      where: {
        inserat: { tenantId },
      },
      include: {
        inserat: {
          select: { id: true, titel: true, kategorie: true, typ: true },
        },
      },
      orderBy: { erstelltAm: 'desc' },
    });
  }
}
