'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  Loader2,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

// ==================== Typen ====================

interface EntwicklungsbogenDaten {
  id: string;
  memberId: string;
  teamId: string;
  datum: string;
  saison: string;
  ball: number | null;
  passen: number | null;
  schuss: number | null;
  zweikampf: number | null;
  kopfball: number | null;
  spielverstaendnis: number | null;
  positionsspiel: number | null;
  defensivverhalten: number | null;
  schnelligkeit: number | null;
  ausdauer: number | null;
  sprungkraft: number | null;
  teamgeist: number | null;
  einstellung: number | null;
  coaching: number | null;
  staerken: string | null;
  entwicklungsfelder: string | null;
  ziele: string | null;
  trainerEmpfehlung: string | null;
  team?: { id: string; name: string };
}

interface TeamInfo {
  id: string;
  rolle: string;
  team: {
    id: string;
    name: string;
  };
}

interface MitgliedInfo {
  id: string;
  firstName: string;
  lastName: string;
  parentEmail: string | null;
  teamMembers: TeamInfo[];
  user: { id: string; email: string; role: string; vereinsRollen?: string[] } | null;
}

// ==================== Bewertungskategorien ====================

const KATEGORIEN = {
  Technik: [
    { key: 'ball', label: 'Ballkontrolle' },
    { key: 'passen', label: 'Passen' },
    { key: 'schuss', label: 'Schuss' },
    { key: 'zweikampf', label: 'Zweikampf' },
    { key: 'kopfball', label: 'Kopfball' },
  ],
  Taktik: [
    { key: 'spielverstaendnis', label: 'Spielverstaendnis' },
    { key: 'positionsspiel', label: 'Positionsspiel' },
    { key: 'defensivverhalten', label: 'Defensivverhalten' },
  ],
  Athletik: [
    { key: 'schnelligkeit', label: 'Schnelligkeit' },
    { key: 'ausdauer', label: 'Ausdauer' },
    { key: 'sprungkraft', label: 'Sprungkraft' },
  ],
  Sozial: [
    { key: 'teamgeist', label: 'Teamgeist' },
    { key: 'einstellung', label: 'Einstellung' },
    { key: 'coaching', label: 'Coachbarkeit' },
  ],
} as const;

type BewertungsKey =
  | 'ball' | 'passen' | 'schuss' | 'zweikampf' | 'kopfball'
  | 'spielverstaendnis' | 'positionsspiel' | 'defensivverhalten'
  | 'schnelligkeit' | 'ausdauer' | 'sprungkraft'
  | 'teamgeist' | 'einstellung' | 'coaching';

// ==================== Hilfsfunktionen ====================

function durchschnitt(bogen: EntwicklungsbogenDaten, keys: readonly { key: string }[]): number {
  const werte = keys
    .map((k) => bogen[k.key as BewertungsKey])
    .filter((v): v is number => v !== null && v !== undefined);
  if (werte.length === 0) return 0;
  return Math.round((werte.reduce((a, b) => a + b, 0) / werte.length) * 10) / 10;
}

function radarDaten(bogen: EntwicklungsbogenDaten) {
  return [
    { kategorie: 'Technik', wert: durchschnitt(bogen, KATEGORIEN.Technik) },
    { kategorie: 'Taktik', wert: durchschnitt(bogen, KATEGORIEN.Taktik) },
    { kategorie: 'Athletik', wert: durchschnitt(bogen, KATEGORIEN.Athletik) },
    { kategorie: 'Sozial', wert: durchschnitt(bogen, KATEGORIEN.Sozial) },
  ];
}

function aktSaison(): string {
  const jetzt = new Date();
  const jahr = jetzt.getFullYear();
  const monat = jetzt.getMonth() + 1;
  // Saison beginnt im Juli
  if (monat >= 7) return `${jahr}/${jahr + 1}`;
  return `${jahr - 1}/${jahr}`;
}

// ==================== Sterne-Bewertung ====================

