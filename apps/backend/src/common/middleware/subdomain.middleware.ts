import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Subdomain-Middleware: Erkennt den Verein anhand der Subdomain
 * und haengt den aufgeloesten Tenant an das Request-Objekt.
 *
 * Beispiel: fckunchen.vereinbase.de → slug = 'fckunchen'
 */
@Injectable()
export class SubdomainMiddleware implements NestMiddleware {
  /** Subdomains, die uebersprungen werden sollen */
  private static readonly IGNORIERTE_SUBDOMAINS = ['www', 'api', 'localhost'];

  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const hostname = req.hostname || req.headers.host?.split(':')[0] || '';

      // IP-Adressen ueberspringen (IPv4 und IPv6)
      if (this.istIpAdresse(hostname)) {
        return next();
      }

      // localhost ueberspringen
      if (hostname === 'localhost') {
        return next();
      }

      // Subdomain extrahieren: 'fckunchen.vereinbase.de' → 'fckunchen'
      const teile = hostname.split('.');
      if (teile.length < 3) {
        // Keine Subdomain vorhanden (z.B. 'vereinbase.de')
        return next();
      }

      const subdomain = teile[0].toLowerCase();

      // Ignorierte Subdomains ueberspringen
      if (SubdomainMiddleware.IGNORIERTE_SUBDOMAINS.includes(subdomain)) {
        return next();
      }

      // Tenant anhand des Slugs suchen
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: subdomain },
      });

      if (tenant) {
        (req as unknown as Record<string, unknown>)['resolvedTenant'] = tenant;
      }

      // Immer weiter, auch wenn kein Tenant gefunden wurde
      return next();
    } catch {
      // Bei Fehlern nicht blockieren, einfach weiter
      return next();
    }
  }

  /**
   * Prueft, ob der Hostname eine IP-Adresse ist (IPv4 oder IPv6).
   */
  private istIpAdresse(hostname: string): boolean {
    // IPv4: z.B. 192.168.1.1
    const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    // IPv6: z.B. ::1 oder fe80::1
    const ipv6Regex = /^[0-9a-fA-F:]+$/;

    return ipv4Regex.test(hostname) || (hostname.includes(':') && ipv6Regex.test(hostname));
  }
}
