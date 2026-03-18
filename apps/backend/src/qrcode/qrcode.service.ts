import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrcodeService {
  /**
   * Generiert einen QR-Code fuer den digitalen Mitgliedsausweis.
   * Kodiert Mitglieds-ID, Mitgliedsnummer und Vereinsname als JSON.
   */
  async mitgliedsausweisGenerieren(
    memberId: string,
    memberNumber: string,
    vereinsname: string,
  ): Promise<string> {
    const payload = JSON.stringify({
      typ: 'mitglied',
      id: memberId,
      nr: memberNumber,
      verein: vereinsname,
    });

    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });
  }

  /**
   * Generiert einen QR-Code fuer die oeffentliche Turnier-URL.
   * Wird z.B. auf der Leinwand oder als Ausdruck angezeigt.
   */
  async turnierQrGenerieren(publicUrl: string): Promise<string> {
    return QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
    });
  }

  /**
   * Generiert einen QR-Code fuer die schnelle Event-Anmeldung per Token-URL.
   */
  async eventTokenQrGenerieren(tokenUrl: string): Promise<string> {
    return QRCode.toDataURL(tokenUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });
  }
}
