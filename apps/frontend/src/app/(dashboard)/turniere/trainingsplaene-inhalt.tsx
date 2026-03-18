'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

// ==================== Typen ====================

interface TeamData {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
}

interface Uebung {
  name: string;
  dauer: number;
  beschreibung: string;
  material: string[];
}

interface Einheit {
  nummer: number;
  titel: string;
  erwaermung: { dauer: number; beschreibung: string };
  hauptteil: Uebung[];
  abschluss: { dauer: number; beschreibung: string };
  tipps: string[];
}

interface TrainingsplanData {
  id: string;
  teamId: string;
  titel: string;
  parameter: {
    fokus: string;
    anzahlEinheiten: number;
    dauerMinuten: number;
    niveau: string;
    sportart: string;
    altersgruppe: string;
    besonderheiten?: string | null;
  };
  inhalt: Einheit[] | { rohtext: string };
  erstelltAm: string;
  team: TeamData;
}

// ==================== Hauptkomponente ====================

export default function TrainingsplaeneInhalt() {
  const benutzer = useBenutzer();

  // Teams
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [gewaehlterTeamId, setGewaehlterTeamId] = useState('');

  // Formular
  const [fokus, setFokus] = useState('');
  const [anzahlEinheiten, setAnzahlEinheiten] = useState(4);
  const [dauerMinuten, setDauerMinuten] = useState('90');
  const [niveau, setNiveau] = useState('Mittel');
  const [besonderheiten, setBesonderheiten] = useState('');

  // Ergebnis
  const [generierterPlan, setGenerierterPlan] = useState<TrainingsplanData | null>(null);
  const [generierend, setGenerierend] = useState(false);
  const [fehler, setFehler] = useState('');

  // Gespeicherte Plaene
  const [gespeichertePlaene, setGespeichertePlaene] = useState<TrainingsplanData[]>([]);
  const [plaeneLadend, setPlaeneLadend] = useState(false);

  // Expandierte Einheiten
  const [expandierteEinheiten, setExpandierteEinheiten] = useState<Set<number>>(new Set());

  // Teams laden
  useEffect(() => {
    const teamsLaden = async () => {
      try {
        const daten = await apiClient.get<TeamData[]>('/teams');
        setTeams(daten);
        if (daten.length > 0 && !gewaehlterTeamId) {
          setGewaehlterTeamId(daten[0].id);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Teams:', error);
      }
    };
    teamsLaden();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Gespeicherte Plaene laden wenn Team gewaehlt
  const plaeneLaden = useCallback(async () => {
    if (!gewaehlterTeamId) return;
    setPlaeneLadend(true);
    try {
      const daten = await apiClient.get<TrainingsplanData[]>(
        `/trainingsplaene/${gewaehlterTeamId}`,
      );
      setGespeichertePlaene(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Plaene:', error);
    } finally {
      setPlaeneLadend(false);
    }
  }, [gewaehlterTeamId]);

  useEffect(() => {
    plaeneLaden();
  }, [plaeneLaden]);

  // Plan generieren
  const handleGenerieren = async () => {
    if (!gewaehlterTeamId || !fokus.trim()) return;
    setGenerierend(true);
    setFehler('');
    setGenerierterPlan(null);

    try {
      const ergebnis = await apiClient.post<TrainingsplanData>(
        `/trainingsplaene/${gewaehlterTeamId}`,
        {
          fokus: fokus.trim(),
          anzahlEinheiten,
          dauerMinuten: parseInt(dauerMinuten),
          niveau,
          besonderheiten: besonderheiten.trim() || undefined,
        },
      );
      setGenerierterPlan(ergebnis);
      // Alle Einheiten aufklappen
      if (Array.isArray(ergebnis.inhalt)) {
        setExpandierteEinheiten(new Set(ergebnis.inhalt.map((_: Einheit, i: number) => i)));
      }
      // Gespeicherte Plaene aktualisieren
      plaeneLaden();
    } catch (error) {
      setFehler(
        (error as Error).message || 'Fehler beim Generieren des Trainingsplans.',
      );
    } finally {
      setGenerierend(false);
    }
  };

  // Plan loeschen
  const handleLoeschen = async (id: string) => {
    try {
      await apiClient.delete(`/trainingsplaene/${id}`);
      setGespeichertePlaene((prev) => prev.filter((p) => p.id !== id));
      if (generierterPlan?.id === id) {
        setGenerierterPlan(null);
      }
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  // Einheit auf-/zuklappen
  const toggleEinheit = (index: number) => {
    setExpandierteEinheiten((prev) => {
      const neu = new Set(prev);
      if (neu.has(index)) {
        neu.delete(index);
      } else {
        neu.add(index);
      }
      return neu;
    });
  };

  // Gespeicherten Plan anzeigen
  const planAnzeigen = (plan: TrainingsplanData) => {
    setGenerierterPlan(plan);
    if (Array.isArray(plan.inhalt)) {
      setExpandierteEinheiten(new Set(plan.inhalt.map((_: Einheit, i: number) => i)));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const istBerechtigt =
    benutzer && ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          KI-Trainingsplan-Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erstelle individuelle Trainingsplaene mit kuenstlicher Intelligenz.
        </p>
      </div>

      {fehler && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          {fehler}
        </div>
      )}

      {/* ==================== Generator-Formular ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Neuen Trainingsplan erstellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Team-Auswahl */}
          <div>
            <Label>Team</Label>
            <Select
              className="mt-1"
              value={gewaehlterTeamId}
              onChange={(e) => setGewaehlterTeamId(e.target.value)}
            >
              <option value="" disabled>
                Team waehlen...
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.ageGroup})
                </option>
              ))}
            </Select>
          </div>

          {/* Fokus/Thema */}
          <div>
            <Label>Fokus / Thema</Label>
            <Textarea
              value={fokus}
              onChange={(e) => setFokus(e.target.value)}
              placeholder="z.B. Passspiel und Pressing, Torschusstraining, Ballkontrolle..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Anzahl Einheiten */}
          <div>
            <Label>
              Anzahl Einheiten:{' '}
              <span className="font-bold text-primary">{anzahlEinheiten}</span>
            </Label>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={anzahlEinheiten}
              onChange={(e) => setAnzahlEinheiten(parseInt(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>6</span>
              <span>12</span>
            </div>
          </div>

          {/* Dauer pro Einheit */}
          <div>
            <Label>Dauer pro Einheit</Label>
            <Select
              className="mt-1"
              value={dauerMinuten}
              onChange={(e) => setDauerMinuten(e.target.value)}
            >
              <option value="60">60 Minuten</option>
              <option value="75">75 Minuten</option>
              <option value="90">90 Minuten</option>
              <option value="120">120 Minuten</option>
            </Select>
          </div>

          {/* Niveau */}
          <div>
            <Label>Niveau</Label>
            <Select
              className="mt-1"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
            >
              <option value="Anfaenger">Anfaenger</option>
              <option value="Mittel">Mittel</option>
              <option value="Fortgeschritten">Fortgeschritten</option>
            </Select>
          </div>

          {/* Besonderheiten */}
          <div>
            <Label>Besonderheiten (optional)</Label>
            <Textarea
              value={besonderheiten}
              onChange={(e) => setBesonderheiten(e.target.value)}
              placeholder="z.B. Nur 10 Spieler verfuegbar, kein Hallenzugang, Verletzungsprophylaxe..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Generieren-Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerieren}
            disabled={generierend || !gewaehlterTeamId || !fokus.trim() || !istBerechtigt}
          >
            {generierend ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                KI erstellt Trainingsplan...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Plan erstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ==================== Plan-Anzeige ==================== */}
      {generierterPlan && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{generierterPlan.titel}</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {generierterPlan.parameter.sportart}
            </Badge>
            <Badge variant="secondary">
              {generierterPlan.parameter.altersgruppe}
            </Badge>
            <Badge variant="secondary">
              {generierterPlan.parameter.niveau}
            </Badge>
            <Badge variant="secondary">
              {generierterPlan.parameter.dauerMinuten} Min.
            </Badge>
          </div>

          {/* Einheiten als Rohtext (Fallback) */}
          {!Array.isArray(generierterPlan.inhalt) &&
            'rohtext' in (generierterPlan.inhalt as Record<string, unknown>) && (
              <Card>
                <CardContent className="pt-6">
                  <pre className="whitespace-pre-wrap text-sm">
                    {(generierterPlan.inhalt as { rohtext: string }).rohtext}
                  </pre>
                </CardContent>
              </Card>
            )}

          {/* Einheiten als strukturierte Karten */}
          {Array.isArray(generierterPlan.inhalt) &&
            (generierterPlan.inhalt as Einheit[]).map((einheit, index) => (
              <Card key={index}>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleEinheit(index)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5" />
                      <span>{einheit.titel || `Einheit ${einheit.nummer}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {generierterPlan.parameter.dauerMinuten} Min.
                      </Badge>
                      {expandierteEinheiten.has(index) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>

                {expandierteEinheiten.has(index) && (
                  <CardContent className="space-y-4 pt-0">
                    {/* Erwaermung */}
                    {einheit.erwaermung && (
                      <div className="rounded-md bg-orange-50 dark:bg-orange-950/30 p-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                          Erwaermung
                          <Badge variant="outline" className="text-xs">
                            {einheit.erwaermung.dauer} Min.
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {einheit.erwaermung.beschreibung}
                        </p>
                      </div>
                    )}

                    {/* Hauptteil */}
                    {einheit.hauptteil && einheit.hauptteil.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Hauptteil</h4>
                        {einheit.hauptteil.map((uebung, uIndex) => (
                          <div
                            key={uIndex}
                            className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-sm">
                                {uebung.name}
                              </h5>
                              <Badge variant="outline" className="text-xs shrink-0 ml-2">
                                {uebung.dauer} Min.
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {uebung.beschreibung}
                            </p>
                            {uebung.material && uebung.material.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {uebung.material.map((m, mIndex) => (
                                  <Badge
                                    key={mIndex}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {m}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Abschluss */}
                    {einheit.abschluss && (
                      <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                          Abschluss
                          <Badge variant="outline" className="text-xs">
                            {einheit.abschluss.dauer} Min.
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {einheit.abschluss.beschreibung}
                        </p>
                      </div>
                    )}

                    {/* Tipps */}
                    {einheit.tipps && einheit.tipps.length > 0 && (
                      <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 p-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4" />
                          Tipps
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                          {einheit.tipps.map((tipp, tIndex) => (
                            <li
                              key={tIndex}
                              className="text-sm text-muted-foreground"
                            >
                              {tipp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
        </div>
      )}

      {/* ==================== Gespeicherte Plaene ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Gespeicherte Trainingsplaene
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plaeneLadend ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : gespeichertePlaene.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Noch keine Trainingsplaene vorhanden. Erstelle deinen ersten Plan
              mit dem Generator oben.
            </p>
          ) : (
            <div className="space-y-2">
              {gespeichertePlaene.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => planAnzeigen(plan)}
                  >
                    <p className="font-medium text-sm">{plan.titel}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {plan.team.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(plan.erstelltAm).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {plan.parameter.niveau}
                      </Badge>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleLoeschen(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
