import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  rolle: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload) {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!benutzer) {
      throw new UnauthorizedException('Benutzer nicht gefunden.');
    }

    return {
      id: benutzer.id,
      email: benutzer.email,
      rolle: benutzer.role,
      tenantId: benutzer.tenantId,
      berechtigungen: benutzer.berechtigungen ?? [],
    };
  }
}
