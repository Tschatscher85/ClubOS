'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

interface UmfrageAntwort {
  id: string;
  mitgliedId: string | null;
  mitgliedName: string | null;
  option: string;
  beantwortetAm: string;
}

interface Statistik {
  option: string;
  anzahl: number;
  prozent: number;
  namen: string[];
}

interface Team {
  id: string;
  name: string;
}

interface Umfrage {
  id: string;
  frage: string;
  optionen: string[];
  endetAm: string | null;
  erstelltVon: string;
  erstelltAm: string;
  team: Team | null;
  antworten: UmfrageAntwort[];
  statistiken?: Statistik[];
  token?: string;
}

const FARBEN = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export default function UmfragenPage() {
  const benutzer = useBenutzer();
  const [umfragen, setUmfragen] = useState<Umfrage[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [ladend, setLadend] = useState(true);
  const [expandiert, setExpandiert] = useState<Record<string, boolean>>({});
  const [kopiert, setKopiert] = useState<string | null>(null);

  // Dialog
  const [dialogOffen, setDialogOffen] = useState(false);
  const [frage, setFrage] = useState('');
  const [optionen, setOptionen] = useState(['', '']);
  const [teamId, setTeamId] = useState('');
  const [endetAm, setEndetAm] = useState('');
  const [speichernd, setSpeichernd] = useState(false);

  // Abstimmungs-Dialog
  const [abstimmDialog, setAbstimmDialog] = useState<Umfrage | null>(null);

  const istTrainerOderAdmin =
    benutzer &&
    ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);

  const datenLaden = useCallback(async () => {
    try {
      const [umfragenDaten, teamsDaten] = await Promise.all([
        apiClient.get<Umfrage[]>('/umfragen'),
        apiClient.get<Team[]>('/teams').catch(() => [] as Team[]),
      ]);
      setUmfragen(umfragenDaten);
      setTeams(teamsDaten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleNeu = () => {
    setFrage('');
    setOptionen(['', '']);
    setTeamId('');
    setEndetAm('');
    setDialogOffen(true);
  };

  const handleOptionHinzufuegen = () => {
    if (optionen.length < 6) {
      setOptionen([...optionen, '']);
    }
  };

  const handleOptionEntfernen = (index: number) => {
    if (optionen.length > 2) {
      setOptionen(optionen.filter((_, i) => i !== index));
    }
  };

  const handleOptionAendern = (index: number, wert: string) => {
    const neu = [...optionen];
    neu[index] = wert;
    setOptionen(neu);
  };

  const handleSpeichern = async () => {
    const gefilterteOptionen = optionen.filter((o) => o.trim().length > 0);
    if (!frage.trim() || gefilterteOptionen.length < 2) return;

    setSpeichernd(true);
    try {
      await apiClient.post('/umfragen', {
        frage: frage.trim(),
        optionen: gefilterteOptionen,
        teamId: teamId || undefined,
        endetAm: endetAm || undefined,
      });
      setDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    } finally {
      setSpeichernd(false);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Umfrage wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/umfragen/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleAbstimmen = async (umfrageId: string, option: string) => {
    try {
      const displayName = benutzer?.email;
      await apiClient.post(`/umfragen/${umfrageId}/abstimmen`, {
        option,
        mitgliedName: displayName,
      });
      setAbstimmDialog(null);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Abstimmen:', error);
    }
  };

  const handleLinkKopieren = async (umfrage: Umfrage) => {
    try {
      // Detail abrufen um Token zu bekommen
      const detail = await apiClient.get<Umfrage>(`/umfragen/${umfrage.id}`);
      const url = `${window.location.origin}/umfrage/${detail.token}`;
      await navigator.clipboard.writeText(url);
      setKopiert(umfrage.id);
      setTimeout(() => setKopiert(null), 2000);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
    }
  };

  const toggleExpandiert = (id: string) => {
    setExpandiert((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hatAbgestimmt = (umfrage: Umfrage) => {
    if (!benutzer) return false;
    return umfrage.antworten.some(
      (a) => a.mitgliedId === benutzer?.id,
    );
  };

  const istAbgelaufen = (umfrage: Umfrage) => {
    return umfrage.endetAm ? new Date() > new Date(umfrage.endetAm) : false;
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Umfragen werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Umfragen</h1>
            <p className="text-muted-foreground">
              Schnellumfragen erstellen und teilen
            </p>
          </div>
        </div>
        {istTrainerOderAdmin && (
          <Button onClick={handleNeu}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Umfrage
          </Button>
        )}
      </div>

      {/* Umfragen-Liste */}
      {umfragen.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-1">Noch keine Umfragen erstellt</p>
          <p className="text-sm">
            {istTrainerOderAdmin
              ? 'Erstellen Sie Ihre erste Umfrage, um Meinungen einzuholen.'
              : 'Aktuell gibt es keine aktiven Umfragen.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {umfragen.map((umfrage) => {
            const abgelaufen = istAbgelaufen(umfrage);
            const bereitsAbgestimmt = hatAbgestimmt(umfrage);
            const gesamt = umfrage.antworten.length;

            return (
              <Card
                key={umfrage.id}
                className={abgelaufen ? 'opacity-70' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{umfrage.frage}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {umfrage.team && (
                          <Badge variant="outline">{umfrage.team.name}</Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {gesamt} {gesamt === 1 ? 'Stimme' : 'Stimmen'}
                        </span>
                        {umfrage.endetAm && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {abgelaufen ? 'Abgelaufen' : `Endet am ${new Date(umfrage.endetAm).toLocaleDateString('de-DE')}`}
                          </span>
                        )}
                        {bereitsAbgestimmt && (
                          <Badge variant="secondary">Abgestimmt</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLinkKopieren(umfrage)}
                        title="Link teilen"
                      >
                        {kopiert === umfrage.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      {istTrainerOderAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoeschen(umfrage.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Optionen mit Fortschrittsbalken */}
                  <div className="space-y-2">
                    {umfrage.optionen.map((option, idx) => {
                      const stimmen = umfrage.antworten.filter(
                        (a) => a.option === option,
                      ).length;
                      const prozent =
                        gesamt > 0 ? Math.round((stimmen / gesamt) * 100) : 0;

                      return (
                        <div key={option} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{option}</span>
                            <span className="text-muted-foreground">
                              {stimmen} ({prozent}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${FARBEN[idx % FARBEN.length]}`}
                              style={{ width: `${prozent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Aktionen */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {!bereitsAbgestimmt && !abgelaufen && (
                      <Button
                        size="sm"
                        onClick={() => setAbstimmDialog(umfrage)}
                      >
                        Abstimmen
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpandiert(umfrage.id)}
                    >
                      {expandiert[umfrage.id] ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Weniger anzeigen
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Alle Antworten ({gesamt})
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Expandierte Einzelantworten */}
                  {expandiert[umfrage.id] && (
                    <div className="rounded-lg border p-3 space-y-1 text-sm">
                      {umfrage.antworten.length === 0 ? (
                        <p className="text-muted-foreground">
                          Noch keine Antworten.
                        </p>
                      ) : (
                        umfrage.antworten.map((antwort) => (
                          <div
                            key={antwort.id}
                            className="flex items-center justify-between py-1"
                          >
                            <span className="text-muted-foreground">
                              {antwort.mitgliedName || 'Anonym'}
                            </span>
                            <Badge variant="outline">{antwort.option}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Neue Umfrage erstellen */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Umfrage erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Schnellumfrage. Sie koennen den Link anschliessend teilen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Frage *</Label>
              <Textarea
                value={frage}
                onChange={(e) => setFrage(e.target.value)}
                placeholder="z.B. Wann soll das Sommerfest stattfinden?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Optionen * (min. 2, max. 6)</Label>
              {optionen.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionAendern(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                  />
                  {optionen.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOptionEntfernen(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {optionen.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOptionHinzufuegen}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Option hinzufuegen
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Team-Zuordnung (optional)</Label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Kein Team (vereinsweit)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Ablaufdatum (optional)</Label>
              <Input
                type="date"
                value={endetAm}
                onChange={(e) => setEndetAm(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSpeichern}
                disabled={
                  !frage.trim() ||
                  optionen.filter((o) => o.trim()).length < 2 ||
                  speichernd
                }
              >
                {speichernd ? 'Wird erstellt...' : 'Umfrage erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Abstimmen */}
      <Dialog
        open={!!abstimmDialog}
        onOpenChange={(open) => !open && setAbstimmDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{abstimmDialog?.frage}</DialogTitle>
            <DialogDescription>
              Waehlen Sie eine Option aus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {abstimmDialog?.optionen.map((option, idx) => (
              <button
                key={option}
                onClick={() =>
                  abstimmDialog && handleAbstimmen(abstimmDialog.id, option)
                }
                className={`w-full text-left rounded-lg border p-4 transition-colors hover:border-primary hover:bg-primary/5 ${FARBEN[idx % FARBEN.length].replace('bg-', 'hover:border-')}`}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
