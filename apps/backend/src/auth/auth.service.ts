import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrierenDto } from './dto/registrieren.dto';
import { AnmeldenDto } from './dto/anmelden.dto';
import { Role } from '@prisma/client';
import { BCRYPT_ROUNDS } from '@clubos/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Registriert einen neuen Verein mit Admin-Benutzer
   */
  async registrieren(dto: RegistrierenDto) {
    // Pruefen ob E-Mail bereits existiert
    const existierenderBenutzer = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existierenderBenutzer) {
      throw new ConflictException(
        'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.',
      );
    }

    // Pruefen ob Slug bereits vergeben
    const existierenderTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existierenderTenant) {
      throw new ConflictException(
        'Dieser Vereins-Slug ist bereits vergeben. Bitte waehlen Sie einen anderen.',
      );
    }

    // Passwort hashen
    const passwortHash = await bcrypt.hash(dto.passwort, BCRYPT_ROUNDS);

    // Tenant und Admin-Benutzer in einer Transaktion erstellen
    const ergebnis = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.vereinsname,
          slug: dto.slug,
        },
      });

      const benutzer = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: passwortHash,
          role: Role.ADMIN,
          tenantId: tenant.id,
        },
      });

      return { tenant, benutzer };
    });

    // Tokens generieren
    const tokens = await this.generiereTokens(
      ergebnis.benutzer.id,
      ergebnis.benutzer.email,
      ergebnis.benutzer.role,
      ergebnis.tenant.id,
    );

    // Refresh-Token in DB speichern
    await this.aktualisiereRefreshToken(
      ergebnis.benutzer.id,
      tokens.refreshToken,
    );

    return {
      benutzer: {
        id: ergebnis.benutzer.id,
        email: ergebnis.benutzer.email,
        rolle: ergebnis.benutzer.role,
        tenantId: ergebnis.tenant.id,
      },
      tenant: {
        id: ergebnis.tenant.id,
        name: ergebnis.tenant.name,
        slug: ergebnis.tenant.slug,
      },
      ...tokens,
    };
  }

  /**
   * Meldet einen Benutzer an
   */
  async anmelden(dto: AnmeldenDto) {
    const benutzer = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!benutzer || !benutzer.passwordHash) {
      throw new UnauthorizedException(
        'E-Mail-Adresse oder Passwort ist falsch.',
      );
    }

    const passwortStimmt = await bcrypt.compare(
      dto.passwort,
      benutzer.passwordHash,
    );

    if (!passwortStimmt) {
      throw new UnauthorizedException(
        'E-Mail-Adresse oder Passwort ist falsch.',
      );
    }

    const tokens = await this.generiereTokens(
      benutzer.id,
      benutzer.email,
      benutzer.role,
      benutzer.tenantId,
    );

    await this.aktualisiereRefreshToken(benutzer.id, tokens.refreshToken);

    return {
      benutzer: {
        id: benutzer.id,
        email: benutzer.email,
        rolle: benutzer.role,
        tenantId: benutzer.tenantId,
      },
      tenant: {
        id: benutzer.tenant.id,
        name: benutzer.tenant.name,
        slug: benutzer.tenant.slug,
      },
      ...tokens,
    };
  }

  /**
   * Aktualisiert das Token-Paar mit einem gueltigen Refresh-Token
   */
  async tokenAktualisieren(userId: string, alterRefreshToken: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!benutzer || !benutzer.refreshToken) {
      throw new UnauthorizedException('Zugriff verweigert.');
    }

    if (benutzer.refreshToken !== alterRefreshToken) {
      // Moeglicher Token-Diebstahl: alle Tokens invalidieren
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
      throw new UnauthorizedException(
        'Refresh-Token ist ungueltig. Bitte melden Sie sich erneut an.',
      );
    }

    const tokens = await this.generiereTokens(
      benutzer.id,
      benutzer.email,
      benutzer.role,
      benutzer.tenantId,
    );

    await this.aktualisiereRefreshToken(benutzer.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Meldet einen Benutzer ab (invalidiert Refresh-Token)
   */
  async abmelden(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Gibt das Profil des aktuellen Benutzers zurueck
   */
  async profil(userId: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!benutzer) {
      throw new BadRequestException('Benutzer nicht gefunden.');
    }

    return {
      id: benutzer.id,
      email: benutzer.email,
      rolle: benutzer.role,
      tenantId: benutzer.tenantId,
      tenant: {
        id: benutzer.tenant.id,
        name: benutzer.tenant.name,
        slug: benutzer.tenant.slug,
      },
      erstelltAm: benutzer.createdAt,
    };
  }

  // ==================== Private Hilfsmethoden ====================

  private async generiereTokens(
    userId: string,
    email: string,
    rolle: Role,
    tenantId: string,
  ) {
    const payload = { sub: userId, email, rolle, tenantId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async aktualisiereRefreshToken(
    userId: string,
    refreshToken: string,
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
