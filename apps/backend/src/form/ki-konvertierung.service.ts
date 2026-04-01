import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { KiService } from '../ki/ki.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

/** Struktur eines erkannten Formularfelds */
export interface FormularFeld {
  name: string;
  label: string;
  typ: 'text' | 'email' | 'date' | 'select' | 'checkbox' | 'radio' | 'signature';
  pflicht: boolean;
  optionen?: string[];
  // PDF-Position (fuer drawText-Fallback)
  seite?: number;
  x?: number;
  y?: number;
  // Name des Formularfelds im PDF (wenn vorhanden)
  pdfFeldName?: string;
}

/** Analyse-Info ueber ein PDF-Formularfeld */
interface PdfFeldInfo {
  name: string;
  typ: string;
  seite: number;
  x: number;
  y: number;
  breite: number;
  hoehe: number;
}

@Injectable()
export class KiKonvertierungService {
  private readonly logger = new Logger(KiKonvertierungService.name);

  constructor(private kiService: KiService) {}

  /**
   * Analysiert die eingebetteten Formularfelder einer PDF.
   * Gibt Feld-Infos zurueck (Name, Typ, Position, Groesse).
   */
  async pdfFormularfelderAnalysieren(pdfBuffer: Buffer): Promise<PdfFeldInfo[]> {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const felder: PdfFeldInfo[] = [];

    try {
      const form = pdfDoc.getForm();
      const pdfFelder = form.getFields();
      const pages = pdfDoc.getPages();

      for (const feld of pdfFelder) {
        const widgets = feld.acroField.getWidgets();
        for (const widget of widgets) {
          const rect = widget.getRectangle();
          // Seite ermitteln
          const pageRef = widget.P();
          let seiteIdx = 0;
          if (pageRef) {
            seiteIdx = pages.findIndex(
              (p) => p.ref.toString() === pageRef.toString(),
            );
            if (seiteIdx === -1) seiteIdx = 0;
          }

          felder.push({
            name: feld.getName(),
            typ: feld.constructor.name, // PDFTextField, PDFCheckBox, PDFRadioGroup, etc.
            seite: seiteIdx + 1,
            x: rect.x,
            y: rect.y,
            breite: rect.width,
            hoehe: rect.height,
          });
        }
      }
    } catch {
      // PDF hat keine Formularfelder — kein Fehler
    }

    return felder;
  }

  /**
   * Analysiert ein PDF-Formular mit KI und extrahiert die Formularfelder
   * inklusive ungefaehrer Position im PDF.
   * Prueft zuerst auf eingebettete Formularfelder, dann KI-Analyse als Ergaenzung.
   */
  async pdfZuFormular(tenantId: string, pdfBuffer: Buffer, dateiname: string): Promise<FormularFeld[]> {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new BadRequestException('PDF-Datei ist leer.');
    }

    // Schritt 1: Eingebettete Formularfelder analysieren
    const pdfFelder = await this.pdfFormularfelderAnalysieren(pdfBuffer);
    if (pdfFelder.length > 0) {
      this.logger.log(
        `PDF "${dateiname}" hat ${pdfFelder.length} eingebettete Formularfelder: ${pdfFelder.map((f) => f.name).join(', ')}`,
      );
    }

    // Schritt 2: KI-Analyse fuer Labels, Typen und fehlende Felder
    const pdfFelderInfo = pdfFelder.length > 0
      ? `\n\nDas PDF hat folgende eingebettete Formularfelder (nutze diese exakten Namen als pdfFeldName):\n${pdfFelder.map((f) => `- "${f.name}" (${f.typ}, Seite ${f.seite}, x:${Math.round(f.x)} y:${Math.round(f.y)} w:${Math.round(f.breite)} h:${Math.round(f.hoehe)})`).join('\n')}`
      : '';

