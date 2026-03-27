import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PROJEKT_ROOT = '/home/tschatscher/clubos';
const MAX_VERLAUF = 60; // Maximal 60 Nachrichten im Verlauf
const MAX_DURCHLAEUFE = 25; // Maximal 25 Tool-Use-Schleifen
const BEFEHL_TIMEOUT = 120_000; // 2 Minuten fuer Shell-Befehle
const MAX_AUSGABE = 50_000; // Max 50k Zeichen pro Tool-Ergebnis

/** SSE Event das an den Client gesendet wird */
export interface DevChatEvent {
  typ: 'text' | 'werkzeug_start' | 'werkzeug_ergebnis' | 'fertig' | 'fehler';
  daten?: unknown;
}

/** Bild-Info vom Client */
export interface BildInfo {
  typ: string; // z.B. 'image/png'
  daten: string; // base64-encoded
}

/** Werkzeug-Definitionen fuer Claude */
const WERKZEUGE: Anthropic.Tool[] = [
  {
    name: 'datei_lesen',
    description:
      'Liest den Inhalt einer Datei im Vereinbase-Projekt oder auf dem Server.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pfad: {
          type: 'string',
          description:
            'Pfad zur Datei (relativ zum Projektroot /home/tschatscher/clubos oder absolut)',
        },
      },
      required: ['pfad'],
    },
  },
  {
    name: 'datei_schreiben',
    description: 'Erstellt oder ueberschreibt eine Datei mit dem angegebenen Inhalt.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pfad: {
          type: 'string',
          description: 'Pfad zur Datei',
        },
        inhalt: {
          type: 'string',
          description: 'Der komplette Inhalt der Datei',
        },
      },
      required: ['pfad', 'inhalt'],
    },
  },
  {
    name: 'datei_bearbeiten',
    description:
      'Ersetzt einen exakten Textabschnitt in einer Datei durch neuen Text. Der alte Text muss exakt uebereinstimmen.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pfad: {
          type: 'string',
          description: 'Pfad zur Datei',
        },
        alter_text: {
          type: 'string',
          description: 'Der exakte Text der ersetzt werden soll',
        },
        neuer_text: {
          type: 'string',
          description: 'Der neue Text',
        },
      },
      required: ['pfad', 'alter_text', 'neuer_text'],
    },
  },
  {
    name: 'befehl_ausfuehren',
    description:
      'Fuehrt einen Shell-Befehl auf dem Server aus. Nuetzlich fuer git, npm, pm2, builds etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        befehl: {
          type: 'string',
          description: 'Der auszufuehrende Shell-Befehl',
        },
        verzeichnis: {
          type: 'string',
          description:
            'Arbeitsverzeichnis (optional, Standard: Projektroot)',
        },
      },
      required: ['befehl'],
    },
  },
  {
    name: 'dateien_suchen',
    description:
      'Sucht nach Dateien (nach Name) oder nach Textinhalten in Dateien im Projekt.',
    input_schema: {
      type: 'object' as const,
      properties: {
        muster: {
          type: 'string',
          description:
            'Suchmuster - Glob-Pattern fuer Dateinamen (z.B. "*.controller.ts") oder Regex fuer Inhalte',
        },
        typ: {
          type: 'string',
          enum: ['dateiname', 'inhalt'],
          description: 'Art der Suche: dateiname oder inhalt',
        },
        verzeichnis: {
          type: 'string',
          description: 'Suchverzeichnis relativ zum Projektroot (optional)',
        },
      },
      required: ['muster', 'typ'],
    },
  },
  {
    name: 'verzeichnis_listen',
    description: 'Listet alle Dateien und Ordner in einem Verzeichnis auf.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pfad: {
          type: 'string',
          description: 'Pfad zum Verzeichnis',
        },
      },
      required: ['pfad'],
    },
  },
];

