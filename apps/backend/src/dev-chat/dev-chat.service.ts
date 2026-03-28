import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const PROJEKT_ROOT = '/home/tschatscher/clubos';
const CHAT_DATA_DIR = path.join(PROJEKT_ROOT, 'data', 'dev-chat');

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

/** Gespeicherte Nachricht */
interface GespeicherteNachricht {
  id: string;
  rolle: 'user' | 'assistant';
  inhalt: string;
  bilder?: string[]; // base64 data-URLs fuer User-Bilder
  werkzeuge?: Array<{
    name: string;
    eingabe: unknown;
    ergebnis?: string;
    fehler?: boolean;
  }>;
  zeitpunkt: string;
}

/** Session-Daten auf Disk */
interface SessionDaten {
  sessionId: string | null;
  nachrichten: GespeicherteNachricht[];
}

@Injectable()
export class DevChatService {
  private readonly logger = new Logger(DevChatService.name);

  constructor() {
    // Data-Verzeichnis sicherstellen
    if (!fs.existsSync(CHAT_DATA_DIR)) {
      fs.mkdirSync(CHAT_DATA_DIR, { recursive: true });
    }
  }

  // ==================== Persistence ====================

  private sessionDateiPfad(userId: string): string {
    return path.join(CHAT_DATA_DIR, `session-${userId}.json`);
  }

  private sessionLaden(userId: string): SessionDaten {
    const pfad = this.sessionDateiPfad(userId);
    try {
      if (fs.existsSync(pfad)) {
        return JSON.parse(fs.readFileSync(pfad, 'utf-8'));
      }
    } catch (err) {
      this.logger.warn(`Session-Datei lesen fehlgeschlagen: ${err}`);
    }
    return { sessionId: null, nachrichten: [] };
  }

  private sessionSpeichern(userId: string, daten: SessionDaten): void {
    const pfad = this.sessionDateiPfad(userId);
    try {
      fs.writeFileSync(pfad, JSON.stringify(daten, null, 2), 'utf-8');
    } catch (err) {
      this.logger.warn(`Session-Datei schreiben fehlgeschlagen: ${err}`);
    }
  }

  /** Chat-Verlauf laden */
  verlaufLaden(userId: string): GespeicherteNachricht[] {
    return this.sessionLaden(userId).nachrichten;
  }

  /** Chat-Verlauf loeschen (neue Session) */
  verlaufLoeschen(userId: string): void {
    const pfad = this.sessionDateiPfad(userId);
    try {
      if (fs.existsSync(pfad)) {
        fs.unlinkSync(pfad);
      }
    } catch {
      // Ignorieren
    }
  }

  /**
   * Verarbeitet eine Nachricht ueber die Claude CLI (Abo, kein API-Key noetig).
   * Liefert SSE-Events als async Generator.
   */
  async *verarbeiteNachricht(
    userId: string,
    nachricht: string,
    bilder?: BildInfo[],
    signal?: AbortSignal,
  ): AsyncGenerator<DevChatEvent> {
    const session = this.sessionLaden(userId);

    // CLI-Argumente
    const args = [
      '-p',
      '--output-format',
      'stream-json',
      '--dangerously-skip-permissions',
    ];

    // Bestehende Session fortsetzen
    if (session.sessionId) {
      args.push('--resume', session.sessionId);
    }

    // Bilder als Temp-Dateien speichern und im Prompt erwaehnen
    let vollNachricht = nachricht;
    const tempDateien: string[] = [];
    const bilderVorschau: string[] = []; // data-URLs fuer Persistence

    if (bilder && bilder.length > 0) {
      for (let i = 0; i < bilder.length; i++) {
        const ext = bilder[i].typ.split('/')[1] || 'png';
        const tempPfad = `/tmp/dev-chat-${Date.now()}-${i}.${ext}`;
        fs.writeFileSync(tempPfad, Buffer.from(bilder[i].daten, 'base64'));
        tempDateien.push(tempPfad);
        bilderVorschau.push(`data:${bilder[i].typ};base64,${bilder[i].daten.slice(0, 100)}...`);
      }

      // Bilder im Prompt klar referenzieren damit Claude sie mit Read liest
      const bildPfade = tempDateien.map((p) => p).join(', ');
      vollNachricht = `[Der User hat ${tempDateien.length} Bild(er) angehaengt. Lies sie mit dem Read-Tool: ${bildPfade}]\n\n${nachricht}`;
    }

    args.push(vollNachricht);

    // User-Nachricht in Verlauf speichern
    const userNachricht: GespeicherteNachricht = {
      id: Date.now().toString(),
      rolle: 'user',
      inhalt: nachricht,
      bilder:
        bilder && bilder.length > 0
          ? bilder.map((b) => `data:${b.typ};base64,${b.daten}`)
          : undefined,
      zeitpunkt: new Date().toISOString(),
    };
    session.nachrichten.push(userNachricht);
    this.sessionSpeichern(userId, session);

    // Claude CLI als Subprozess starten
    this.logger.log(`Dev-Chat: Starte claude CLI fuer User ${userId}`);
    const proc = spawn('claude', args, {
      cwd: PROJEKT_ROOT,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Bei Client-Abbruch Prozess beenden
    const abortHandler = () => {
      this.logger.log('Dev-Chat: Client hat abgebrochen, beende CLI');
      proc.kill('SIGTERM');
    };
    if (signal) {
      signal.addEventListener('abort', abortHandler);
    }

    let gesamtText = '';
    const werkzeuge: Array<{
      name: string;
      eingabe: unknown;
      ergebnis?: string;
      fehler?: boolean;
    }> = [];

    try {
      // stderr loggen (fuer Debugging)
      let stderrBuffer = '';
      proc.stderr?.on('data', (chunk: Buffer) => {
        stderrBuffer += chunk.toString();
      });

      // stdout zeilenweise als JSON parsen
      const rl = createInterface({ input: proc.stdout });
      let letzterWerkzeugName = '';

      for await (const zeile of rl) {
        if (signal?.aborted) break;
        if (!zeile.trim()) continue;

        try {
          const event = JSON.parse(zeile);

          // Events konvertieren und weiterleiten
          for (const sseEvent of this.eventKonvertieren(
            event,
            userId,
            session,
            letzterWerkzeugName,
          )) {
            // Text und Werkzeuge tracken
            if (sseEvent.typ === 'text') {
              gesamtText += sseEvent.daten as string;
            } else if (sseEvent.typ === 'werkzeug_start') {
              const d = sseEvent.daten as { name: string; eingabe: unknown };
              werkzeuge.push({ name: d.name, eingabe: d.eingabe });
            } else if (sseEvent.typ === 'werkzeug_ergebnis') {
              const d = sseEvent.daten as {
                name: string;
                ergebnis: string;
                fehler: boolean;
              };
              const idx = werkzeuge.findIndex(
                (w) => w.name === d.name && !w.ergebnis,
              );
              if (idx >= 0) {
                werkzeuge[idx].ergebnis = d.ergebnis;
                werkzeuge[idx].fehler = d.fehler;
              }
            }

            yield sseEvent;
          }

          // Letzten Werkzeug-Namen tracken fuer tool_result Events
          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_use') {
                letzterWerkzeugName = block.name || '';
              }
            }
          }
        } catch {
          // Nicht-JSON Zeilen ignorieren (z.B. Warnings)
        }
      }

      // Auf Prozess-Ende warten
      await new Promise<void>((resolve) => {
        if (proc.exitCode !== null) {
          resolve();
        } else {
          proc.on('close', () => resolve());
        }
      });

      // Stderr loggen falls es Fehler gab
      if (stderrBuffer.trim()) {
        this.logger.warn(`Dev-Chat stderr: ${stderrBuffer.slice(0, 500)}`);
      }
    } catch (err: unknown) {
      const fehlerText =
        err instanceof Error ? err.message : 'Unbekannter Fehler';
      this.logger.error(`Dev-Chat CLI Fehler: ${fehlerText}`);
      gesamtText += `\n\nFehler: ${fehlerText}`;
      yield { typ: 'fehler', daten: fehlerText };
    } finally {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
      // Temp-Dateien aufraeumen
      for (const pfad of tempDateien) {
        try {
          fs.unlinkSync(pfad);
        } catch {
          // Ignorieren
        }
      }
    }

