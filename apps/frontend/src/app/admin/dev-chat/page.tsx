'use client';

import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Trash2,
  ImagePlus,
  Terminal,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
  Bot,
  User,
  X,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Search,
  Edit3,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useBenutzer } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/constants';

// ==================== Typen ====================

interface WerkzeugAktivitaet {
  name: string;
  eingabe: unknown;
  ergebnis?: string;
  fehler?: boolean;
}

interface ChatNachricht {
  id: string;
  rolle: 'user' | 'assistant';
  inhalt: string;
  bilder?: string[];
  werkzeuge?: WerkzeugAktivitaet[];
  zeitpunkt: Date;
}

interface BildVorschau {
  typ: string;
  daten: string;
  vorschau: string;
}

// ==================== Werkzeug-Icons ====================

const WERKZEUG_ICONS: Record<string, typeof Terminal> = {
  datei_lesen: FileText,
  datei_schreiben: Edit3,
  datei_bearbeiten: Edit3,
  befehl_ausfuehren: Terminal,
  dateien_suchen: Search,
  verzeichnis_listen: FolderOpen,
  Read: FileText,
  Write: Edit3,
  Edit: Edit3,
  Bash: Terminal,
  Grep: Search,
  Glob: FolderOpen,
  Agent: Bot,
};

const WERKZEUG_LABELS: Record<string, string> = {
  datei_lesen: 'Datei lesen',
  datei_schreiben: 'Datei schreiben',
  datei_bearbeiten: 'Datei bearbeiten',
  befehl_ausfuehren: 'Befehl',
  dateien_suchen: 'Suche',
  verzeichnis_listen: 'Verzeichnis',
  Read: 'Datei lesen',
  Write: 'Datei schreiben',
  Edit: 'Datei bearbeiten',
  Bash: 'Befehl',
  Grep: 'Suche',
  Glob: 'Dateien suchen',
  Agent: 'Agent',
};

// ==================== Markdown Renderer ====================

