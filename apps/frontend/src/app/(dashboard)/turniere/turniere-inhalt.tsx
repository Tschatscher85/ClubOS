'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Plus, Trash2, ExternalLink, Radio, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TurnierFormular } from '@/components/turniere/turnier-formular';
import { EventFormular } from '@/components/kalender/event-formular';
import { apiClient } from '@/lib/api-client';
import { getEventFarbe, EVENT_TYP_LABEL } from '@/lib/event-farben';
import { sportartLabel } from '@/lib/sportarten';

interface Turnier {
  id: string;
  name: string;
  sport: string;
  format: string;
  publicUrl: string;
  isLive: boolean;
  _count: { matches: number };
}

interface SpielEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  location: string;
  team: { id: string; name: string; sport: string };
}

const FORMAT_LABEL: Record<string, string> = {
  GRUPPE: 'Gruppenphase',
  KO: 'KO-System',
  SCHWEIZER: 'Schweizer System',
  KOMBINATION: 'Kombination',
};

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TurniereInhalt() {
  const [turniere, setTurniere] = useState<Turnier[]>([]);
  const [nächsteSpiele, setNaechsteSpiele] = useState<SpielEvent[]>([]);
  const [ladend, setLadend] = useState(true);
  const [turnierFormularOffen, setTurnierFormularOffen] = useState(false);
  const [eventFormularOffen, setEventFormularOffen] = useState(false);
  const router = useRouter();

  const datenLaden = useCallback(async () => {
    try {
      const [turnierDaten, eventDaten] = await Promise.all([
        apiClient.get<Turnier[]>('/turniere'),
        apiClient.get<SpielEvent[]>('/veranstaltungen').catch(() => []),
      ]);
      setTurniere(turnierDaten);

      // Naechste Spiele und Turniere aus Events
      const spiele = eventDaten
        .filter((e) => ['MATCH', 'TOURNAMENT'].includes(e.type) && new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6);
      setNaechsteSpiele(spiele);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleLoeschen = async (id: string) => {
    if (!confirm('Turnier wirklich löschen?')) return;
    try {
      await apiClient.delete(`/turniere/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aktionen */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {turniere.length} Turniere · {nächsteSpiele.length} anstehende Spiele
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEventFormularOffen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Neues Spiel
          </Button>
          <Button onClick={() => setTurnierFormularOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Turnier
          </Button>
        </div>
      </div>

      {/* Naechste Spiele */}
      {nächsteSpiele.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Anstehende Spiele</h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {nächsteSpiele.map((spiel) => (
              <div
                key={spiel.id}
                onClick={() => router.push(`/kalender/${spiel.id}`)}
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div
                  className="w-1 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: getEventFarbe(spiel.type) }}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">{spiel.title}</span>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{formatDatum(spiel.date)}</span>
                    {spiel.location && <span>· {spiel.location}</span>}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {spiel.team?.name}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Turniere */}
      {turniere.length === 0 && nächsteSpiele.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Turniere oder Spiele vorhanden. Erstellen Sie ein Turnier oder
          planen Sie ein Spiel ueber den Kalender-Tab.
        </div>
      ) : turniere.length > 0 && (
        <>
          <h3 className="font-semibold text-sm text-muted-foreground">Turniere</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {turniere.map((turnier) => (
              <Card
                key={turnier.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/turniere/${turnier.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">{turnier.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        {sportartLabel(turnier.sport)}
                      </Badge>
                      <Badge variant="outline">
                        {FORMAT_LABEL[turnier.format] || turnier.format}
                      </Badge>
                      {turnier.isLive && (
                        <Badge variant="default" className="bg-red-500">
                          <Radio className="h-3 w-3 mr-1" />
                          LIVE
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoeschen(turnier.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{turnier._count.matches} Spiele</span>
                    <span className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Live-Link
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <TurnierFormular
        offen={turnierFormularOffen}
        onSchliessen={() => setTurnierFormularOffen(false)}
        onGespeichert={datenLaden}
      />

      <EventFormular
        offen={eventFormularOffen}
        onSchliessen={() => setEventFormularOffen(false)}
        onGespeichert={datenLaden}
      />
    </div>
  );
}
