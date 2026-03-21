import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditFilter {
  aktion?: string;
  tenantId?: string;
  von?: string; // ISO date string
  bis?: string; // ISO date string
  seite?: number;
  proSeite?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /** Audit-Log-Eintrag erstellen */
  async loggen(params: {
    aktion: string;
    userId: string;
    userEmail: string;
    details?: string;
    tenantId?: string;
    tenantName?: string;
    ipAdresse?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        aktion: params.aktion,
        userId: params.userId,
        userEmail: params.userEmail,
        details: params.details ?? null,
        tenantId: params.tenantId ?? null,
        tenantName: params.tenantName ?? null,
        ipAdresse: params.ipAdresse ?? null,
      },
    });
  }

  /** Alle Audit-Logs abrufen mit Filterung und Pagination */
  async alleAbrufen(filter: AuditFilter = {}) {
    const seite = Math.max(1, filter.seite ?? 1);
    const proSeite = Math.min(100, Math.max(1, filter.proSeite ?? 20));
    const skip = (seite - 1) * proSeite;
    const take = proSeite;

    const where: Record<string, unknown> = {};

    if (filter.aktion) {
      where.aktion = filter.aktion;
    }

    if (filter.tenantId) {
      where.tenantId = filter.tenantId;
    }

    if (filter.von || filter.bis) {
      const erstelltAm: Record<string, Date> = {};
      if (filter.von) {
        erstelltAm.gte = new Date(filter.von);
      }
      if (filter.bis) {
        const bisDate = new Date(filter.bis);
        bisDate.setHours(23, 59, 59, 999);
        erstelltAm.lte = bisDate;
      }
      where.erstelltAm = erstelltAm;
    }

    const [eintraege, gesamt] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { erstelltAm: 'desc' },
        skip,
        take: Math.min(take, 1000),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      eintraege,
      gesamt,
      seite,
      proSeite,
      seiten: Math.ceil(gesamt / proSeite),
    };
  }
}
