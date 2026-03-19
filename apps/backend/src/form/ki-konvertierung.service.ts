import { Injectable, BadRequestException } from '@nestjs/common';
import { KiService } from '../ki/ki.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

/** Struktur eines erkannten Formularfelds */
export interface FormularFeld {
  name: string;
  label: string;
  typ: 'text' | 'email' | 'date' | 'select' | 'checkbox';
  pflicht: boolean;
  optionen?: string[];
  // PDF-Position (fuer Ausfuellung)
  seite?: number;
  x?: number;
  y?: number;
}

@Injectable()
export class KiKonvertierungService {
  constructor(private kiService: KiService) {}

  /**
   * Analysiert ein PDF-Formular mit KI und extrahiert die Formularfelder
   * inklusive ungefaehrer Position im PDF.
   */
  async pdfZuFormular(tenantId: string, pdfBuffer: Buffer, dateiname: string): Promise<FormularFeld[]> {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new BadRequestException('PDF-Datei ist leer.');
    }

    const prompt = `Analysiere dieses PDF-Formular (${dateiname}) und extrahiere alle Formularfelder.

Fuer jedes Feld gib zurueck:
- name: technischer Name (lowercase, underscore, keine Sonderzeichen)
- label: Beschriftung wie im Formular
- typ: "text", "email", "date", "select" oder "checkbox"
- pflicht: true wenn es ein Pflichtfeld ist (markiert mit * oder "Pflichtfeld")
- optionen: bei typ "select" die Auswahloptionen als Array
- seite: Seitennummer (1-basiert) auf der das Feld steht
- x: ungefaehre X-Position in Punkten (0=links, 595=rechts bei A4)
- y: ungefaehre Y-Position in Punkten (0=unten, 842=oben bei A4). Die Position soll auf der gepunkteten Linie liegen wo man schreibt.

Antworte NUR mit einem JSON-Array, keine Erklaerung. Beispiel:
[{"name":"vorname","label":"Vorname","typ":"text","pflicht":true,"seite":1,"x":280,"y":620},{"name":"geschlecht","label":"Geschlecht","typ":"select","pflicht":true,"optionen":["M","W","D"],"seite":1,"x":160,"y":660}]`;

    const antwort = await this.kiService.dokumentAnalysieren(tenantId, pdfBuffer, prompt);

    let jsonText = antwort.text.trim();
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    try {
      const felder: FormularFeld[] = JSON.parse(jsonText);
      return felder;
    } catch {
      throw new BadRequestException(
        'KI-Antwort konnte nicht als JSON verarbeitet werden. Bitte versuchen Sie es erneut.',
      );
    }
  }

  /**
   * Speichert das Original-PDF auf der Festplatte.
   */
  speicherePdf(tenantId: string, templateId: string, pdfBuffer: Buffer): string {
    const uploadDir = path.join(process.cwd(), 'uploads', 'formulare');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const dateiname = `${tenantId}_${templateId}.pdf`;
    const pfad = path.join(uploadDir, dateiname);
    fs.writeFileSync(pfad, pdfBuffer);
    return `/uploads/formulare/${dateiname}`;
  }

  /**
   * Generiert ein ausgefuelltes PDF: Original-PDF + Daten draufgeschrieben.
   */
  async ausgefuelltesPdfGenerieren(
    templatePdfPfad: string,
    felder: FormularFeld[],
    daten: Record<string, unknown>,
    signatureDataUrl?: string,
  ): Promise<Buffer> {
    // Original-PDF laden
    const absoluterPfad = path.join(process.cwd(), templatePdfPfad);
    if (!fs.existsSync(absoluterPfad)) {
      throw new BadRequestException('Original-PDF nicht gefunden.');
    }
    const originalBytes = fs.readFileSync(absoluterPfad);
    const pdfDoc = await PDFDocument.load(originalBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // Felder auf das PDF schreiben
    for (const feld of felder) {
      const wert = daten[feld.name];
      if (wert === undefined || wert === null || wert === '') continue;

      const seiteIdx = (feld.seite || 1) - 1;
      if (seiteIdx < 0 || seiteIdx >= pages.length) continue;

      const seite = pages[seiteIdx];
      const x = feld.x || 100;
      const y = feld.y || 400;

      let text = '';
      if (feld.typ === 'checkbox') {
        text = wert === true || wert === 'true' ? 'X' : '';
      } else {
        text = String(wert);
      }

      if (text) {
        const fontSize = feld.typ === 'checkbox' ? 12 : 10;
        seite.drawText(text, {
          x,
          y,
          size: fontSize,
          font: helvetica,
          color: rgb(0, 0, 0.6),
        });
      }
    }

    // Unterschrift einfuegen (auf letzter Seite unten)
    if (signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
      try {
        const base64 = signatureDataUrl.split(',')[1];
        const sigBytes = Buffer.from(base64, 'base64');
        const sigImage = await pdfDoc.embedPng(sigBytes);
        const letzteSeite = pages[pages.length - 1];
        const sigWidth = 200;
        const sigHeight = (sigImage.height / sigImage.width) * sigWidth;

        letzteSeite.drawImage(sigImage, {
          x: 80,
          y: 60,
          width: sigWidth,
          height: sigHeight,
        });
      } catch {
        // Unterschrift konnte nicht eingefuegt werden - ignorieren
      }
    }

    const ausgefuellteBytes = await pdfDoc.save();
    return Buffer.from(ausgefuellteBytes);
  }
}
