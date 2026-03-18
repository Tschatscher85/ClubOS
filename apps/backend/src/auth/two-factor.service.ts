import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import {
  generateSecret,
  generateSync,
  generateURI,
  verifySync,
  NobleCryptoPlugin,
  ScureBase32Plugin,
} from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS } from '@clubos/shared';

// TOTP-Plugins initialisieren
const totpCrypto = new NobleCryptoPlugin();
const totpBase32 = new ScureBase32Plugin();

@Injectable()
export class TwoFactorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Richtet 2FA fuer einen Benutzer ein (generiert Secret + QR-Code + Backup-Codes)
   * twoFactorEnabled bleibt false bis bestaetigen() aufgerufen wird
   */
  async einrichten(userId: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!benutzer) {
      throw new BadRequestException('Benutzer nicht gefunden.');
    }

    if (benutzer.twoFactorEnabled) {
      throw new BadRequestException(
        '2-Faktor-Authentifizierung ist bereits aktiviert. Bitte deaktivieren Sie sie zuerst.',
      );
    }

    // Secret generieren
    const secret = generateSecret();

    // OTP-Auth URL erstellen
    const otpauthUrl = generateURI({
      issuer: 'ClubOS',
      label: benutzer.email,
      secret,
    });

    // QR-Code als Base64-PNG generieren
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // 8 Backup-Codes generieren
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex'),
    );

    // Backup-Codes hashen
    const gehashteCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, BCRYPT_ROUNDS)),
    );

    // Secret + gehashte Backup-Codes speichern (twoFactorEnabled bleibt false)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        backupCodes: gehashteCodes,
      },
    });

    return {
      qrCode,
      secret,
      backupCodes,
    };
  }

  /**
   * Bestaetigt die 2FA-Einrichtung mit dem ersten TOTP-Code
   */
  async bestaetigen(userId: string, token: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!benutzer) {
      throw new BadRequestException('Benutzer nicht gefunden.');
    }

    if (!benutzer.twoFactorSecret) {
      throw new BadRequestException(
        '2FA wurde noch nicht eingerichtet. Bitte starten Sie die Einrichtung zuerst.',
      );
    }

    if (benutzer.twoFactorEnabled) {
      throw new BadRequestException(
        '2-Faktor-Authentifizierung ist bereits aktiviert.',
      );
    }

    const ergebnis = verifySync({
      token,
      secret: benutzer.twoFactorSecret,
      crypto: totpCrypto,
      base32: totpBase32,
    });

    if (!ergebnis.valid) {
      throw new BadRequestException(
        'Ungueltiger Code. Bitte versuchen Sie es erneut.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { nachricht: '2-Faktor-Authentifizierung wurde erfolgreich aktiviert.' };
  }

  /**
   * Verifiziert einen TOTP-Code oder Backup-Code waehrend des Logins
   */
  async verifizieren(userId: string, code: string): Promise<boolean> {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!benutzer || !benutzer.twoFactorSecret || !benutzer.twoFactorEnabled) {
      return false;
    }

    // Zuerst TOTP-Verifikation versuchen
    const totpErgebnis = verifySync({
      token: code,
      secret: benutzer.twoFactorSecret,
      crypto: totpCrypto,
      base32: totpBase32,
    });

    if (totpErgebnis.valid) {
      return true;
    }

    // Falls TOTP fehlschlaegt, Backup-Codes pruefen
    for (let i = 0; i < benutzer.backupCodes.length; i++) {
      const stimmt = await bcrypt.compare(code, benutzer.backupCodes[i]);
      if (stimmt) {
        // Verwendeten Backup-Code entfernen
        const aktualisiereCodes = [...benutzer.backupCodes];
        aktualisiereCodes.splice(i, 1);
        await this.prisma.user.update({
          where: { id: userId },
          data: { backupCodes: aktualisiereCodes },
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Deaktiviert 2FA fuer einen Benutzer
   */
  async deaktivieren(userId: string) {
    const benutzer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!benutzer) {
      throw new BadRequestException('Benutzer nicht gefunden.');
    }

    if (!benutzer.twoFactorEnabled) {
      throw new BadRequestException(
        '2-Faktor-Authentifizierung ist nicht aktiviert.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    return { nachricht: '2-Faktor-Authentifizierung wurde deaktiviert.' };
  }
}
