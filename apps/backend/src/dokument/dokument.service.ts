import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DokumentKategorie } from '@prisma/client';
import { ErstelleDokumentDto } from './dto/erstelle-dokument.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DokumentService {
  constructor(private prisma: PrismaService) {}

  async hochladen(
    tenantId: string,
    userId: string,
    datei: Express.Multer.File,
    dto: ErstelleDokumentDto,
  ) {
    return this.prisma.dokument.create({
      data: {
        tenantId,
        name: dto.name,
        beschreibung: dto.beschreibung,
        dateiUrl: datei.path,
        dateiGroesse: datei.size,
        dateiTyp: datei.mimetype,
        kategorie: dto.kategorie,
        ordner: dto.ordner,
        hochgeladenVon: userId,
      },
    });
  }

  async alleAbrufen(
    tenantId: string,
    kategorie?: DokumentKategorie,
    ordner?: string,
  ) {
    const where: {
      tenantId: string;
      kategorie?: DokumentKategorie;
      ordner?: string;
    } = { tenantId };

    if (kategorie) {
      where.kategorie = kategorie;
    }
    if (ordner) {
      where.ordner = ordner;
    }

    return this.prisma.dokument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const dokument = await this.prisma.dokument.findFirst({
      where: { id, tenantId },
    });

    if (!dokument) {
      throw new NotFoundException('Dokument nicht gefunden.');
    }

    return dokument;
  }

  async loeschen(tenantId: string, id: string) {
    const dokument = await this.nachIdAbrufen(tenantId, id);

    // Datei vom Dateisystem loeschen
    const dateiPfad = path.resolve(dokument.dateiUrl);
    if (fs.existsSync(dateiPfad)) {
      fs.unlinkSync(dateiPfad);
    }

    return this.prisma.dokument.delete({ where: { id: dokument.id } });
  }

  async ordnerAbrufen(tenantId: string) {
    const ergebnisse = await this.prisma.dokument.findMany({
      where: { tenantId, ordner: { not: null } },
      select: { ordner: true },
      distinct: ['ordner'],
      orderBy: { ordner: 'asc' },
    });

    return ergebnisse
      .map((e) => e.ordner)
      .filter((o): o is string => o !== null);
  }
}
