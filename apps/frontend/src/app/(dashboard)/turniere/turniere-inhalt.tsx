'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Plus, Trash2, ExternalLink, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TurnierFormular } from '@/components/turniere/turnier-formular';
import { apiClient } from '@/lib/api-client';

interface Turnier {
  id: string;
  name: string;
  sport: string;
  format: string;
  publicUrl: string;
  isLive: boolean;
  _count: { matches: number };
}

const FORMAT_LABEL: Record<string, string> = {
  GRUPPE: 'Gruppenphase',
  KO: 'KO-System',
  SCHWEIZER: 'Schweizer System',
  KOMBINATION: 'Kombination',
};

const SPORT_LABEL: Record<string, string> = {
  FUSSBALL: 'Fussball',
  HANDBALL: 'Handball',
  BASKETBALL: 'Basketball',
  SONSTIGES: 'Sonstiges',
};

export default function TurniereInhalt() {
  const [turniere, setTurniere] = useState<Turnier[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const router = useRouter();

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Turnier[]>('/turniere');
      setTurniere(daten);
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
    if (!confirm('Turnier wirklich loeschen?')) return;
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
          Turniere werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Turniere & Spiele</h1>
            <p className="text-muted-foreground">{turniere.length} Turniere</p>
          </div>
        </div>
        <Button onClick={() => setFormularOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Turnier
        </Button>
      </div>

      {turniere.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Turniere. Erstellen Sie Ihr erstes Turnier.
        </div>
      ) : (
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
                      {SPORT_LABEL[turnier.sport] || turnier.sport}
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
      )}

      <TurnierFormular
        offen={formularOffen}
        onSchliessen={() => setFormularOffen(false)}
        onGespeichert={datenLaden}
      />
    </div>
  );
}