@Injectable()
export class DevChatService {
  private readonly logger = new Logger(DevChatService.name);
  private readonly verlaufMap = new Map<string, Anthropic.MessageParam[]>();
  private systemPromptCache: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verarbeitet eine Nachricht und liefert SSE-Events als async Generator.
   */
  async *verarbeiteNachricht(
    userId: string,
    nachricht: string,
    bilder?: BildInfo[],
    signal?: AbortSignal,
  ): AsyncGenerator<DevChatEvent> {
    const verlauf = this.verlaufHolen(userId);

    // User-Nachricht mit optionalen Bildern aufbauen
    const content: Anthropic.ContentBlockParam[] = [];

    if (bilder && bilder.length > 0) {
      for (const bild of bilder) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: bild.typ as
              | 'image/png'
              | 'image/jpeg'
              | 'image/gif'
              | 'image/webp',
            data: bild.daten,
          },
        });
      }
    }

    content.push({ type: 'text', text: nachricht });
    verlauf.push({ role: 'user', content });

    // API-Key und Client
    const apiKey = await this.apiKeyHolen();
    const client = new Anthropic({ apiKey });
    const systemPrompt = this.systemPromptLaden();

    // Tool-Use-Schleife
    let durchlaeufe = 0;

    while (durchlaeufe < MAX_DURCHLAEUFE) {
      if (signal?.aborted) return;
      durchlaeufe++;

      try {
        const antwort = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: systemPrompt,
          tools: WERKZEUGE,
          messages: verlauf,
        });

        // Assistenten-Antwort zum Verlauf hinzufuegen
        verlauf.push({
          role: 'assistant',
          content: antwort.content as Anthropic.ContentBlockParam[],
        });

        // Content-Bloecke verarbeiten
        const werkzeugErgebnisse: Anthropic.ToolResultBlockParam[] = [];

        for (const block of antwort.content) {
          if (signal?.aborted) return;

          if (block.type === 'text') {
            yield { typ: 'text', daten: block.text };
          } else if (block.type === 'tool_use') {
            // Werkzeug-Start melden
            yield {
              typ: 'werkzeug_start',
              daten: {
                name: block.name,
                eingabe: this.eingabeKuerzen(block.input),
              },
            };

            // Werkzeug ausfuehren
            const ergebnis = await this.werkzeugAusfuehren(
              block.name,
              block.input as Record<string, unknown>,
            );

            yield {
              typ: 'werkzeug_ergebnis',
              daten: {
                name: block.name,
                ergebnis: ergebnis.text.slice(0, 2000), // Gekuerztes Ergebnis fuer UI
                fehler: ergebnis.fehler,
              },
            };

            werkzeugErgebnisse.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: ergebnis.text,
              is_error: ergebnis.fehler,
            });
          }
        }

        // Wenn keine Werkzeuge verwendet wurden oder end_turn: fertig
        if (
          werkzeugErgebnisse.length === 0 ||
          antwort.stop_reason === 'end_turn'
        ) {
          break;
        }

        // Werkzeug-Ergebnisse zum Verlauf hinzufuegen und weitermachen
        verlauf.push({ role: 'user', content: werkzeugErgebnisse });
      } catch (err: unknown) {
        const fehlerText =
          err instanceof Error ? err.message : 'Unbekannter Fehler';
        this.logger.error(`Dev-Chat Fehler: ${fehlerText}`);
        yield { typ: 'fehler', daten: fehlerText };
        break;
      }
    }

    // Verlauf kuerzen wenn zu lang
    if (verlauf.length > MAX_VERLAUF) {
      const gekuerzt = verlauf.slice(-MAX_VERLAUF);
      this.verlaufMap.set(userId, gekuerzt);
    }

    yield { typ: 'fertig' };
  }

  /** Chat-Verlauf loeschen */
  verlaufLoeschen(userId: string): void {
    this.verlaufMap.delete(userId);
  }

  // ==================== Private Methoden ====================

  /** Verlauf fuer einen User holen oder erstellen */
  private verlaufHolen(userId: string): Anthropic.MessageParam[] {
    if (!this.verlaufMap.has(userId)) {
      this.verlaufMap.set(userId, []);
    }
    return this.verlaufMap.get(userId)!;
  }

  /** System-Prompt aus CLAUDE.md laden und cachen */
  private systemPromptLaden(): string {
    if (this.systemPromptCache) return this.systemPromptCache;

    let claudeMd = '';
    try {
      claudeMd = fs.readFileSync(
        path.join(PROJEKT_ROOT, 'CLAUDE.md'),
        'utf-8',
      );
    } catch {
      claudeMd = '(CLAUDE.md konnte nicht geladen werden)';
    }

    this.systemPromptCache = `Du bist ein erfahrener Entwickler-Assistent fuer die Vereinbase SaaS-Plattform.
Du hilfst dem Entwickler beim Programmieren, Debuggen und Verbessern der Anwendung.
Du kannst Dateien lesen, schreiben, bearbeiten und Shell-Befehle ausfuehren.

PROJEKT-ROOT: ${PROJEKT_ROOT} (Turborepo Monorepo)
- Frontend: apps/frontend (Next.js 14, App Router, shadcn/ui, Tailwind CSS)
- Backend: apps/backend (NestJS, Prisma, PostgreSQL)
- Shared: packages/shared

WICHTIGE REGELN:
- Alle UI-Texte auf Deutsch
- Verwende ae, oe, ue statt ae, oe, ue in Code und Kommentaren (wegen Server-Encoding)
- TypeScript strict mode - kein 'any' wo vermeidbar
- Bestehende Patterns und Konventionen im Projekt folgen
- IMMER Dateien lesen bevor du sie bearbeitest
- Aenderungen klar erklaeren
- Nach Code-Aenderungen: Build + PM2 Restart vorschlagen

BUILD & DEPLOY:
- Frontend Build: npx turbo build --filter=@vereinbase/frontend
- Backend Build: npm run build --workspace=apps/backend
- Frontend Restart: pm2 restart vereinbase-frontend
- Backend Restart: pm2 restart vereinbase-backend
- Git: git add + commit + push

VERFUEGBARE WERKZEUGE:
- datei_lesen: Dateien lesen (relativ zu ${PROJEKT_ROOT} oder absolut)
- datei_schreiben: Dateien erstellen/ueberschreiben
- datei_bearbeiten: Exakten Text in Dateien ersetzen
- befehl_ausfuehren: Shell-Befehle ausfuehren (git, npm, pm2, etc.)
- dateien_suchen: Nach Dateien oder Textinhalten suchen
- verzeichnis_listen: Verzeichnisinhalt anzeigen

KONTEXT ZUM PROJEKT:
${claudeMd}`;

    return this.systemPromptCache;
  }

  /** API-Key aus PlattformConfig oder .env laden */
  private async apiKeyHolen(): Promise<string> {
    // 1. PlattformConfig aus DB
    try {
      const config = await this.prisma.plattformConfig.findUnique({
        where: { id: 'singleton' },
        select: { anthropicApiKey: true },
      });
      if (config?.anthropicApiKey) return config.anthropicApiKey;
    } catch {
      // Tabelle existiert evtl. noch nicht
    }

    // 2. Environment Variable
    const envKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (envKey) return envKey;

    throw new Error(
      'Kein Anthropic API-Key konfiguriert. Bitte im Admin-Dashboard unter KI-Einstellungen oder in der .env setzen.',
    );
  }

  /** Pfad relativ zum Projektroot oder absolut aufloesen */
  private pfadAufloesen(pfad: string): string {
    if (path.isAbsolute(pfad)) return pfad;
    return path.join(PROJEKT_ROOT, pfad);
  }

  /** Werkzeug-Eingabe fuer die UI kuerzen */
  private eingabeKuerzen(eingabe: unknown): unknown {
    if (typeof eingabe !== 'object' || !eingabe) return eingabe;
    const gekuerzt: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      eingabe as Record<string, unknown>,
    )) {
      if (typeof value === 'string' && value.length > 200) {
        gekuerzt[key] = value.slice(0, 200) + '...';
      } else {
        gekuerzt[key] = value;
      }
    }
    return gekuerzt;
  }

  /** Ein Werkzeug ausfuehren und Ergebnis zurueckgeben */
  private async werkzeugAusfuehren(
    name: string,
    eingabe: Record<string, unknown>,
  ): Promise<{ text: string; fehler: boolean }> {
    try {
      switch (name) {
        case 'datei_lesen': {
          const pfad = this.pfadAufloesen(eingabe.pfad as string);
          const inhalt = await fs.promises.readFile(pfad, 'utf-8');
          return { text: inhalt.slice(0, MAX_AUSGABE), fehler: false };
        }

        case 'datei_schreiben': {
          const pfad = this.pfadAufloesen(eingabe.pfad as string);
          await fs.promises.mkdir(path.dirname(pfad), { recursive: true });
          await fs.promises.writeFile(pfad, eingabe.inhalt as string, 'utf-8');
          return { text: `Datei geschrieben: ${pfad}`, fehler: false };
        }

        case 'datei_bearbeiten': {
          const pfad = this.pfadAufloesen(eingabe.pfad as string);
          let inhalt = await fs.promises.readFile(pfad, 'utf-8');
          const alterText = eingabe.alter_text as string;
          const neuerText = eingabe.neuer_text as string;

          if (!inhalt.includes(alterText)) {
            return {
              text: `Der angegebene Text wurde nicht in ${pfad} gefunden. Bitte pruefe den exakten Text.`,
              fehler: true,
            };
          }

          inhalt = inhalt.replace(alterText, neuerText);
          await fs.promises.writeFile(pfad, inhalt, 'utf-8');
          return { text: `Datei bearbeitet: ${pfad}`, fehler: false };
        }

        case 'befehl_ausfuehren': {
          const cwd = eingabe.verzeichnis
            ? this.pfadAufloesen(eingabe.verzeichnis as string)
            : PROJEKT_ROOT;

          const { stdout, stderr } = await execAsync(
            eingabe.befehl as string,
            {
              cwd,
              timeout: BEFEHL_TIMEOUT,
              maxBuffer: 1024 * 1024 * 5, // 5MB Buffer
              env: { ...process.env, FORCE_COLOR: '0' },
            },
          );

          let ausgabe = stdout || '';
          if (stderr) ausgabe += `\nSTDERR:\n${stderr}`;
          return {
            text: ausgabe.slice(0, MAX_AUSGABE) || '(keine Ausgabe)',
            fehler: false,
          };
        }

        case 'dateien_suchen': {
          const suchVerzeichnis = eingabe.verzeichnis
            ? this.pfadAufloesen(eingabe.verzeichnis as string)
            : PROJEKT_ROOT;
          const muster = eingabe.muster as string;

          if (eingabe.typ === 'dateiname') {
            const { stdout } = await execAsync(
              `find . -name "${muster}" -not -path "*/node_modules/*" -not -path "*/.next/*" -type f | head -50`,
              { cwd: suchVerzeichnis, timeout: 15_000 },
            );
            return {
              text: stdout || 'Keine Dateien gefunden.',
              fehler: false,
            };
          } else {
            const { stdout } = await execAsync(
              `grep -rn "${muster}" . --include="*.ts" --include="*.tsx" --include="*.json" --include="*.prisma" --include="*.css" --exclude-dir=node_modules --exclude-dir=.next | head -80`,
              { cwd: suchVerzeichnis, timeout: 15_000 },
            );
            return {
              text: stdout || 'Keine Treffer gefunden.',
              fehler: false,
            };
          }
        }

        case 'verzeichnis_listen': {
          const pfad = this.pfadAufloesen(eingabe.pfad as string);
          const eintraege = await fs.promises.readdir(pfad, {
            withFileTypes: true,
          });
          const liste = eintraege
            .sort((a, b) => {
              // Ordner zuerst, dann alphabetisch
              if (a.isDirectory() && !b.isDirectory()) return -1;
              if (!a.isDirectory() && b.isDirectory()) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((e) => `${e.isDirectory() ? '[DIR]' : '     '} ${e.name}`)
            .join('\n');
          return { text: liste || '(leeres Verzeichnis)', fehler: false };
        }

        default:
          return { text: `Unbekanntes Werkzeug: ${name}`, fehler: true };
      }
    } catch (err: unknown) {
      const fehlerText =
        err instanceof Error ? err.message : 'Unbekannter Fehler';
      this.logger.error(`Werkzeug ${name} fehlgeschlagen: ${fehlerText}`);
      return { text: `Fehler: ${fehlerText}`, fehler: true };
    }
  }
}