function SterneBewertung({
  wert,
  onChange,
}: {
  wert: number | null;
  onChange: (w: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="p-0 border-0 bg-transparent cursor-pointer"
        >
          <Star
            className={`h-5 w-5 ${
              wert !== null && s <= wert
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ==================== Radar-Chart Komponente ====================

function EntwicklungsRadar({
  aktuell,
  vorherig,
}: {
  aktuell: EntwicklungsbogenDaten;
  vorherig?: EntwicklungsbogenDaten;
}) {
  const daten = radarDaten(aktuell);

  // Wenn vorheriger Bogen vorhanden, zusammenfuehren
  const zusammengefuehrt = vorherig
    ? daten.map((d, i) => ({
        ...d,
        vorherig: radarDaten(vorherig)[i].wert,
      }))
    : daten;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={zusammengefuehrt}>
        <PolarGrid />
        <PolarAngleAxis dataKey="kategorie" className="text-xs" />
        <Radar
          name="Aktuell"
          dataKey="wert"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.3}
        />
        {vorherig && (
          <Radar
            name="Vorherig"
            dataKey="vorherig"
            stroke="#9ca3af"
            fill="#9ca3af"
            fillOpacity={0.15}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ==================== Hauptseite ====================

export default function EntwicklungPage() {
  const params = useParams();
  const router = useRouter();
  const benutzer = useBenutzer();
  const mitgliedId = params.id as string;

  const [mitglied, setMitglied] = useState<MitgliedInfo | null>(null);
  const [boegen, setBoegen] = useState<EntwicklungsbogenDaten[]>([]);
  const [ladend, setLadend] = useState(true);
  const [speichernd, setSpeichernd] = useState(false);
  const [formularOffen, setFormularOffen] = useState(false);
  const [aufgeklappteBoegen, setAufgeklappteBoegen] = useState<Set<string>>(new Set());

  // Formular-State
  const [teamId, setTeamId] = useState('');
  const [saison, setSaison] = useState(aktSaison());
  const [bewertungen, setBewertungen] = useState<Record<BewertungsKey, number | null>>({
    ball: null,
    passen: null,
    schuss: null,
    zweikampf: null,
    kopfball: null,
    spielverstaendnis: null,
    positionsspiel: null,
    defensivverhalten: null,
    schnelligkeit: null,
    ausdauer: null,
    sprungkraft: null,
    teamgeist: null,
    einstellung: null,
    coaching: null,
  });
  const [staerken, setStaerken] = useState('');
  const [entwicklungsfelder, setEntwicklungsfelder] = useState('');
  const [ziele, setZiele] = useState('');
  const [trainerEmpfehlung, setTrainerEmpfehlung] = useState('');

  // Zugriffspruefung
  const istTrainerOderAdmin =
    benutzer &&
    ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);

  const datenLaden = useCallback(async () => {
    try {
      const [mitgliedDaten, boegenDaten] = await Promise.all([
        apiClient.get<MitgliedInfo>(`/mitglieder/${mitgliedId}`),
        apiClient.get<EntwicklungsbogenDaten[]>(`/entwicklung/${mitgliedId}`),
      ]);
      setMitglied(mitgliedDaten);
      setBoegen(boegenDaten);

      // Standard-Team setzen
      if (mitgliedDaten.teamMembers.length > 0 && !teamId) {
        setTeamId(mitgliedDaten.teamMembers[0].team.id);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, [mitgliedId, teamId]);

  useEffect(() => {
    if (istTrainerOderAdmin) {
      datenLaden();
    } else {
      setLadend(false);
    }
  }, [datenLaden, istTrainerOderAdmin]);

  const handleSpeichern = useCallback(async () => {
    if (!teamId || !saison) return;
    setSpeichernd(true);
    try {
      await apiClient.post(`/entwicklung/${mitgliedId}`, {
        teamId,
        saison,
        ...bewertungen,
        staerken: staerken || undefined,
        entwicklungsfelder: entwicklungsfelder || undefined,
        ziele: ziele || undefined,
        trainerEmpfehlung: trainerEmpfehlung || undefined,
      });
      // Formular zuruecksetzen
      setFormularOffen(false);
      setBewertungen({
        ball: null, passen: null, schuss: null, zweikampf: null, kopfball: null,
        spielverstaendnis: null, positionsspiel: null, defensivverhalten: null,
        schnelligkeit: null, ausdauer: null, sprungkraft: null,
        teamgeist: null, einstellung: null, coaching: null,
      });
      setStaerken('');
      setEntwicklungsfelder('');
      setZiele('');
      setTrainerEmpfehlung('');
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setSpeichernd(false);
    }
  }, [
    teamId, saison, bewertungen, staerken, entwicklungsfelder, ziele,
    trainerEmpfehlung, mitgliedId, datenLaden,
  ]);

  const handleLoeschen = useCallback(async (id: string) => {
    if (!window.confirm('Diesen Entwicklungsbogen wirklich löschen?')) return;
    try {
      await apiClient.delete(`/entwicklung/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  }, [datenLaden]);

  const toggleAufklappen = useCallback((id: string) => {
    setAufgeklappteBoegen((prev) => {
      const neu = new Set(prev);
      if (neu.has(id)) {
        neu.delete(id);
      } else {
        neu.add(id);
      }
      return neu;
    });
  }, []);

  // ==================== Rendering ====================

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!istTrainerOderAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">
          Kein Zugriff. Nur Trainer und Admins koennen Entwicklungsboegen einsehen.
        </p>
      </div>
    );
  }

  // Entwicklung nur fuer Spieler/Jugendspieler oder Kinder ohne User-Account
  const istSpieler = mitglied && (
    mitglied.user?.vereinsRollen?.some(r => r === 'Spieler' || r === 'Jugendspieler') ||
    (!mitglied.user && mitglied.parentEmail)
  );

  if (!mitglied) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Mitglied nicht gefunden.</p>
          <Button variant="outline" onClick={() => router.push('/mitglieder')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurueck
          </Button>
        </div>
      </div>
    );
  }

  if (!istSpieler) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Entwicklungsboegen sind nur fuer Mitglieder mit der Rolle Spieler oder Jugendspieler verfuegbar.
          </p>
          <Button variant="outline" onClick={() => router.push(`/mitglieder/${mitgliedId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurueck zum Mitglied
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/mitglieder/${mitgliedId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Entwicklungsbogen - {mitglied.firstName} {mitglied.lastName}
          </h1>
          <p className="text-muted-foreground">
            Spieler-Bewertungen und Entwicklungsverlauf
          </p>
        </div>
        <Button onClick={() => setFormularOffen(!formularOffen)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Bogen
        </Button>
      </div>

      {/* Aktueller Radar-Chart (letzter Bogen) */}
      {boegen.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktueller Stand</CardTitle>
          </CardHeader>
          <CardContent>
            <EntwicklungsRadar
              aktuell={boegen[0]}
              vorherig={boegen.length >= 2 ? boegen[1] : undefined}
            />
            {boegen.length >= 2 && (
              <div className="flex items-center gap-4 justify-center mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-blue-600" />
                  Aktuell ({boegen[0].saison})
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-gray-400" />
                  Vorherig ({boegen[1].saison})
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formular für neuen Bogen */}
      {formularOffen && (
        <Card>
          <CardHeader>
            <CardTitle>Neuen Entwicklungsbogen erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team & Saison */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="team-auswahl">Team</Label>
                <select
                  id="team-auswahl"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Team waehlen...</option>
                  {mitglied.teamMembers.map((tm) => (
                    <option key={tm.team.id} value={tm.team.id}>
                      {tm.team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="saison-eingabe">Saison</Label>
                <Input
                  id="saison-eingabe"
                  value={saison}
                  onChange={(e) => setSaison(e.target.value)}
                  placeholder="z.B. 2025/2026"
                />
              </div>
            </div>

            {/* Bewertungen nach Kategorien */}
            {(Object.entries(KATEGORIEN) as [string, readonly { key: string; label: string }[]][]).map(
              ([gruppe, felder]) => (
                <div key={gruppe}>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    {gruppe}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {felder.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between rounded-md border px-4 py-2">
                        <span className="text-sm">{label}</span>
                        <SterneBewertung
                          wert={bewertungen[key as BewertungsKey]}
                          onChange={(w) =>
                            setBewertungen((prev) => ({ ...prev, [key]: w }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}

            {/* Textfelder */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staerken">Staerken</Label>
                <textarea
                  id="staerken"
                  value={staerken}
                  onChange={(e) => setStaerken(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                  placeholder="Was macht der Spieler besonders gut?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entwicklungsfelder">Entwicklungsfelder</Label>
                <textarea
                  id="entwicklungsfelder"
                  value={entwicklungsfelder}
                  onChange={(e) => setEntwicklungsfelder(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                  placeholder="In welchen Bereichen gibt es Verbesserungspotenzial?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ziele">Ziele</Label>
                <textarea
                  id="ziele"
                  value={ziele}
                  onChange={(e) => setZiele(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                  placeholder="Welche Ziele werden für die nächste Phase gesetzt?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trainerEmpfehlung">Trainer-Empfehlung</Label>
                <textarea
                  id="trainerEmpfehlung"
                  value={trainerEmpfehlung}
                  onChange={(e) => setTrainerEmpfehlung(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                  placeholder="Empfehlung des Trainers (z.B. Hochstufung, Schwerpunkttraining)"
                />
              </div>
            </div>

            {/* Speichern */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setFormularOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSpeichern}
                disabled={!teamId || !saison || speichernd}
              >
                {speichernd ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  'Bogen speichern'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste der gespeicherten Boegen */}
      {boegen.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Bisherige Entwicklungsboegen</h2>
          {boegen.map((bogen, index) => {
            const istOffen = aufgeklappteBoegen.has(bogen.id);
            return (
              <Card key={bogen.id}>
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-muted/30"
                  onClick={() => toggleAufklappen(bogen.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        {bogen.saison}
                        {bogen.team && (
                          <span className="text-muted-foreground ml-2">
                            - {bogen.team.name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bogen.datum).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    {/* Mini Radar-Vorschau */}
                    <div className="hidden sm:block w-[80px] h-[60px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarDaten(bogen)}>
                          <PolarGrid />
                          <Radar
                            dataKey="wert"
                            stroke="#2563eb"
                            fill="#2563eb"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoeschen(bogen.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    {istOffen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {istOffen && (
                  <CardContent className="border-t pt-4 space-y-4">
                    {/* Radar Chart */}
                    <EntwicklungsRadar
                      aktuell={bogen}
                      vorherig={index + 1 < boegen.length ? boegen[index + 1] : undefined}
                    />

                    {/* Bewertungen anzeigen */}
                    {(Object.entries(KATEGORIEN) as [string, readonly { key: string; label: string }[]][]).map(
                      ([gruppe, felder]) => (
                        <div key={gruppe}>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {gruppe}
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {felder.map(({ key, label }) => {
                              const wert = bogen[key as BewertungsKey];
                              return (
                                <div
                                  key={key}
                                  className="flex items-center justify-between rounded-md border px-3 py-1.5"
                                >
                                  <span className="text-sm">{label}</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`h-4 w-4 ${
                                          wert !== null && s <= (wert ?? 0)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted-foreground/30'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ),
                    )}

                    {/* Textfelder anzeigen */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {bogen.staerken && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Staerken
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {bogen.staerken}
                          </p>
                        </div>
                      )}
                      {bogen.entwicklungsfelder && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Entwicklungsfelder
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {bogen.entwicklungsfelder}
                          </p>
                        </div>
                      )}
                      {bogen.ziele && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Ziele
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {bogen.ziele}
                          </p>
                        </div>
                      )}
                      {bogen.trainerEmpfehlung && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Trainer-Empfehlung
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {bogen.trainerEmpfehlung}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Keine Boegen vorhanden */}
      {boegen.length === 0 && !formularOffen && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Noch keine Entwicklungsboegen vorhanden.
            </p>
            <Button onClick={() => setFormularOffen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Bogen erstellen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
