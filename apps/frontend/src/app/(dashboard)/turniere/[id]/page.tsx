'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Trophy,
  Plus,
  Trash2,
  Radio,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SpielFormular } from '@/components/turniere/spiel-formular';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';

interface Spiel {
  id: string;
  team1: string;
  team2: string;
  score1: number | null;
  score2: number | null;
  time: string | null;
  field: string | null;
  status: string;
}

interface Turnier {
  id: string;
  name: string;
  sport: string;
  format: string;
  publicUrl: string;
  isLive: boolean;
  matches: Spiel[];
}

const STATUS_LABEL: Record<string, string> = {
  GEPLANT: 'Geplant',
  LAUFEND: 'Laufend',
  BEENDET: 'Beendet',
  ABGESAGT: 'Abgesagt',
};

export default function TurnierDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [turnier, setTurnier] = useState<Turnier | null>(null);
  const [ladend, setLadend] = useState(true);
  const [spielFormularOffen, setSpielFormularOffen] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Turnier>(`/turniere/${id}`);
      setTurnier(daten);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, [id]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleLiveToggle = async () => {
    if (!turnier) return;
    try {
      await apiClient.put(`/turniere/${id}/live`, {
        isLive: !turnier.isLive,
      });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleScoreUpdate = async (
    spielId: string,
    feld: 'score1' | 'score2',
    wert: string,
  ) => {
    try {
      await apiClient.put(`/turniere/${id}/spiele/${spielId}`, {
        [feld]: parseInt(wert) || 0,
      });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleStatusUpdate = async (spielId: string, status: string) => {
    try {
      await apiClient.put(`/turniere/${id}/spiele/${spielId}`, { status });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleSpielLoeschen = async (spielId: string) => {
    try {
      await apiClient.delete(`/turniere/${id}/spiele/${spielId}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend || !turnier) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  const liveUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/turnier/${turnier.publicUrl}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/turniere">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{turnier.name}</h1>
            <div className="flex gap-2 mt-1">
              {turnier.isLive && (
                <Badge variant="default" className="bg-red-500">
                  <Radio className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={turnier.isLive ? 'destructive' : 'default'}
            onClick={handleLiveToggle}
          >
            <Radio className="h-4 w-4 mr-2" />
            {turnier.isLive ? 'Live beenden' : 'Live schalten'}
          </Button>
          <Button variant="outline" onClick={() => setSpielFormularOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Spiel
          </Button>
        </div>
      </div>

      {/* Live-Link */}
      <Card>
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Oeffentlicher Link:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {liveUrl}
            </code>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(liveUrl)}
          >
            Kopieren
          </Button>
        </CardContent>
      </Card>

      {/* Spielplan */}
      <Card>
        <CardHeader>
          <CardTitle>Spielplan</CardTitle>
        </CardHeader>
        <CardContent>
          {turnier.matches.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Noch keine Spiele. Fuegen Sie Spielpaarungen hinzu.
            </p>
          ) : (
            <div className="space-y-3">
              {turnier.matches.map((spiel) => (
                <div
                  key={spiel.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {/* Spielfeld & Zeit */}
                  <div className="w-20 text-xs text-muted-foreground text-center">
                    {spiel.field && <div>{spiel.field}</div>}
                    {spiel.time && (
                      <div>
                        {new Date(spiel.time).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>

                  {/* Team 1 */}
                  <div className="flex-1 text-right font-medium">
                    {spiel.team1}
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1">
                    <Input
                      className="w-12 text-center h-8"
                      value={spiel.score1 ?? ''}
                      onChange={(e) =>
                        handleScoreUpdate(spiel.id, 'score1', e.target.value)
                      }
                      placeholder="-"
                    />
                    <span className="text-muted-foreground">:</span>
                    <Input
                      className="w-12 text-center h-8"
                      value={spiel.score2 ?? ''}
                      onChange={(e) =>
                        handleScoreUpdate(spiel.id, 'score2', e.target.value)
                      }
                      placeholder="-"
                    />
                  </div>

                  {/* Team 2 */}
                  <div className="flex-1 font-medium">{spiel.team2}</div>

                  {/* Status */}
                  <Select
                    className="w-28 h-8 text-xs"
                    value={spiel.status}
                    onChange={(e) =>
                      handleStatusUpdate(spiel.id, e.target.value)
                    }
                  >
                    <option value="GEPLANT">Geplant</option>
                    <option value="LAUFEND">Laufend</option>
                    <option value="BEENDET">Beendet</option>
                    <option value="ABGESAGT">Abgesagt</option>
                  </Select>

                  {/* Loeschen */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSpielLoeschen(spiel.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spiel-Formular */}
      <SpielFormular
        offen={spielFormularOffen}
        onSchliessen={() => setSpielFormularOffen(false)}
        onGespeichert={datenLaden}
        turnierId={id}
      />
    </div>
  );
}
