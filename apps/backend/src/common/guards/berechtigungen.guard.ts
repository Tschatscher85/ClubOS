import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BERECHTIGUNGEN_KEY } from '../decorators/berechtigungen.decorator';

@Injectable()
export class BerechtigungenGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const erforderlicheBerechtigungen =
      this.reflector.getAllAndOverride<string[]>(BERECHTIGUNGEN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (
      !erforderlicheBerechtigungen ||
      erforderlicheBerechtigungen.length === 0
    ) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // SUPERADMIN und ADMIN haben immer Zugriff
    if (['SUPERADMIN', 'ADMIN'].includes(user.rolle)) {
      return true;
    }

    // Pruefen ob der Benutzer mindestens eine der erforderlichen Berechtigungen hat
    const benutzerBerechtigungen: string[] = user.berechtigungen || [];
    return erforderlicheBerechtigungen.some((b) =>
      benutzerBerechtigungen.includes(b),
    );
  }
}
