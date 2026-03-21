import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ErstelleWikiSeiteDto {
  titel: string;
  inhalt: string;
  kategorie?: string;
}

export interface AktualisiereWikiSeiteDto {
  titel?: string;
  inhalt?: string;
  kategorie?: string;
}

@Injectable()
export class WikiService {
  constructor(private prisma: PrismaService) {}

  async erstellen(
    tenantId: string,
    userId: string,
    dto: ErstelleWikiSeiteDto,
  ) {
    return this.prisma.wikiSeite.create({
      data: {
        tenantId,
        titel: dto.titel,
        inhalt: dto.inhalt,
        kategorie: dto.kategorie || null,
        erstelltVon: userId,
      },
    });
  }

  async alleListen(tenantId: string, kategorie?: string) {
    return this.prisma.wikiSeite.findMany({
      where: {
        tenantId,
        ...(kategorie ? { kategorie } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async einzeln(tenantId: string, id: string) {
    const seite = await this.prisma.wikiSeite.findFirst({
      where: { id, tenantId },
    });
    if (!seite) {
      throw new NotFoundException('Wiki-Seite nicht gefunden');
    }
    return seite;
  }

  async aktualisieren(
    tenantId: string,
    id: string,
    userId: string,
    dto: AktualisiereWikiSeiteDto,
  ) {
    const seite = await this.prisma.wikiSeite.findFirst({
      where: { id, tenantId },
    });
    if (!seite) {
      throw new NotFoundException('Wiki-Seite nicht gefunden');
    }

    return this.prisma.wikiSeite.update({
      where: { id },
      data: {
        ...(dto.titel !== undefined ? { titel: dto.titel } : {}),
        ...(dto.inhalt !== undefined ? { inhalt: dto.inhalt } : {}),
        ...(dto.kategorie !== undefined ? { kategorie: dto.kategorie } : {}),
        bearbeitetVon: userId,
      },
    });
  }

  async loeschen(tenantId: string, id: string, rolle: string) {
    if (rolle !== 'ADMIN' && rolle !== 'SUPERADMIN') {
      throw new ForbiddenException('Nur Admins koennen Wiki-Seiten loeschen');
    }

    const seite = await this.prisma.wikiSeite.findFirst({
      where: { id, tenantId },
    });
    if (!seite) {
      throw new NotFoundException('Wiki-Seite nicht gefunden');
    }

    return this.prisma.wikiSeite.delete({ where: { id } });
  }

  async suchen(tenantId: string, suchbegriff: string) {
    const q = `%${suchbegriff}%`;
    return this.prisma.wikiSeite.findMany({
      where: {
        tenantId,
        OR: [
          { titel: { contains: suchbegriff, mode: 'insensitive' } },
          { inhalt: { contains: suchbegriff, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
