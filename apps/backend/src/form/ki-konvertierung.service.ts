import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

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
  private client: Anthropic | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  /**
   * Analysiert ein PDF-Formular mit KI und extrahiert die Formularfelder.
   */
  async pdfZuFormular(pdfBuffer: Buffer, dateiname: string): Promise<FormularFeld[]> {
    if (!this.client) {
      throw new BadRequestException(
        'KI-Konvertierung ist nicht konfiguriert. ANTHROPIC_API_KEY fehlt.',
      );
    }

    const base64 = pdfBuffer.toString('base64');

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analysiere dieses PDF-Formular (${dateiname}) und extrahiere alle Formularfelder.

Fuer jedes Feld gib zurueck:
- name: technischer Name (lowercase, underscore, keine Sonderzeichen)
- label: Beschriftung wie im Formular
- typ: "text", "email", "date", "select" oder "checkbox"
- pflicht: true wenn es ein Pflichtfeld ist (markiert mit * oder "Pflichtfeld")
- optionen: bei typ "select" die Auswahloptionen als Array

Antworte NUR mit einem JSON-Array, keine Erklaerung. Beispiel:
[{"name":"vorname","label":"Vorname","typ":"text","pflicht":true},{"name":"geschlecht","label":"Geschlecht","typ":"select","pflicht":true,"optionen":["Maennlich","Weiblich","Divers"]}]`,
            },
          ],
        },
      ],
    });

    // Antwort parsen
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    if (!textBlock) {
      throw new BadRequestException('KI konnte das Formular nicht analysieren.');
    }

    // JSON aus der Antwort extrahieren (kann in Markdown-Codeblock stehen)
    let jsonText = textBlock.text.trim();
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