    // Assistenten-Nachricht in Verlauf speichern
    if (gesamtText.trim()) {
      const assistantNachricht: GespeicherteNachricht = {
        id: (Date.now() + 1).toString(),
        rolle: 'assistant',
        inhalt: gesamtText,
        werkzeuge: werkzeuge.length > 0 ? werkzeuge : undefined,
        zeitpunkt: new Date().toISOString(),
      };

      // Session nochmal laden (koennte sich geaendert haben)
      const aktuell = this.sessionLaden(userId);
      aktuell.nachrichten.push(assistantNachricht);
      this.sessionSpeichern(userId, aktuell);
    }

    yield { typ: 'fertig' };
  }

  // ==================== Event-Konvertierung ====================

  private *eventKonvertieren(
    event: Record<string, unknown>,
    userId: string,
    session: SessionDaten,
    letzterWerkzeugName: string,
  ): Generator<DevChatEvent> {
    const eventType = event.type as string;

    switch (eventType) {
      case 'system': {
        const sid = (event as Record<string, unknown>).session_id as
          | string
          | undefined;
        if (sid) {
          session.sessionId = sid;
          this.sessionSpeichern(userId, session);
          this.logger.log(`Dev-Chat: Session ${sid} fuer User ${userId}`);
        }
        break;
      }

      case 'assistant': {
        const message = (event as Record<string, unknown>).message as
          | Record<string, unknown>
          | undefined;
        const content = message?.content as
          | Array<Record<string, unknown>>
          | undefined;

        if (content && Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text' && block.text) {
              yield { typ: 'text', daten: block.text as string };
            } else if (block.type === 'tool_use') {
              yield {
                typ: 'werkzeug_start',
                daten: {
                  name: (block.name as string) || 'Werkzeug',
                  eingabe: this.eingabeKuerzen(block.input),
                },
              };
            }
          }
        }

        // Session-ID updaten
        const sid = (event as Record<string, unknown>).session_id as
          | string
          | undefined;
        if (sid) {
          session.sessionId = sid;
          this.sessionSpeichern(userId, session);
        }
        break;
      }

      case 'tool_result':
      case 'tool_output': {
        const ergebnis =
          ((event as Record<string, unknown>).content as string) ||
          ((event as Record<string, unknown>).result as string) ||
          ((event as Record<string, unknown>).output as string) ||
          '';
        const ergebnisText =
          typeof ergebnis === 'string' ? ergebnis : JSON.stringify(ergebnis);

        yield {
          typ: 'werkzeug_ergebnis',
          daten: {
            name:
              ((event as Record<string, unknown>).name as string) ||
              ((event as Record<string, unknown>).tool_name as string) ||
              letzterWerkzeugName ||
              'Werkzeug',
            ergebnis: ergebnisText.slice(0, 2000),
            fehler: !!(event as Record<string, unknown>).is_error,
          },
        };
        break;
      }

      case 'result': {
        const sid = (event as Record<string, unknown>).session_id as
          | string
          | undefined;
        if (sid) {
          session.sessionId = sid;
          this.sessionSpeichern(userId, session);
        }
        break;
      }
    }
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
}
