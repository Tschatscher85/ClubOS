import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * TenantStatusMiddleware: Prueft ob der Tenant aktiv ist.
 * Gesperrte Tenants bekommen 403 mit Sperrgrund zurueck.
 *
 * Ausnahmen:
 * - Auth-Routen (Login, Registrierung)
 * - Billing-Routen (damit gesperrte Vereine bezahlen koennen)
 * - Health-Routen
 * - SUPERADMIN-Requests
 */
@Injectable()
export class TenantStatusMiddleware implements NestMiddleware {
  private static readonly AUSGENOMMENE_PFADE = [
    '/auth',
    '/billing',
    '/health',
    '/admin',
  ];

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as unknown as Record<string, unknown>)['user'] as
        | { rolle?: string; tenantId?: string }
        | undefined;

      // Kein User (nicht eingeloggt) oder SUPERADMIN → durchlassen
      if (!user || !user.tenantId || user.rolle === 'SUPERADMIN') {
        return next();
      }

      // Ausgenommene Pfade durchlassen
      const pfad = req.path.toLowerCase();
      if (
        TenantStatusMiddleware.AUSGENOMMENE_PFADE.some((p) =>
          pfad.startsWith(p),
        )
      ) {
        return next();
      }

      // Tenant-Status pruefen
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { istAktiv: true, gesperrtAm: true, gesperrtGrund: true },
      });

      if (!tenant || !tenant.istAktiv) {
        return res.status(403).json({
          statusCode: 403,
          error: 'Verein gesperrt',
          message:
            tenant?.gesperrtGrund ||
            'Ihr Verein wurde gesperrt. Bitte kontaktieren Sie den Support.',
          gesperrtAm: tenant?.gesperrtAm || null,
        });
      }

      return next();
    } catch {
      // Bei Fehlern nicht blockieren
      return next();
    }
  }
}
