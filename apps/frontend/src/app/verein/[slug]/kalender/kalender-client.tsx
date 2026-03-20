'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar, X, Users } from 'lucide-react';

// ==================== Typen ====================

interface KalenderEvent {
  id: string;
  titel: string;
  typ: string;
  datum: string;
  endDatum: string | null;
  ort: string;
  hallenName: string | null;
  teamName: string | null;
}

interface VereinInfo {
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
}

interface MonatInfo {
  start: string;
  ende: string;
}

interface Props {
  verein: VereinInfo;
  initialEvents: KalenderEvent[];
  initialMonat: MonatInfo;
}

// ==================== Hilfsfunktionen ====================

const MONATSNAMEN = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const TYP_FARBEN: Record<string, { bg: string; text: string; dot: string }> = {
  TRAINING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  MATCH: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  TOURNAMENT: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  EVENT: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  MEETING: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  TRIP: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  VOLUNTEER: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
};

const TYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  EVENT: 'Veranstaltung',
  MEETING: 'Sitzung',
  TRIP: 'Ausflug',
  VOLUNTEER: 'Helfereinsatz',
};

function formatUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ==================== Komponente ====================

export function OeffentlicherKalender({ verein, initialEvents, initialMonat }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [aktuellerMonat, setAktuellerMonat] = useState(() => new Date(initialMonat.start));
  const [ladend, setLadend] = useState(false);
  const [ausgewaehlt, setAusgewaehlt] = useState<KalenderEvent | null>(null);

  // Kalender-Grid berechnen
  const kalenderTage = useMemo(() => {
    const jahr = aktuellerMonat.getFullYear();
    const monat = aktuellerMonat.getMonth();
    const ersterTag = new Date(jahr, monat, 1);
    const letzterTag = new Date(jahr, monat + 1, 0);

    // Montag = 0, Sonntag = 6
    let startWochentag = ersterTag.getDay() - 1;
    if (startWochentag < 0) startWochentag = 6;

    const tage: { datum: Date; imMonat: boolean }[] = [];

    // Vormonat auffuellen
    for (let i = startWochentag - 1; i >= 0; i--) {
      tage.push({
        datum: new Date(jahr, monat, -i),
        imMonat: false,
      });
    }

    // Aktueller Monat
    for (let d = 1; d <= letzterTag.getDate(); d++) {
      tage.push({
        datum: new Date(jahr, monat, d),
        imMonat: true,
      });
    }

    // Nachmonat auffuellen (bis 42 Tage = 6 Wochen)
    while (tage.length < 42) {
      const nächster = tage.length - startWochentag - letzterTag.getDate() + 1;
      tage.push({
        datum: new Date(jahr, monat + 1, nächster),
        imMonat: false,
      });
    }

    return tage;
  }, [aktuellerMonat]);

  // Events pro Tag
  const eventsProTag = useMemo(() => {
    const map = new Map<string, KalenderEvent[]>();
    for (const ev of events) {
      const key = new Date(ev.datum).toISOString().split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  const monatWechseln = useCallback(async (richtung: number) => {
    const neuerMonat = new Date(aktuellerMonat);
    neuerMonat.setMonth(neuerMonat.getMonth() + richtung);
    setAktuellerMonat(neuerMonat);
    setLadend(true);

    try {
      const monatStr = `${neuerMonat.getFullYear()}-${String(neuerMonat.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`${API_BASE_URL}/homepage/public/${verein.slug}/kalender?monat=${monatStr}`);
      if (res.ok) {
        const daten = await res.json();
        setEvents(daten.events);
      }
    } catch {
      // Fehler still ignorieren
    } finally {
      setLadend(false);
    }
  }, [aktuellerMonat, verein.slug]);

  const heute = new Date();
  const heuteKey = heute.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          {verein.logo && (
            <img
              src={`${API_BASE_URL}${verein.logo}`}
              alt={verein.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-xl font-bold">{verein.name}</h1>
            <p className="text-sm text-gray-500">Vereinskalender</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Monats-Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => monatWechseln(-1)}
            className="p-2 rounded-lg hover:bg-gray-200 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {MONATSNAMEN[aktuellerMonat.getMonth()]} {aktuellerMonat.getFullYear()}
          </h2>
          <button
            onClick={() => monatWechseln(1)}
            className="p-2 rounded-lg hover:bg-gray-200 transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Kalender-Grid */}
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${ladend ? 'opacity-50' : ''}`}>
          {/* Wochentage Header */}
          <div className="grid grid-cols-7 border-b">
            {WOCHENTAGE.map((tag) => (
              <div key={tag} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                {tag}
              </div>
            ))}
          </div>

          {/* Tage */}
          <div className="grid grid-cols-7">
            {kalenderTage.map(({ datum, imMonat }, i) => {
              const key = datum.toISOString().split('T')[0];
              const tageEvents = eventsProTag.get(key) || [];
              const istHeute = key === heuteKey;

              return (
                <div
                  key={i}
                  className={`min-h-[80px] md:min-h-[100px] border-b border-r p-1 ${
                    !imMonat ? 'bg-gray-50 text-gray-300' : ''
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    istHeute ? 'text-white' : ''
                  }`}
                    style={istHeute ? { backgroundColor: verein.primaryColor } : undefined}
                  >
                    {datum.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {tageEvents.slice(0, 3).map((ev) => {
                      const farbe = TYP_FARBEN[ev.typ] || TYP_FARBEN.EVENT;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setAusgewaehlt(ev)}
                          className={`w-full text-left text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate ${farbe.bg} ${farbe.text} hover:opacity-80 transition`}
                        >
                          <span className="hidden md:inline">{formatUhrzeit(ev.datum)} </span>
                          {ev.titel}
                        </button>
                      );
                    })}
                    {tageEvents.length > 3 && (
                      <div className="text-[10px] text-gray-400 px-1">
                        +{tageEvents.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legende */}
        <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
          {Object.entries(TYP_LABEL).map(([typ, label]) => {
            const farbe = TYP_FARBEN[typ];
            if (!farbe) return null;
            return (
              <div key={typ} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${farbe.dot}`} />
                {label}
              </div>
            );
          })}
        </div>

        {/* Powered by */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by Vereinbase
        </p>
      </main>

      {/* Event-Detail Modal */}
      {ausgewaehlt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setAusgewaehlt(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                  TYP_FARBEN[ausgewaehlt.typ]?.bg || 'bg-gray-100'
                } ${TYP_FARBEN[ausgewaehlt.typ]?.text || 'text-gray-700'}`}>
                  {TYP_LABEL[ausgewaehlt.typ] || ausgewaehlt.typ}
                </span>
                <h3 className="text-lg font-bold mt-2">{ausgewaehlt.titel}</h3>
              </div>
              <button onClick={() => setAusgewaehlt(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDatum(ausgewaehlt.datum)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                {formatUhrzeit(ausgewaehlt.datum)}
                {ausgewaehlt.endDatum && ` – ${formatUhrzeit(ausgewaehlt.endDatum)}`}
              </div>
              {ausgewaehlt.ort && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ausgewaehlt.ort)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {ausgewaehlt.hallenName ? `${ausgewaehlt.hallenName} (${ausgewaehlt.ort})` : ausgewaehlt.ort}
                  </a>
                </div>
              )}
              {ausgewaehlt.teamName && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  {ausgewaehlt.teamName}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
