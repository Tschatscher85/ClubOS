import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import * as fs from 'fs';

const PROJEKT_ROOT = '/home/tschatscher/clubos';

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

@Injectable()
export class DevChatService {
  private readonly logger = new Logger(DevChatService.name);
  /** Session-ID pro User fuer --resume */
  private readonly sessionMap = new Map<string, string>();

  /** Chat-Verlauf loeschen (neue Session) */
  verlaufLoeschen(userId: string): void {
    this.sessionMap.delete(userId);
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
    // CLI-Argumente
    const args = ['-p', '--output-format', 'stream-json', '--verbose'];

    // Bestehende Session fortsetzen
    const sessionId = this.sessionMap.get(userId);
    if (sessionId) {
      args.push('--resume', sessionId);
    }

    // Bilder als Temp-Dateien speichern und im Prompt erwaehnen
    let vollNachricht = nachricht;
    const tempDateien: string[] = [];

    if (bilder && bilder.length > 0) {
      for (let i = 0; i < bilder.length; i++) {
        const ext = bilder[i].typ.split('/')[1] || 'png';
        const tempPfad = `/tmp/dev-chat-${Date.now()}-${i}.${ext}`;
        fs.writeFileSync(tempPfad, Buffer.from(bilder[i].daten, 'base64'));
        tempDateien.push(tempPfad);
        vollNachricht = `[Bild angehaengt: ${tempPfad}]\n${vollNachricht}`;
      }
    }

    args.push(vollNachricht);

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
            letzterWerkzeugName,
          )) {
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

    yield { typ: 'fertig' };
  }

  // ==================== Event-Konvertierung ====================

  /**
   * Konvertiert Claude CLI stream-json Events in unsere SSE-Events.
   *
   * CLI Events:
   *   type: "system"    → Init mit session_id
   *   type: "assistant"  → Text + Tool-Use Bloecke
   *   type: "result"     → Session-ID fuer naechste Nachricht
   */
  private *eventKonvertieren(
    event: Record<string, unknown>,
    userId: string,
    letzterWerkzeugName: string,
  ): Generator<DevChatEvent> {
    const eventType = event.type as string;

    switch (eventType) {
      case 'system': {
        // Init-Event: Session-ID speichern
        const sid = (event as Record<string, unknown>).session_id as
          | string
          | undefined;
        if (sid) {
          this.sessionMap.set(userId, sid);
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
          this.sessionMap.set(userId, sid);
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
        // Finale Session-ID speichern
        const sid = (event as Record<string, unknown>).session_id as
          | string
          | undefined;
        if (sid) {
          this.sessionMap.set(userId, sid);
        }
        break;
      }

      // rate_limit_event und andere ignorieren
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
