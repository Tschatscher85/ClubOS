import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  rolle: string;
  tenantId: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.body.refreshToken;

    const benutzer = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!benutzer || !benutzer.refreshToken) {
      throw new UnauthorizedException('Zugriff verweigert.');
    }

    // Pruefen ob der Token dem gespeicherten entspricht
    if (benutzer.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh-Token ist ungueltig.');
    }

    return {
      id: benutzer.id,
      email: benutzer.email,
      rolle: benutzer.role,
      tenantId: benutzer.tenantId,
      refreshToken,
    };
  }
}
