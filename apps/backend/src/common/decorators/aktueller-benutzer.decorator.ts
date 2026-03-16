import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const AktuellerBenutzer = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (data) {
      return (user as Record<string, unknown>)?.[data];
    }
    return user;
  },
);
