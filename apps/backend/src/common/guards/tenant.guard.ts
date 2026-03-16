import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * TenantGuard stellt sicher, dass Benutzer nur auf Daten ihres
 * eigenen Vereins zugreifen koennen. SUPERADMIN ist ausgenommen.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Superadmin darf alles
    if (user.rolle === Role.SUPERADMIN) {
      return true;
    }

    // tenantId aus Route-Param oder Body pruefen
    const paramTenantId = request.params?.tenantId;
    const bodyTenantId = request.body?.tenantId;
    const queryTenantId = request.query?.tenantId;

    const angefragteTenantId = paramTenantId || bodyTenantId || queryTenantId;

    if (angefragteTenantId && angefragteTenantId !== user.tenantId) {
      throw new ForbiddenException(
        'Zugriff verweigert: Sie gehoeren nicht zu diesem Verein.',
      );
    }

    return true;
  }
}
