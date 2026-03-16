import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLLEN_KEY } from '../decorators/rollen.decorator';

@Injectable()
export class RollenGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const erforderlicheRollen = this.reflector.getAllAndOverride<Role[]>(
      ROLLEN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!erforderlicheRollen || erforderlicheRollen.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return erforderlicheRollen.includes(user.rolle);
  }
}
