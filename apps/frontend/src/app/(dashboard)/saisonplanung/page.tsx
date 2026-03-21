'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarRange,
  Plus,
  Trash2,
  Save,
  X,
  Play,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';

interface Team {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
}

interface SaisonPhase {
  id: string;
  name: string;
  startDatum: string;
  endDatum: string;
  schwerpunkt: string | null;
  farbe: string | null;
  notizen: string | null;
  reihenfolge: number;
}

interface Saisonplan {
  id: string;
  teamId: string;
  saison: string;
  startDatum: string;
  endDatum: string;
  phasen: SaisonPhase[];
  team: Team;
  erstelltAm: string;
}

const STANDARD_FARBEN = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
];

export default function SaisonplanungPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gewaehlterTeamId, setGewaehlterTeamId] = useState('');
  const [plaene, setPlaene] = useState<Saisonplan[]>([]);
  const [laed, setLaed] = useState(false);

  // Neuer Plan
  const [neuPlanModus, setNeuPlanModus] = useState(false);
  const [planForm, setPlanForm] = useState({
    saison: '',
    startDatum: '',
    endDatum: '',
  });

  // Neue Phase
  const [neuPhaseModus, setNeuPhaseModus] = useState<string | null>(null);
  const [phaseForm, setPhaseForm] = useState({
    name: '',
    startDatum: '',
    endDatum: '',
    schwerpunkt: '',
    farbe: STANDARD_FARBEN[0],
    notizen: '',
  });

  // Phase bearbeiten
  const [bearbeitungsPhase, setBearbeitungsPhase] = useState<string | null>(
    null,
  );
  const [bearbeitungsForm, setBearbeitungsForm] = useState({
    name: '',
    startDatum: '',
    endDatum: '',
    schwerpunkt: '',
    farbe: '',
    notizen: '',
  });

  const teamsLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Team[]>('/teams');
      setTeams(daten);
      if (daten.length > 0 && !gewaehlterTeamId) {
        setGewaehlterTeamId(daten[0].id);
      }
    } catch {
      // Fehler ignorieren
    }
  }, []);

  const plaeneLaden = useCallback(async () => {
    if (!gewaehlterTeamId) return;
    try {
      const daten = await apiClient.get<Saisonplan[]>(
        `/saisonplan/team/${gewaehlterTeamId}`,
      );
      setPlaene(daten);
    } catch {
      // Fehler ignorieren
    }
  }, [gewaehlterTeamId]);

  useEffect(() => {
    teamsLaden();
  }, [teamsLaden]);

  useEffect(() => {
    plaeneLaden();
  }, [plaeneLaden]);

  const planErstellen = async () => {
    if (
      !planForm.saison.trim() ||
      !planForm.startDatum ||
      !planForm.endDatum
    )
      return;
    setLaed(true);
    try {
      await apiClient.post('/saisonplan', {
        teamId: gewaehlterTeamId,
        saison: planForm.saison,
        startDatum: planForm.startDatum,
        endDatum: planForm.endDatum,
      });
      setNeuPlanModus(false);
      setPlanForm({ saison: '', startDatum: '', endDatum: '' });
      plaeneLaden();
    } catch {
      alert('Fehler beim Erstellen des Saisonplans');
    } finally {
      setLaed(false);
    }
  };

  const planLoeschen = async (id: string) => {
    if (!confirm('Saisonplan wirklich loeschen? Alle Phasen werden geloescht.'))
      return;
    try {
      await apiClient.delete(`/saisonplan/${id}`);
      plaeneLaden();
    } catch {
      alert('Fehler beim Loeschen');
    }
  };

  const phaseHinzufuegen = async (planId: string) => {
    if (!phaseForm.name.trim() || !phaseForm.startDatum || !phaseForm.endDatum)
      return;
    setLaed(true);
    try {
      await apiClient.post(`/saisonplan/${planId}/phase`, {
        name: phaseForm.name,
        startDatum: phaseForm.startDatum,
        endDatum: phaseForm.endDatum,
        schwerpunkt: phaseForm.schwerpunkt || undefined,
        farbe: phaseForm.farbe || undefined,
        notizen: phaseForm.notizen || undefined,
      });
      setNeuPhaseModus(null);
      setPhaseForm({
        name: '',
        startDatum: '',
        endDatum: '',
        schwerpunkt: '',
        farbe: STANDARD_FARBEN[0],
        notizen: '',
      });
      plaeneLaden();
    } catch {
      alert('Fehler beim Hinzufuegen der Phase');
    } finally {
      setLaed(false);
    }
  };

  const phaseAktualisieren = async (phaseId: string) => {
    setLaed(true);
    try {
      await apiClient.put(`/saisonplan/phase/${phaseId}`, {
        name: bearbeitungsForm.name,
        startDatum: bearbeitungsForm.startDatum,
        endDatum: bearbeitungsForm.endDatum,
        schwerpunkt: bearbeitungsForm.schwerpunkt || undefined,
        farbe: bearbeitungsForm.farbe || undefined,
        notizen: bearbeitungsForm.notizen || undefined,
      });
      setBearbeitungsPhase(null);
      plaeneLaden();
    } catch {
      alert('Fehler beim Aktualisieren');
    } finally {
      setLaed(false);
    }
  };

  const phaseLoeschen = async (phaseId: string) => {
    if (!confirm('Phase wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/saisonplan/phase/${phaseId}`);
      plaeneLaden();
    } catch {
      alert('Fehler beim Loeschen');
    }
  };

  const eventsErstellen = async (planId: string) => {
    if (
      !confirm(
        'Fuer alle Phasen werden automatisch woechentliche Trainings-Events (Di + Do) erstellt. Fortfahren?',
      )
    )
      return;
    setLaed(true);
    try {
      const ergebnis = await apiClient.post<{
        nachricht: string;
        anzahl: number;
      }>(`/saisonplan/${planId}/events-erstellen`, {});
      alert(ergebnis.nachricht);
    } catch {
      alert('Fehler beim Erstellen der Events');
    } finally {
      setLaed(false);
    }
  };

  // Timeline berechnen
  const berechneTimeline = (plan: Saisonplan) => {
    const planStart = new Date(plan.startDatum).getTime();
    const planEnde = new Date(plan.endDatum).getTime();
    const gesamtDauer = planEnde - planStart;
    if (gesamtDauer <= 0) return [];

    return plan.phasen.map((phase) => {
      const phasenStart = new Date(phase.startDatum).getTime();
      const phasenEnde = new Date(phase.endDatum).getTime();
      const links = ((phasenStart - planStart) / gesamtDauer) * 100;
      const breite = ((phasenEnde - phasenStart) / gesamtDauer) * 100;

      return {
        ...phase,
        links: Math.max(0, Math.min(100, links)),
        breite: Math.max(1, Math.min(100 - links, breite)),
      };
    });
  };

  const bearbeitungStarten = (phase: SaisonPhase) => {
    setBearbeitungsPhase(phase.id);
    setBearbeitungsForm({
      name: phase.name,
      startDatum: phase.startDatum.split('T')[0],
      endDatum: phase.endDatum.split('T')[0],
      schwerpunkt: phase.schwerpunkt || '',
      farbe: phase.farbe || STANDARD_FARBEN[0],
      notizen: phase.notizen || '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Saisonplanung</h1>
            <p className="text-muted-foreground">
              Saisonphasen planen und Trainings automatisch erstellen
            </p>
          </div>
        </div>
      </div>

      {/* Team-Auswahl */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Team</label>
          <Select
            value={gewaehlterTeamId}
            onChange={(e) => setGewaehlterTeamId(e.target.value)}
            className="w-[300px]"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.ageGroup})
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => setNeuPlanModus(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Saisonplan
        </Button>
      </div>

      {/* Neuer Plan Formular */}
      {neuPlanModus && (
        <Card>
          <CardHeader>
            <CardTitle>Neuen Saisonplan erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Saison</label>
                <Input
                  value={planForm.saison}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, saison: e.target.value })
                  }
                  placeholder="z.B. 2025/2026"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start</label>
                <Input
                  type="date"
                  value={planForm.startDatum}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, startDatum: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ende</label>
                <Input
                  type="date"
                  value={planForm.endDatum}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, endDatum: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={planErstellen}
                disabled={laed}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {laed ? 'Wird erstellt...' : 'Erstellen'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setNeuPlanModus(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saisonplaene */}
      {plaene.length === 0 && !neuPlanModus && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarRange className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Noch kein Saisonplan fuer dieses Team vorhanden
            </p>
          </CardContent>
        </Card>
      )}

      {plaene.map((plan) => {
        const timelineElemente = berechneTimeline(plan);

        return (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Saison {plan.saison} - {plan.team.name}
                  </CardTitle>
                  <CardDescription>
                    {new Date(plan.startDatum).toLocaleDateString('de-DE')} bis{' '}
                    {new Date(plan.endDatum).toLocaleDateString('de-DE')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eventsErstellen(plan.id)}
                    disabled={laed || plan.phasen.length === 0}
                    className="gap-1"
                  >
                    <Play className="h-4 w-4" />
                    Events erstellen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => planLoeschen(plan.id)}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline */}
              {plan.phasen.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Timeline</h4>
                  <div className="relative h-12 rounded-lg bg-muted overflow-hidden">
                    {timelineElemente.map((el) => (
                      <div
                        key={el.id}
                        className="absolute top-0 h-full flex items-center justify-center text-xs font-medium text-white truncate px-1"
                        style={{
                          left: `${el.links}%`,
                          width: `${el.breite}%`,
                          backgroundColor: el.farbe || '#3b82f6',
                        }}
                        title={`${el.name}: ${new Date(el.startDatum).toLocaleDateString('de-DE')} - ${new Date(el.endDatum).toLocaleDateString('de-DE')}`}
                      >
                        {el.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phasen-Karten */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Phasen</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNeuPhaseModus(plan.id)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Phase
                  </Button>
                </div>

                {plan.phasen.map((phase) => (
                  <div
                    key={phase.id}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    <div
                      className="mt-1 h-4 w-4 rounded-full shrink-0"
                      style={{
                        backgroundColor: phase.farbe || '#3b82f6',
                      }}
                    />
                    {bearbeitungsPhase === phase.id ? (
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input
                            value={bearbeitungsForm.name}
                            onChange={(e) =>
                              setBearbeitungsForm({
                                ...bearbeitungsForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="Phasenname"
                          />
                          <Input
                            value={bearbeitungsForm.schwerpunkt}
                            onChange={(e) =>
                              setBearbeitungsForm({
                                ...bearbeitungsForm,
                                schwerpunkt: e.target.value,
                              })
                            }
                            placeholder="Schwerpunkt"
                          />
                          <Input
                            type="date"
                            value={bearbeitungsForm.startDatum}
                            onChange={(e) =>
                              setBearbeitungsForm({
                                ...bearbeitungsForm,
                                startDatum: e.target.value,
                              })
                            }
                          />
                          <Input
                            type="date"
                            value={bearbeitungsForm.endDatum}
                            onChange={(e) =>
                              setBearbeitungsForm({
                                ...bearbeitungsForm,
                                endDatum: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <label className="text-sm font-medium self-center">
                            Farbe:
                          </label>
                          {STANDARD_FARBEN.map((f) => (
                            <button
                              key={f}
                              onClick={() =>
                                setBearbeitungsForm({
                                  ...bearbeitungsForm,
                                  farbe: f,
                                })
                              }
                              className={`h-6 w-6 rounded-full border-2 ${
                                bearbeitungsForm.farbe === f
                                  ? 'border-foreground'
                                  : 'border-transparent'
                              }`}
                              style={{ backgroundColor: f }}
                            />
                          ))}
                        </div>
                        <Textarea
                          value={bearbeitungsForm.notizen}
                          onChange={(e) =>
                            setBearbeitungsForm({
                              ...bearbeitungsForm,
                              notizen: e.target.value,
                            })
                          }
                          placeholder="Notizen..."
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => phaseAktualisieren(phase.id)}
                            disabled={laed}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Speichern
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBearbeitungsPhase(null)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{phase.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(phase.startDatum).toLocaleDateString(
                                'de-DE',
                              )}{' '}
                              -{' '}
                              {new Date(phase.endDatum).toLocaleDateString(
                                'de-DE',
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => bearbeitungStarten(phase)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => phaseLoeschen(phase.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {phase.schwerpunkt && (
                          <Badge variant="secondary" className="mt-1">
                            {phase.schwerpunkt}
                          </Badge>
                        )}
                        {phase.notizen && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {phase.notizen}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Neue Phase Formular */}
                {neuPhaseModus === plan.id && (
                  <div className="rounded-lg border border-dashed p-4 space-y-3">
                    <h5 className="text-sm font-medium">Neue Phase</h5>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        value={phaseForm.name}
                        onChange={(e) =>
                          setPhaseForm({
                            ...phaseForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="z.B. Vorbereitung, Hinrunde..."
                      />
                      <Input
                        value={phaseForm.schwerpunkt}
                        onChange={(e) =>
                          setPhaseForm({
                            ...phaseForm,
                            schwerpunkt: e.target.value,
                          })
                        }
                        placeholder="Schwerpunkt (z.B. Kondition)"
                      />
                      <Input
                        type="date"
                        value={phaseForm.startDatum}
                        onChange={(e) =>
                          setPhaseForm({
                            ...phaseForm,
                            startDatum: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="date"
                        value={phaseForm.endDatum}
                        onChange={(e) =>
                          setPhaseForm({
                            ...phaseForm,
                            endDatum: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="text-sm font-medium self-center">
                        Farbe:
                      </label>
                      {STANDARD_FARBEN.map((f) => (
                        <button
                          key={f}
                          onClick={() =>
                            setPhaseForm({ ...phaseForm, farbe: f })
                          }
                          className={`h-6 w-6 rounded-full border-2 ${
                            phaseForm.farbe === f
                              ? 'border-foreground'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: f }}
                        />
                      ))}
                    </div>
                    <Textarea
                      value={phaseForm.notizen}
                      onChange={(e) =>
                        setPhaseForm({
                          ...phaseForm,
                          notizen: e.target.value,
                        })
                      }
                      placeholder="Notizen..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => phaseHinzufuegen(plan.id)}
                        disabled={laed}
                        className="gap-1"
                      >
                        <Save className="h-3 w-3" />
                        {laed ? 'Wird gespeichert...' : 'Hinzufuegen'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setNeuPhaseModus(null)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
