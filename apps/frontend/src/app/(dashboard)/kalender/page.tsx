'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, Trash2, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  _count: { attendances: number };
}

const TYP_LABEL: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' }> = {
  TRAINING: { text: 'Training', variant: 'secondary' },
  MATCH: { text: 'Spiel', variant: 'default' },
  TOURNAMENT: { text: 'Turnier', variant: 'default' },
  TRIP: { text: 'Ausflug', variant: 'outline' },
  MEETING: { text: 'Besprechung', variant: 'outline' },
};

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatUhrzeit(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function KalenderPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);

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

  const handleLoeschen = async (id: string) => {
    if (!confirm('Veranstaltung wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/veranstaltungen/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Veranstaltungen werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Kalender</h1>
            <p className="text-muted-foreground">
              {events.length} Veranstaltungen
            </p>
          </div>
        </div>
        <Button onClick={() => setFormularOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Veranstaltung
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Veranstaltungen. Erstellen Sie zuerst ein Team, dann eine Veranstaltung.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const typInfo = TYP_LABEL[event.type] || { text: event.type, variant: 'outline' as const };
            return (
              <Card key={event.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={typInfo.variant}>{typInfo.text}</Badge>
                      <Badge variant="outline">{event.team.name}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleLoeschen(event.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDatum(event.date)}, {formatUhrzeit(event.date)}
                      {event.endDate && ` — ${formatUhrzeit(event.endDate)}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                      {event.hallName && ` (${event.hallName})`}
                    </span>
                  </div>
                  {event.notes && (
                    <p className="mt-2 text-sm">{event.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EventFormular
        offen={formularOffen}
        onSchliessen={() => setFormularOffen(false)}
        onGespeichert={datenLaden}
      />
    </div>
  );
}
