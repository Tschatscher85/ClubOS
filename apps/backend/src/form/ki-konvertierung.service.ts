import { Injectable, BadRequestException } from '@nestjs/common';
import { KiService } from '../ki/ki.service';

/** Struktur eines erkannten Formularfelds */
export interface FormularFeld {
  name: string;
  label: string;
  typ: 'text' | 'email' | 'date' | 'select' | 'checkbox';
  pflicht: boolean;
  optionen?: string[];
}

@Injectable()
export class KiKonvertierungService {
  constructor(private kiService: KiService) {}

  /**
   * Analysiert ein PDF-Formular mit KI und extrahiert die Formularfelder.
   */
  async pdfZuFormular(tenantId: string, pdfBuffer: Buffer, dateiname: string): Promise<FormularFeld[]> {
    const prompt = `Analysiere dieses PDF-Formular (${dateiname}) und extrahiere alle Formularfelder.

Fuer jedes Feld gib zurueck:
- name: technischer Name (lowercase, underscore, keine Sonderzeichen)
- label: Beschriftung wie im Formular
- typ: "text", "email", "date", "select" oder "checkbox"
- pflicht: true wenn es ein Pflichtfeld ist (markiert mit * oder "Pflichtfeld")
- optionen: bei typ "select" die Auswahloptionen als Array

Antworte NUR mit einem JSON-Array, keine Erklaerung. Beispiel:
[{"name":"vorname","label":"Vorname","typ":"text","pflicht":true},{"name":"geschlecht","label":"Geschlecht","typ":"select","pflicht":true,"optionen":["Maennlich","Weiblich","Divers"]}]`;

    const antwort = await this.kiService.dokumentAnalysieren(tenantId, pdfBuffer, prompt);

    // JSON aus der Antwort extrahieren (kann in Markdown-Codeblock stehen)
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
}
