'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';

interface TrainingEintrag {
  datum: string;
  status: 'YES' | 'NO' | 'MAYBE' | 'PENDING';
}

interface MitgliedStatistik {
  id: string;
  name: string;
  anwesenheitsquote: number;
  kommt: number;
  fehlt: number;
  offen: number;
  letzteTrainings: TrainingEintrag[];
  fehltInFolge: number;
}

interface AnwesenheitDaten {
  mitglieder: MitgliedStatistik[];
  teamQuote: number;
  anzahlTrainings: number;
}

function quotefarbe(quote: number): string {
  if (quote >= 75) return 'text-green-600 dark:text-green-400';
  if (quote >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function quoteBgFarbe(quote: number): string {
  if (quote >= 75) return 'bg-green-100 dark:bg-green-900/30';
  if (quote >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

function statusFarbe(status: string): string {
  switch (status) {
    case 'YES':
      return 'bg-green-500';
    case 'NO':
      return 'bg-red-500';
    case 'MAYBE':
      return 'bg-gray-400';
    case 'PENDING':
    default:
      return 'bg-gray-200 dark:bg-gray-700';
  }
}

function statusTitel(status: string): string {
  switch (status) {
    case 'YES':
      return 'Anwesend';
    case 'NO':
      return 'Abwesend';
    case 'MAYBE':
      return 'Vielleicht';
    case 'PENDING':
    default:
      return 'Keine Rueckmeldung';
  }
}

function ampelBadge(quote: number) {
  if (quote >= 75) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
        Zuverlaessig
      </Badge>
    );
  }
  if (quote >= 50) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
        Gelegentlich
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
      Aufmerksamkeit
    </Badge>
  );
}

function formatKurzDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default function AnwesenheitPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [daten, setDaten] = useState<AnwesenheitDaten | null>(null);
  const [ladend, setLadend] = useState(true);
  const [wochen, setWochen] = useState(12);
  const [sortierung, setSortierung] = useState<'name' | 'quote'>('quote');

  const datenLaden = useCallback(async () => {
    setLadend(true);
    try {
      const ergebnis = await apiClient.get<AnwesenheitDaten>(
        `/teams/${teamId}/anwesenheit?wochen=${wochen}`,
      );
      setDaten(ergebnis);
    } catch (error) {
      console.error('Fehler beim Laden der Anwesenheitsstatistik:', error);
    } finally {
      setLadend(false);
    }
  }, [teamId, wochen]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Anwesenheitsstatistik wird geladen...
        </div>
      </div>
    );
  }

  if (!daten) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Statistik konnte nicht geladen werden.
      </div>
    );
  }

  const sortierteMitglieder = [...daten.mitglieder].sort((a, b) => {
    if (sortierung === 'quote') {
      return a.anwesenheitsquote - b.anwesenheitsquote;
    }
    return a.name.localeCompare(b.name, 'de');
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/teams/${teamId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Anwesenheitsstatistik</h1>
            <p className="text-sm text-muted-foreground">
              Trainingsanwesenheit der letzten {wochen} Wochen
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Zeitraum:</label>
          <Select
            value={String(wochen)}
            onChange={(e) => setWochen(Number(e.target.value))}
            className="w-40"
          >
            <option value="4">4 Wochen</option>
            <option value="8">8 Wochen</option>
            <option value="12">12 Wochen</option>
            <option value="24">24 Wochen</option>
            <option value="52">1 Jahr</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sortierung:</label>
          <Select
            value={sortierung}
            onChange={(e) =>
              setSortierung(e.target.value as 'name' | 'quote')
            }
            className="w-40"
          >
            <option value="quote">Nach Quote</option>
            <option value="name">Nach Name</option>
          </Select>
        </div>
      </div>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Team-Quote</p>
            <p className={`text-4xl font-bold ${quotefarbe(daten.teamQuote)}`}>
              {daten.teamQuote}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Trainings</p>
            <p className="text-4xl font-bold">{daten.anzahlTrainings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Spieler</p>
            <p className="text-4xl font-bold">{daten.mitglieder.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap-Tabelle */}
      {daten.anzahlTrainings === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Keine Trainings im gewaehlten Zeitraum gefunden.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Anwesenheits-Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium sticky left-0 bg-card min-w-[200px]">
                      Spieler
                    </th>
                    <th className="text-center py-2 px-2 font-medium min-w-[60px]">
                      Quote
                    </th>
                    <th className="text-center py-2 px-2 font-medium min-w-[100px]">
                      Bewertung
                    </th>
                    {daten.mitglieder.length > 0 &&
                      [...daten.mitglieder[0].letzteTrainings]
                        .reverse()
                        .map((t, i) => (
                          <th
                            key={i}
                            className="text-center py-2 px-1 font-medium text-xs min-w-[40px]"
                            title={new Date(t.datum).toLocaleDateString(
                              'de-DE',
                              {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              },
                            )}
                          >
                            {formatKurzDatum(t.datum)}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody>
                  {sortierteMitglieder.map((mitglied) => (
                    <tr key={mitglied.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 sticky left-0 bg-card">
                        <div className="flex items-center gap-2">
                          {mitglied.fehltInFolge >= 3 && (
                            <span title={`Fehlt ${mitglied.fehltInFolge}x in Folge`}>
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            </span>
                          )}
                          <span className="font-medium">{mitglied.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {mitglied.kommt}x da / {mitglied.fehlt}x fehlt
                          {mitglied.offen > 0 && ` / ${mitglied.offen}x offen`}
                        </div>
                      </td>
                      <td className="text-center py-2 px-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${quoteBgFarbe(mitglied.anwesenheitsquote)} ${quotefarbe(mitglied.anwesenheitsquote)}`}
                        >
                          {mitglied.anwesenheitsquote}%
                        </span>
                      </td>
                      <td className="text-center py-2 px-2">
                        {ampelBadge(mitglied.anwesenheitsquote)}
                      </td>
                      {[...mitglied.letzteTrainings].reverse().map((t, i) => (
                        <td key={i} className="text-center py-2 px-1">
                          <div
                            className={`w-6 h-6 rounded-sm mx-auto ${statusFarbe(t.status)}`}
                            title={`${new Date(t.datum).toLocaleDateString('de-DE')}: ${statusTitel(t.status)}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legende */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-green-500" />
                <span>Anwesend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-red-500" />
                <span>Abwesend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-gray-400" />
                <span>Vielleicht</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-gray-200 dark:bg-gray-700" />
                <span>Keine Rueckmeldung</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>3+ Trainings in Folge abwesend</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
