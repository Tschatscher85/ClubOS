import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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

    // E-Mail-Verifizierungs-Token generieren
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden

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
          emailVerifyToken,
          emailVerifyExpiresAt,
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

    // E-Mail-Verifizierung: Token in der Konsole loggen (SMTP nicht konfiguriert)
    console.log(
      `[Auth] E-Mail-Verifizierung fuer ${dto.email}: Token=${emailVerifyToken}`,
    );

    return {
      benutzer: {
        id: ergebnis.benutzer.id,
        email: ergebnis.benutzer.email,
        rolle: ergebnis.benutzer.role,
        tenantId: ergebnis.tenant.id,
        berechtigungen: ergebnis.benutzer.berechtigungen ?? [],
        vereinsRollen: ergebnis.benutzer.vereinsRollen ?? [],
      },
      tenant: {
        id: ergebnis.tenant.id,
        name: ergebnis.tenant.name,
        slug: ergebnis.tenant.slug,
        logo: ergebnis.tenant.logo ?? null,
        primaryColor: ergebnis.tenant.primaryColor,
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
        emailVerifiziert: benutzer.emailVerifiziert,
        berechtigungen: benutzer.berechtigungen ?? [],
        vereinsRollen: benutzer.vereinsRollen ?? [],
      },
      tenant: {
        id: benutzer.tenant.id,
        name: benutzer.tenant.name,
        slug: benutzer.tenant.slug,
        logo: benutzer.tenant.logo ?? null,
        primaryColor: benutzer.tenant.primaryColor,
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
      emailVerifiziert: benutzer.emailVerifiziert,
      berechtigungen: benutzer.berechtigungen ?? [],
      vereinsRollen: benutzer.vereinsRollen ?? [],
      tenant: {
        id: benutzer.tenant.id,
        name: benutzer.tenant.name,
        slug: benutzer.tenant.slug,
        logo: benutzer.tenant.logo ?? null,
        primaryColor: benutzer.tenant.primaryColor,
      },
      erstelltAm: benutzer.createdAt,
    };
  }

  /**
   * Aendert das Passwort eines Benutzers
   */
  async passwortAendern(
    userId: string,
    altesPasswort: string,
    neuesPasswort: string,
  ) {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!benutzer || !benutzer.passwordHash) {
      throw new BadRequestException(
        'Benutzer nicht gefunden oder kein Passwort gesetzt.',
      );
    }

    const passwortStimmt = await bcrypt.compare(
      altesPasswort,
      benutzer.passwordHash,
    );

    if (!passwortStimmt) {
      throw new UnauthorizedException('Das aktuelle Passwort ist falsch.');
    }

    const neuerHash = await bcrypt.hash(neuesPasswort, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: neuerHash },
    });

    return { nachricht: 'Passwort wurde erfolgreich geaendert.' };
  }

  // ==================== E-Mail-Verifizierung ====================

  /**
   * Verifiziert die E-Mail-Adresse mit dem Token
   */
  async emailVerifizieren(token: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!benutzer) {
      throw new BadRequestException(
        'Ungueltiger Verifizierungs-Link. Bitte fordern Sie einen neuen an.',
      );
    }

    if (
      benutzer.emailVerifyExpiresAt &&
      benutzer.emailVerifyExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Der Verifizierungs-Link ist abgelaufen. Bitte fordern Sie einen neuen an.',
      );
    }

    if (benutzer.emailVerifiziert) {
      return { nachricht: 'E-Mail-Adresse wurde bereits verifiziert.' };
    }

    await this.prisma.user.update({
      where: { id: benutzer.id },
      data: {
        emailVerifiziert: true,
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });

    return { nachricht: 'E-Mail-Adresse wurde erfolgreich verifiziert.' };
  }

  /**
   * Sendet den Verifizierungs-Link erneut
   */
  async emailVerifizierungErneutSenden(userId: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!benutzer) {
      throw new BadRequestException('Benutzer nicht gefunden.');
    }

    if (benutzer.emailVerifiziert) {
      return { nachricht: 'E-Mail-Adresse ist bereits verifiziert.' };
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken, emailVerifyExpiresAt },
    });

    // Token loggen (in Produktion per E-Mail senden)
    console.log(
      `[Auth] Neuer Verifizierungs-Token fuer ${benutzer.email}: ${emailVerifyToken}`,
    );

    return {
      nachricht:
        'Verifizierungs-E-Mail wurde erneut gesendet. Bitte pruefen Sie Ihr Postfach.',
    };
  }

  // ==================== Passwort vergessen ====================

  /**
   * Erstellt einen Passwort-Reset-Token und sendet ihn per E-Mail
   */
  async passwortVergessen(email: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { email },
    });

    // Immer die gleiche Antwort zurueckgeben (Sicherheit: keine Info ob E-Mail existiert)
    const antwort = {
      nachricht:
        'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link zum Zuruecksetzen gesendet.',
    };

    if (!benutzer) {
      return antwort;
    }

    const passwortResetToken = crypto.randomBytes(32).toString('hex');
    const passwortResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Stunde

    await this.prisma.user.update({
      where: { id: benutzer.id },
      data: { passwortResetToken, passwortResetExpiresAt },
    });

    // Token loggen (in Produktion per E-Mail senden)
    console.log(
      `[Auth] Passwort-Reset fuer ${email}: Token=${passwortResetToken}`,
    );

    return antwort;
  }

  /**
   * Setzt das Passwort mit einem gueltigen Reset-Token zurueck
   */
  async passwortZuruecksetzen(token: string, neuesPasswort: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { passwortResetToken: token },
    });

    if (!benutzer) {
      throw new BadRequestException(
        'Ungueltiger oder abgelaufener Reset-Link. Bitte fordern Sie einen neuen an.',
      );
    }

    if (
      benutzer.passwortResetExpiresAt &&
      benutzer.passwortResetExpiresAt < new Date()
    ) {
      // Token abgelaufen -> loeschen
      await this.prisma.user.update({
        where: { id: benutzer.id },
        data: { passwortResetToken: null, passwortResetExpiresAt: null },
      });
      throw new BadRequestException(
        'Der Reset-Link ist abgelaufen. Bitte fordern Sie einen neuen an.',
      );
    }

    const neuerHash = await bcrypt.hash(neuesPasswort, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: benutzer.id },
      data: {
        passwordHash: neuerHash,
        passwortResetToken: null,
        passwortResetExpiresAt: null,
        // Alle Sessions invalidieren
        refreshToken: null,
      },
    });

    return { nachricht: 'Passwort wurde erfolgreich zurueckgesetzt. Sie koennen sich jetzt anmelden.' };
  }

  // ==================== Google OAuth ====================

  /**
   * Authentifiziert einen Benutzer ueber Google OAuth
   */
  async googleAuth(idToken: string) {
    // Google ID Token verifizieren
    const googlePayload = await this.verifiziereGoogleToken(idToken);

    if (!googlePayload || !googlePayload.email) {
      throw new UnauthorizedException('Ungueltiges Google-Token.');
    }

    const { email, sub: googleId, name } = googlePayload;

    // Benutzer mit Google-ID suchen
    let benutzer = await this.prisma.user.findUnique({
      where: { googleId },
      include: { tenant: true },
    });

    if (benutzer) {
      // Bestehender Google-Benutzer: anmelden
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
          emailVerifiziert: benutzer.emailVerifiziert,
          berechtigungen: benutzer.berechtigungen ?? [],
          vereinsRollen: benutzer.vereinsRollen ?? [],
        },
        tenant: {
          id: benutzer.tenant.id,
          name: benutzer.tenant.name,
          slug: benutzer.tenant.slug,
          logo: benutzer.tenant.logo ?? null,
          primaryColor: benutzer.tenant.primaryColor,
        },
        ...tokens,
        istNeu: false,
      };
    }

    // Benutzer mit E-Mail suchen (bestehender Benutzer der Google verknuepft)
    benutzer = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (benutzer) {
      // Bestehenden Benutzer mit Google verknuepfen + E-Mail verifizieren
      await this.prisma.user.update({
        where: { id: benutzer.id },
        data: {
          googleId,
          emailVerifiziert: true,
          emailVerifyToken: null,
          emailVerifyExpiresAt: null,
        },
      });

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
          emailVerifiziert: true,
          berechtigungen: benutzer.berechtigungen ?? [],
        },
        tenant: {
          id: benutzer.tenant.id,
          name: benutzer.tenant.name,
          slug: benutzer.tenant.slug,
          logo: benutzer.tenant.logo ?? null,
          primaryColor: benutzer.tenant.primaryColor,
        },
        ...tokens,
        istNeu: false,
      };
    }

    // Neuer Benutzer: Verein + Admin erstellen
    const slug = this.generiereSlug(name || email.split('@')[0]);

    const ergebnis = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: name || email.split('@')[0],
          slug,
        },
      });

      const neuerBenutzer = await tx.user.create({
        data: {
          email,
          googleId,
          role: Role.ADMIN,
          tenantId: tenant.id,
          emailVerifiziert: true, // Google verifiziert E-Mail
        },
      });

      return { tenant, benutzer: neuerBenutzer };
    });

    const tokens = await this.generiereTokens(
      ergebnis.benutzer.id,
      ergebnis.benutzer.email,
      ergebnis.benutzer.role,
      ergebnis.tenant.id,
    );
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
        emailVerifiziert: true,
        berechtigungen: ergebnis.benutzer.berechtigungen ?? [],
        vereinsRollen: ergebnis.benutzer.vereinsRollen ?? [],
      },
      tenant: {
        id: ergebnis.tenant.id,
        name: ergebnis.tenant.name,
        slug: ergebnis.tenant.slug,
        logo: ergebnis.tenant.logo ?? null,
        primaryColor: ergebnis.tenant.primaryColor,
      },
      ...tokens,
      istNeu: true,
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

  /**
   * Verifiziert ein Google ID Token ueber die Google API
   */
  private async verifiziereGoogleToken(
    idToken: string,
  ): Promise<{ email: string; sub: string; name?: string } | null> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        email: string;
        sub: string;
        name?: string;
        aud?: string;
      };
      const clientId = this.configService.get<string>('google.clientId');

      // Client-ID pruefen wenn konfiguriert
      if (clientId && data.aud !== clientId) {
        return null;
      }

      return {
        email: data.email,
        sub: data.sub,
        name: data.name,
      };
    } catch {
      return null;
    }
  }

  /**
   * Generiert einen URL-freundlichen Slug aus einem Namen
   */
  private generiereSlug(name: string): string {
    const basis = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40);

    // Zufaellige Zeichen anhaengen um Eindeutigkeit zu gewaehrleisten
    const zufall = crypto.randomBytes(3).toString('hex');
    return `${basis}-${zufall}`;
  }
}
