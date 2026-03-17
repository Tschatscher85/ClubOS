'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trophy, Radio, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

interface TabellenEintrag {
  name: string;
  spiele: number;
  siege: number;
  unentschieden: number;
  niederlagen: number;
  tore: number;
  gegentore: number;
  punkte: number;
}

interface TurnierLive {
  id: string;
  name: string;
  sport: string;
  format: string;
  isLive: boolean;
  matches: Spiel[];
  tabelle: TabellenEintrag[];
}

const STATUS_FARBE: Record<string, string> = {
  GEPLANT: 'bg-muted text-muted-foreground',
  LAUFEND: 'bg-green-100 text-green-800 border-green-300',
  BEENDET: 'bg-gray-100 text-gray-600',
  ABGESAGT: 'bg-red-100 text-red-800',
};

const STATUS_LABEL: Record<string, string> = {
  GEPLANT: 'Geplant',
  LAUFEND: 'Laufend',
  BEENDET: 'Beendet',
  ABGESAGT: 'Abgesagt',
};

export default function TurnierLivePage() {
  const params = useParams();
  const publicUrl = params.publicUrl as string;
  const [turnier, setTurnier] = useState<TurnierLive | null>(null);
  const [fehler, setFehler] = useState('');

  const datenLaden = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/turniere/live/${publicUrl}`);
      if (!res.ok) throw new Error('Turnier nicht gefunden');
      const daten = await res.json();
      setTurnier(daten);
    } catch {
      setFehler('Turnier nicht gefunden oder nicht mehr verfuegbar.');
    }
  };

  useEffect(() => {
    datenLaden();
    // Auto-Refresh alle 10 Sekunden
    const interval = setInterval(datenLaden, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicUrl]);

  if (fehler) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">{fehler}</p>
        </div>
      </div>
    );
  }

  if (!turnier) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{turnier.name}</h1>
            {turnier.isLive && (
              <Badge variant="default" className="bg-red-500 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            Aktualisiert sich automatisch
          </div>
        </div>

        {/* Tabelle */}
        {turnier.tabelle.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tabelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-3 text-left font-medium">#</th>
                      <th className="h-10 px-3 text-left font-medium">Team</th>
                      <th className="h-10 px-3 text-center font-medium">Sp</th>
                      <th className="h-10 px-3 text-center font-medium">S</th>
                      <th className="h-10 px-3 text-center font-medium">U</th>
                      <th className="h-10 px-3 text-center font-medium">N</th>
                      <th className="h-10 px-3 text-center font-medium">Tore</th>
                      <th className="h-10 px-3 text-center font-medium">Diff</th>
                      <th className="h-10 px-3 text-center font-medium font-bold">Pkt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnier.tabelle.map((eintrag, index) => (
                      <tr
                        key={eintrag.name}
                        className={`border-b ${index === 0 ? 'bg-primary/5 font-semibold' : ''}`}
                      >
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{eintrag.name}</td>
                        <td className="px-3 py-2 text-center">{eintrag.spiele}</td>
                        <td className="px-3 py-2 text-center">{eintrag.siege}</td>
                        <td className="px-3 py-2 text-center">{eintrag.unentschieden}</td>
                        <td className="px-3 py-2 text-center">{eintrag.niederlagen}</td>
                        <td className="px-3 py-2 text-center">
                          {eintrag.tore}:{eintrag.gegentore}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {eintrag.tore - eintrag.gegentore > 0 ? '+' : ''}
                          {eintrag.tore - eintrag.gegentore}
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {eintrag.punkte}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spielplan */}
        <Card>
          <CardHeader>
            <CardTitle>Spiele</CardTitle>
          </CardHeader>
          <CardContent>
            {turnier.matches.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Noch keine Spiele eingetragen.
              </p>
            ) : (
              <div className="space-y-2">
                {turnier.matches.map((spiel) => (
                  <div
                    key={spiel.id}
                    className={`flex items-center rounded-lg border p-3 ${
                      spiel.status === 'LAUFEND' ? 'border-green-400 bg-green-50' : ''
                    }`}
                  >
                    <div className="w-16 text-xs text-muted-foreground text-center">
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
                    <div className="flex-1 text-right font-medium text-lg">
                      {spiel.team1}
                    </div>
                    <div className="mx-4 text-center min-w-[80px]">
                      <div className="text-2xl font-bold">
                        {spiel.score1 !== null && spiel.score2 !== null
                          ? `${spiel.score1} : ${spiel.score2}`
                          : '- : -'}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_FARBE[spiel.status] || ''}`}
                      >
                        {STATUS_LABEL[spiel.status] || spiel.status}
                      </Badge>
                    </div>
                    <div className="flex-1 font-medium text-lg">
                      {spiel.team2}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          Powered by ClubOS
        </div>
      </div>
    </div>
  );
}