function CodeBlock({ sprache, code }: { sprache: string; code: string }) {
  const [kopiert, setKopiert] = useState(false);

  const kopieren = () => {
    navigator.clipboard.writeText(code);
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-zinc-200">
      <div className="bg-zinc-100 text-zinc-600 text-xs px-3 py-1.5 flex justify-between items-center">
        <span>{sprache || 'code'}</span>
        <button
          onClick={kopieren}
          className="text-zinc-500 hover:text-zinc-800 text-xs"
        >
          {kopiert ? 'Kopiert!' : 'Kopieren'}
        </button>
      </div>
      <pre className="bg-zinc-50 text-zinc-900 p-3 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MarkdownText({ text }: { text: string }) {
  const teile = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1">
      {teile.map((teil, i) => {
        if (teil.startsWith('```')) {
          const zeilen = teil.split('\n');
          const sprache = zeilen[0].replace('```', '').trim();
          const code = zeilen.slice(1, -1).join('\n');
          return <CodeBlock key={i} sprache={sprache} code={code} />;
        }

        if (!teil.trim()) return null;

        const formatiert = teil.split(/(`[^`]+`)/g).map((segment, j) => {
          if (segment.startsWith('`') && segment.endsWith('`')) {
            return (
              <code
                key={j}
                className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono"
              >
                {segment.slice(1, -1)}
              </code>
            );
          }
          const boldParts = segment.split(/(\*\*[^*]+\*\*)/g).map((bp, k) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return (
                <strong key={k} className="font-semibold">
                  {bp.slice(2, -2)}
                </strong>
              );
            }
            return <Fragment key={k}>{bp}</Fragment>;
          });
          return <Fragment key={j}>{boldParts}</Fragment>;
        });

        return (
          <div key={i} className="whitespace-pre-wrap leading-relaxed">
            {formatiert}
          </div>
        );
      })}
    </div>
  );
}

// ==================== Werkzeug-Anzeige ====================

function WerkzeugAnzeige({ werkzeug }: { werkzeug: WerkzeugAktivitaet }) {
  const [offen, setOffen] = useState(false);
  const Icon = WERKZEUG_ICONS[werkzeug.name] || Terminal;
  const label = WERKZEUG_LABELS[werkzeug.name] || werkzeug.name;
  const laedt = !werkzeug.ergebnis && werkzeug.ergebnis !== '';

  const eingabeText = (() => {
    const e = werkzeug.eingabe as Record<string, unknown>;
    if (e?.pfad) return String(e.pfad);
    if (e?.file_path) return String(e.file_path);
    if (e?.path) return String(e.path);
    if (e?.befehl) return String(e.befehl).slice(0, 60);
    if (e?.command) return String(e.command).slice(0, 60);
    if (e?.pattern) return String(e.pattern);
    if (e?.muster) return String(e.muster);
    return '';
  })();

  return (
    <div className="my-1.5 border border-zinc-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setOffen(!offen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors"
      >
        {laedt ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
        ) : werkzeug.fehler ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
        )}
        <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <span className="font-medium text-zinc-700">{label}</span>
        {eingabeText && (
          <span className="text-zinc-400 truncate text-xs font-mono">
            {eingabeText}
          </span>
        )}
        <span className="ml-auto">
          {offen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </span>
      </button>
      {offen && werkzeug.ergebnis && (
        <div className="border-t border-zinc-200 bg-zinc-50">
          <pre className="p-3 text-xs text-zinc-700 overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap">
            {werkzeug.ergebnis}
          </pre>
        </div>
      )}
    </div>
  );
}

// ==================== Hauptkomponente ====================

export default function DevChatSeite() {
  const router = useRouter();
  const benutzer = useBenutzer();
  const { accessToken } = useAuthStore();
  const [nachrichten, setNachrichten] = useState<ChatNachricht[]>([]);
  const [eingabe, setEingabe] = useState('');
  const [bilder, setBilder] = useState<BildVorschau[]>([]);
  const [ladenAktiv, setLadenAktiv] = useState(false);
  const [verlaufGeladen, setVerlaufGeladen] = useState(false);
  const [aktuelleAntwort, setAktuelleAntwort] = useState('');
  const [aktuelleWerkzeuge, setAktuelleWerkzeuge] = useState<
    WerkzeugAktivitaet[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dateiInputRef = useRef<HTMLInputElement>(null);

  // Auth-Pruefung
  useEffect(() => {
    if (benutzer && benutzer.rolle !== 'SUPERADMIN') {
      router.push('/dashboard');
    }
  }, [benutzer, router]);

  // Chat-Verlauf beim Laden holen
  useEffect(() => {
    if (!accessToken || verlaufGeladen) return;

    const verlaufLaden = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dev-chat/verlauf`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.nachrichten && data.nachrichten.length > 0) {
            const geladeneNachrichten: ChatNachricht[] = data.nachrichten.map(
              (n: {
                id: string;
                rolle: 'user' | 'assistant';
                inhalt: string;
                bilder?: string[];
                werkzeuge?: WerkzeugAktivitaet[];
                zeitpunkt: string;
              }) => ({
                id: n.id,
                rolle: n.rolle,
                inhalt: n.inhalt,
                bilder: n.bilder,
                werkzeuge: n.werkzeuge,
                zeitpunkt: new Date(n.zeitpunkt),
              }),
            );
            setNachrichten(geladeneNachrichten);
          }
        }
      } catch {
        // Verlauf laden fehlgeschlagen - kein Problem, starten wir frisch
      }
      setVerlaufGeladen(true);
    };

    verlaufLaden();
  }, [accessToken, verlaufGeladen]);

  // Auto-Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [nachrichten, aktuelleAntwort, aktuelleWerkzeuge]);

  // Textarea Auto-Resize
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, [eingabe]);

  // Bild aus Clipboard einfuegen
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const kommaIndex = dataUrl.indexOf(',');
            const daten = dataUrl.slice(kommaIndex + 1);
            const headerMatch = dataUrl.match(/:(.*?);/);
            const typ = headerMatch ? headerMatch[1] : 'image/png';
            setBilder((prev) => [...prev, { typ, daten, vorschau: dataUrl }]);
          };
          reader.readAsDataURL(blob);
        }
      }
    },
    [],
  );

  // Bild per Datei-Upload
  const handleDateiUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateien = e.target.files;
      if (!dateien) return;

      for (const datei of Array.from(dateien)) {
        if (!datei.type.startsWith('image/')) continue;

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const kommaIndex = dataUrl.indexOf(',');
          const daten = dataUrl.slice(kommaIndex + 1);
          setBilder((prev) => [
            ...prev,
            { typ: datei.type, daten, vorschau: dataUrl },
          ]);
        };
        reader.readAsDataURL(datei);
      }

      e.target.value = '';
    },
    [],
  );

  // Bild entfernen
  const bildEntfernen = useCallback((index: number) => {
    setBilder((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Nachricht senden
  const nachrichtSenden = async () => {
    if ((!eingabe.trim() && bilder.length === 0) || ladenAktiv) return;

    const neueNachricht: ChatNachricht = {
      id: Date.now().toString(),
      rolle: 'user',
      inhalt: eingabe,
      bilder: bilder.map((b) => b.vorschau),
      zeitpunkt: new Date(),
    };

    setNachrichten((prev) => [...prev, neueNachricht]);
    const nachrichtText = eingabe;
    const nachrichtBilder = bilder.map((b) => ({ typ: b.typ, daten: b.daten }));
    setEingabe('');
    setBilder([]);
    setLadenAktiv(true);
    setAktuelleAntwort('');
    setAktuelleWerkzeuge([]);

    try {
      const response = await fetch(`${API_BASE_URL}/dev-chat/nachricht`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nachricht: nachrichtText,
          bilder:
            nachrichtBilder.length > 0 ? nachrichtBilder : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server-Fehler ${response.status}: ${await response.text()}`,
        );
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gesamtText = '';
      let werkzeuge: WerkzeugAktivitaet[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const zeilen = buffer.split('\n');
        buffer = zeilen.pop() || '';

        for (const zeile of zeilen) {
          if (!zeile.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(zeile.slice(6));

            switch (event.typ) {
              case 'text':
                gesamtText += event.daten;
                setAktuelleAntwort(gesamtText);
                break;

              case 'werkzeug_start':
                werkzeuge = [
                  ...werkzeuge,
                  { name: event.daten.name, eingabe: event.daten.eingabe },
                ];
                setAktuelleWerkzeuge([...werkzeuge]);
                break;

              case 'werkzeug_ergebnis': {
                const idx = werkzeuge.findIndex(
                  (w) => w.name === event.daten.name && !w.ergebnis,
                );
                if (idx >= 0) {
                  werkzeuge[idx] = {
                    ...werkzeuge[idx],
                    ergebnis: event.daten.ergebnis,
                    fehler: event.daten.fehler,
                  };
                  setAktuelleWerkzeuge([...werkzeuge]);
                }
                break;
              }

              case 'fehler':
                gesamtText += `\n\nFehler: ${event.daten}`;
                setAktuelleAntwort(gesamtText);
                break;
            }
          } catch {
            // JSON-Parse-Fehler ignorieren
          }
        }
      }

      // Fertige Assistenten-Nachricht hinzufuegen
      const assistantNachricht: ChatNachricht = {
        id: (Date.now() + 1).toString(),
        rolle: 'assistant',
        inhalt: gesamtText,
        werkzeuge: werkzeuge.length > 0 ? werkzeuge : undefined,
        zeitpunkt: new Date(),
      };
      setNachrichten((prev) => [...prev, assistantNachricht]);
    } catch (err: unknown) {
      const fehlerText =
        err instanceof Error ? err.message : 'Unbekannter Fehler';
      const fehlerNachricht: ChatNachricht = {
        id: (Date.now() + 1).toString(),
        rolle: 'assistant',
        inhalt: `Verbindungsfehler: ${fehlerText}`,
        zeitpunkt: new Date(),
      };
      setNachrichten((prev) => [...prev, fehlerNachricht]);
    }

    setLadenAktiv(false);
    setAktuelleAntwort('');
    setAktuelleWerkzeuge([]);
    textareaRef.current?.focus();
  };

  // Chat loeschen
  const chatLoeschen = async () => {
    try {
      await fetch(`${API_BASE_URL}/dev-chat/verlauf`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Ignorieren
    }
    setNachrichten([]);
    setAktuelleAntwort('');
    setAktuelleWerkzeuge([]);
  };

  // Tastatur-Handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      nachrichtSenden();
    }
  };

  // Auth-Check
  if (!benutzer || benutzer.rolle !== 'SUPERADMIN') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200 px-4 py-3 flex items-center gap-3 bg-white shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin')}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin
        </Button>

        <div className="flex items-center gap-2 flex-1">
          <Bot className="w-5 h-5 text-blue-600" />
          <h1 className="font-semibold text-zinc-900">Dev-Chat</h1>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Claude CLI &middot; Vereinbase Entwicklung
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={chatLoeschen}
          className="text-zinc-500 hover:text-red-600 gap-1.5"
          disabled={nachrichten.length === 0 && !ladenAktiv}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Neuer Chat</span>
        </Button>
      </div>

      {/* Nachrichten-Bereich */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {/* Willkommen */}
        {nachrichten.length === 0 && !ladenAktiv && verlaufGeladen && (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 space-y-3 pb-20">
            <Bot className="w-12 h-12 text-zinc-300" />
            <div>
              <p className="text-lg font-medium text-zinc-600">
                Vereinbase Dev-Chat
              </p>
              <p className="text-sm mt-1">
                Schreib mir was du aendern oder bauen willst.
                <br />
                Ich kann Dateien lesen, bearbeiten und Befehle ausfuehren.
                <br />
                <span className="text-zinc-300 text-xs">
                  Claude CLI mit MCP-Tools &middot; Session bleibt erhalten
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {[
                'Zeig mir die letzten git commits',
                'Welche TODO-Kommentare gibt es?',
                'Erstelle eine neue API-Route',
              ].map((vorschlag) => (
                <button
                  key={vorschlag}
                  onClick={() => {
                    setEingabe(vorschlag);
                    textareaRef.current?.focus();
                  }}
                  className="px-3 py-1.5 text-xs border border-zinc-200 rounded-full hover:bg-zinc-50 hover:border-zinc-300 transition-colors text-zinc-600"
                >
                  {vorschlag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nachrichten */}
        {nachrichten.map((nachricht) => (
          <div
            key={nachricht.id}
            className={`flex gap-3 ${nachricht.rolle === 'user' ? 'justify-end' : ''}`}
          >
            {nachricht.rolle === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}

            <div
              className={`max-w-[85%] ${
                nachricht.rolle === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5'
                  : 'bg-zinc-50 border border-zinc-200 rounded-2xl rounded-bl-md px-4 py-3'
              }`}
            >
              {/* Bilder */}
              {nachricht.bilder && nachricht.bilder.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {nachricht.bilder.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Bild ${i + 1}`}
                      className="max-w-48 max-h-32 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Text */}
              {nachricht.rolle === 'user' ? (
                <div className="whitespace-pre-wrap text-sm">
                  {nachricht.inhalt}
                </div>
              ) : (
                <div className="text-sm text-zinc-800">
                  <MarkdownText text={nachricht.inhalt} />
                </div>
              )}

              {/* Werkzeuge */}
              {nachricht.werkzeuge && nachricht.werkzeuge.length > 0 && (
                <div className="mt-3 space-y-1">
                  {nachricht.werkzeuge.map((w, i) => (
                    <WerkzeugAnzeige key={i} werkzeug={w} />
                  ))}
                </div>
              )}
            </div>

            {nachricht.rolle === 'user' && (
              <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-zinc-600" />
              </div>
            )}
          </div>
        ))}

        {/* Aktuelle Antwort (Streaming) */}
        {ladenAktiv && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="max-w-[85%] bg-zinc-50 border border-zinc-200 rounded-2xl rounded-bl-md px-4 py-3">
              {/* Werkzeuge */}
              {aktuelleWerkzeuge.length > 0 && (
                <div className="space-y-1 mb-3">
                  {aktuelleWerkzeuge.map((w, i) => (
                    <WerkzeugAnzeige key={i} werkzeug={w} />
                  ))}
                </div>
              )}

              {/* Streaming-Text */}
              {aktuelleAntwort ? (
                <div className="text-sm text-zinc-800">
                  <MarkdownText text={aktuelleAntwort} />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Denkt nach...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Eingabe-Bereich */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3 shrink-0">
        {/* Bild-Vorschauen */}
        {bilder.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {bilder.map((bild, i) => (
              <div key={i} className="relative group">
                <img
                  src={bild.vorschau}
                  alt={`Bild ${i + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-zinc-200"
                />
                <button
                  onClick={() => bildEntfernen(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Eingabe-Zeile */}
        <div className="flex items-end gap-2">
          <input
            ref={dateiInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleDateiUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dateiInputRef.current?.click()}
            disabled={ladenAktiv}
            className="text-zinc-400 hover:text-zinc-600 shrink-0 mb-0.5"
          >
            <ImagePlus className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={eingabe}
              onChange={(e) => setEingabe(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Nachricht schreiben... (Shift+Enter fuer neue Zeile, Strg+V fuer Bilder)"
              disabled={ladenAktiv}
              rows={1}
              className="w-full resize-none border border-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ maxHeight: '200px' }}
            />
          </div>

          <Button
            onClick={nachrichtSenden}
            disabled={
              ladenAktiv || (!eingabe.trim() && bilder.length === 0)
            }
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 mb-0.5 rounded-xl px-3"
          >
            {ladenAktiv ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-zinc-400 mt-1.5 text-center">
          SUPERADMIN-Werkzeug &middot; Claude CLI mit MCP-Tools, Session bleibt
          erhalten
        </p>
      </div>
    </div>
  );
}