    const prompt = `Analysiere dieses PDF-Formular (${dateiname}) und extrahiere alle Formularfelder.${pdfFelderInfo}

Fuer jedes Feld gib zurueck:
- name: technischer Name (lowercase, underscore, keine Sonderzeichen)
- label: Beschriftung wie im Formular
- typ: "text", "email", "date", "select", "checkbox", "radio" oder "signature"
- pflicht: true wenn es ein Pflichtfeld ist (markiert mit * oder "Pflichtfeld")
- optionen: bei typ "select" oder "radio" die Auswahloptionen als Array
- seite: Seitennummer (1-basiert) auf der das Feld steht
- x: ungefaehre X-Position in Punkten (0=links, 595=rechts bei A4)
- y: ungefaehre Y-Position in Punkten (0=unten, 842=oben bei A4). Die Position soll auf der gepunkteten Linie liegen wo man schreibt.
- pdfFeldName: exakter Name des eingebetteten PDF-Formularfelds (nur wenn vorhanden, sonst weglassen)

WICHTIG: Wenn das PDF eingebettete Formularfelder hat, verwende deren exakte Namen als pdfFeldName.
Felder ohne eingebettetes Formularfeld bekommen kein pdfFeldName — diese werden per drawText befuellt.

Antworte NUR mit einem JSON-Array, keine Erklaerung. Beispiel:
[{"name":"vorname","label":"Vorname","typ":"text","pflicht":true,"seite":1,"x":280,"y":620,"pdfFeldName":"Vorname"},{"name":"geschlecht","label":"Geschlecht","typ":"radio","pflicht":true,"optionen":["M","W","D"],"seite":1,"x":160,"y":660,"pdfFeldName":"Geschlecht"}]`;

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
   * Generiert ein ausgefuelltes PDF mit Overlay-Technik:
   * 1. Eingebettete Formularfelder befuellen (wenn pdfFeldName vorhanden)
   * 2. Fallback: drawText an x,y-Position
   * 3. Unterschrift als PNG-Overlay
   * 4. form.flatten() zum Abflachen
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
    const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // Formular-Objekt holen (falls vorhanden)
    let form: ReturnType<typeof pdfDoc.getForm> | null = null;
    try {
      form = pdfDoc.getForm();
    } catch {
      // Kein Formular im PDF
    }

    // Felder befuellen
    for (const feld of felder) {
      const wert = daten[feld.name];
      if (wert === undefined || wert === null || wert === '') continue;

      // Methode 1: Eingebettete Formularfelder nutzen (wenn pdfFeldName vorhanden)
      if (feld.pdfFeldName && form) {
        try {
          if (feld.typ === 'checkbox') {
            const cb = form.getCheckBox(feld.pdfFeldName);
            if (wert === true || wert === 'true') {
              cb.check();
            } else {
              cb.uncheck();
            }
            continue;
          }

          if (feld.typ === 'radio') {
            const rg = form.getRadioGroup(feld.pdfFeldName);
            rg.select(String(wert));
            continue;
          }

          // Textfelder (text, email, date, select)
          const tf = form.getTextField(feld.pdfFeldName);
          tf.setText(String(wert));
          continue;
        } catch (err) {
          this.logger.warn(
            `Formularfeld "${feld.pdfFeldName}" konnte nicht befuellt werden, Fallback auf drawText: ${err instanceof Error ? err.message : err}`,
          );
          // Fallthrough zu drawText
        }
      }

      // Methode 2: drawText an x,y-Position (Fallback)
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
          color: rgb(0, 0, 0),
        });
      }
    }

    // Unterschrift als PNG-Overlay einfuegen
    if (signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
      try {
        const base64 = signatureDataUrl.split(',')[1];
        const sigBytes = Buffer.from(base64, 'base64');
        const sigImage = await pdfDoc.embedPng(sigBytes);
        const letzteSeite = pages[pages.length - 1];

        // Signature-Feld Position aus den Feldern suchen
        const sigFeld = felder.find((f) => f.typ === 'signature');
        const sigX = sigFeld?.x || 80;
        const sigY = sigFeld?.y || 60;
        const sigWidth = 200;
        const sigHeight = (sigImage.height / sigImage.width) * sigWidth;

        // Wenn ein PDF-Formularfeld fuer Signatur existiert, dessen Position nutzen
        const sigSeiteIdx = sigFeld ? (sigFeld.seite || pages.length) - 1 : pages.length - 1;
        const sigSeite = pages[Math.min(sigSeiteIdx, pages.length - 1)];

        sigSeite.drawImage(sigImage, {
          x: sigX,
          y: sigY,
          width: sigWidth,
          height: sigHeight,
        });
      } catch {
        this.logger.warn('Unterschrift konnte nicht in PDF eingefuegt werden.');
      }
    }

    // Formular abflachen (nicht mehr editierbar)
    if (form) {
      try {
        form.flatten();
      } catch {
        this.logger.warn('Formular konnte nicht abgeflacht werden.');
      }
    }

    const ausgefuellteBytes = await pdfDoc.save();
    return Buffer.from(ausgefuellteBytes);
  }
}
