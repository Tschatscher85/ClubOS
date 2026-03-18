'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, MapPin, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventFormular } from '@/components/kalender/event-formular';
import { apiClient } from '@/lib/api-client';

interface EventData {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  location: string;
  hallName: string | null;
  hallAddress: string | null;
  teamId: string;
  notes: string | null;
  team: { id: string; name: string; sport: string };
  attendances: { status: string }[];
  _count: { attendances: number };
}

const TYP_FARBE: Record<string, string> = {
  TRAINING: 'bg-green-500',
  MATCH: 'bg-blue-600',
  TOURNAMENT: 'bg-purple-600',
  TRIP: 'bg-orange-500',
  MEETING: 'bg-gray-500',
};

const TYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
};

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONATSNAMEN = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function formatUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function KalenderInhalt() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const [aktuellerMonat, setAktuellerMonat] = useState(new Date());
  const [ansicht, setAnsicht] = useState<'monat' | 'liste'>('monat');

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<EventData[]>('/veranstaltungen');
      setEvents(daten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleLoeschen = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Veranstaltung wirklich löschen?')) return;
    try {
      await apiClient.delete(`/veranstaltungen/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // Kalendertage berechnen
  const kalenderTage = useMemo(() => {
    const jahr = aktuellerMonat.getFullYear();
    const monat = aktuellerMonat.getMonth();
    const ersterTag = new Date(jahr, monat, 1);
    const letzterTag = new Date(jahr, monat + 1, 0);

    // Montag als erster Wochentag (0=Mo, 6=So)
    let startTag = ersterTag.getDay() - 1;
    if (startTag < 0) startTag = 6;

    const tage: { datum: Date; istAktuellerMonat: boolean }[] = [];

    // Tage vor dem Monat
    for (let i = startTag - 1; i >= 0; i--) {
      const d = new Date(jahr, monat, -i);
      tage.push({ datum: d, istAktuellerMonat: false });
    }

    // Tage im Monat
    for (let i = 1; i <= letzterTag.getDate(); i++) {
      tage.push({ datum: new Date(jahr, monat, i), istAktuellerMonat: true });
    }

    // Tage nach dem Monat (bis 42 Tage = 6 Wochen)
    while (tage.length < 42) {
      const naechsterTag = tage.length - startTag - letzterTag.getDate() + 1;
      tage.push({ datum: new Date(jahr, monat + 1, naechsterTag), istAktuellerMonat: false });
    }

    return tage;
  }, [aktuellerMonat]);

  // Events pro Tag
  const eventsProTag = useMemo(() => {
    const map = new Map<string, EventData[]>();
    for (const event of events) {
      const key = new Date(event.date).toISOString().split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const heute = new Date().toISOString().split('T')[0];

  // Kommende Events (sortiert)
  const kommendeEvents = useMemo(() => {
    return events
      .filter((e) => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20);
  }, [events]);

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="animate-pulse text-muted-foreground">Kalender wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <button
              onClick={() => setAnsicht('monat')}
              className={`px-3 py-1.5 text-sm ${ansicht === 'monat' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Monat
            </button>
            <button
              onClick={() => setAnsicht('liste')}
              className={`px-3 py-1.5 text-sm border-l ${ansicht === 'liste' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Liste
            </button>
          </div>
          {ansicht === 'monat' && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAktuellerMonat(new Date(aktuellerMonat.getFullYear(), aktuellerMonat.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[160px] text-center">
                {MONATSNAMEN[aktuellerMonat.getMonth()]} {aktuellerMonat.getFullYear()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAktuellerMonat(new Date(aktuellerMonat.getFullYear(), aktuellerMonat.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => setAktuellerMonat(new Date())}
              >
                Heute
              </Button>
            </div>
          )}
        </div>
        <Button onClick={() => setFormularOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Veranstaltung
        </Button>
      </div>

      {/* Monatsansicht */}
      {ansicht === 'monat' && (
        <div className="border rounded-lg overflow-hidden">
          {/* Wochentag-Header */}
          <div className="grid grid-cols-7 bg-muted">
            {WOCHENTAGE.map((tag) => (
              <div key={tag} className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
                {tag}
              </div>
            ))}
          </div>
          {/* Kalender-Grid */}
          <div className="grid grid-cols-7">
            {kalenderTage.map(({ datum, istAktuellerMonat }, idx) => {
              const key = datum.toISOString().split('T')[0];
              const tagesEvents = eventsProTag.get(key) || [];
              const istHeute = key === heute;

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] border-r border-b last:border-r-0 p-1 ${
                    !istAktuellerMonat ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className={`text-xs font-medium mb-0.5 ${
                    istHeute
                      ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                      : istAktuellerMonat ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {datum.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {tagesEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => router.push(`/kalender/${event.id}`)}
                        className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded text-white truncate ${TYP_FARBE[event.type] || 'bg-gray-500'}`}
                        title={`${formatUhrzeit(event.date)} ${event.title} (${event.team.name})`}
                      >
                        {formatUhrzeit(event.date)} {event.title}
                      </button>
                    ))}
                    {tagesEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{tagesEvents.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listenansicht */}
      {ansicht === 'liste' && (
        <div className="space-y-2">
          {kommendeEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Keine kommenden Veranstaltungen.
            </div>
          ) : (
            kommendeEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/kalender/${event.id}`)}
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                {/* Datum-Box */}
                <div className="flex flex-col items-center justify-center min-w-[50px] rounded-md bg-muted px-2 py-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-bold">
                    {new Date(event.date).getDate()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('de-DE', { month: 'short' })}
                  </span>
                </div>

                {/* Event-Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${TYP_FARBE[event.type] || 'bg-gray-500'}`} />
                    <span className="font-medium truncate">{event.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {event.team.name}
                    </Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatUhrzeit(event.date)}
                      {event.endDate && ` – ${formatUhrzeit(event.endDate)}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                    {event.attendances?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.attendances.filter((a) => a.status === 'YES').length}/{event.attendances.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Typ-Badge + Löschen */}
                <Badge className={`text-white ${TYP_FARBE[event.type] || 'bg-gray-500'} shrink-0`}>
                  {TYP_LABEL[event.type] || event.type}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={(e) => handleLoeschen(event.id, e)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Legende */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(TYP_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${TYP_FARBE[key]}`} />
            {label}
          </span>
        ))}
      </div>

      <EventFormular
        offen={formularOffen}
        onSchliessen={() => setFormularOffen(false)}
        onGespeichert={datenLaden}
      />
    </div>
  );
}
