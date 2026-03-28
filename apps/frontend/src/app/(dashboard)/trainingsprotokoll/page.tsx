'use client';

import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Plus, Trash2, Users, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

interface Team {
  id: string;
  name: string;
  ageGroup: string;
}

interface TeamMitglied {
  id: string;
  memberId: string;
  member: { id: string; firstName: string; lastName: string };
}

interface Protokoll {
  id: string;
  teamId: string;
  datum: string;
  dauer: number;
  thema: string;
  inhalt: string | null;
  notizen: string | null;
  teilnehmer: Array<{ memberId: string; anwesend: boolean }>;
  team: { name: string; ageGroup: string };
}

export default function TrainingsprotokollSeite() {
  const benutzer = useBenutzer();
  const istBerechtigt = benutzer && ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  const [teams, setTeams] = useState<Team[]>([]);
  const [gewaehlterTeamId, setGewaehlterTeamId] = useState('');
  const [protokolle, setProtokolle] = useState<Protokoll[]>([]);
  const [ladend, setLadend] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);

  // Formular
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [dauer, setDauer] = useState('90');
  const [thema, setThema] = useState('');
  const [inhalt, setInhalt] = useState('');
  const [notizen, setNotizen] = useState('');
  const [teamMitglieder, setTeamMitglieder] = useState<TeamMitglied[]>([]);
  const [anwesenheit, setAnwesenheit] = useState<Record<string, boolean>>({});
  const [speichernd, setSpeichernd] = useState(false);

  useEffect(() => {
    apiClient.get<Team[]>('/teams').then((t) => {
      setTeams(t);
      if (t.length > 0) setGewaehlterTeamId(t[0].id);
    }).catch(() => {});
  }, []);

  const protokolleLaden = useCallback(async () => {
    if (!gewaehlterTeamId) return;
    setLadend(true);
    try {
      const daten = await apiClient.get<Protokoll[]>(`/trainingsprotokolle/${gewaehlterTeamId}`);
      setProtokolle(daten);
    } catch { /* ignore */ }
    setLadend(false);
  }, [gewaehlterTeamId]);

  useEffect(() => { protokolleLaden(); }, [protokolleLaden]);

  const dialogOeffnen = async () => {
    if (!gewaehlterTeamId) return;
    try {
      const mitglieder = await apiClient.get<TeamMitglied[]>(`/teams/${gewaehlterTeamId}/mitglieder`);
      setTeamMitglieder(mitglieder);
      const init: Record<string, boolean> = {};
      mitglieder.forEach((m) => { init[m.memberId] = true; });
      setAnwesenheit(init);
    } catch { setTeamMitglieder([]); }
    setDialogOffen(true);
  };

  const handleErstellen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thema.trim()) return;
    setSpeichernd(true);
    try {
      const teilnehmer = Object.entries(anwesenheit).map(([memberId, anwesend]) => ({ memberId, anwesend }));
      await apiClient.post(`/trainingsprotokolle/${gewaehlterTeamId}`, {
        datum,
        dauer: parseInt(dauer),
        thema: thema.trim(),
        inhalt: inhalt.trim() || undefined,
        notizen: notizen.trim() || undefined,
        teilnehmer,
      });
      toast.success('Trainingsprotokoll gespeichert');
      setDialogOffen(false);
      setThema('');
      setInhalt('');
      setNotizen('');
      protokolleLaden();
    } catch { toast.error('Fehler beim Speichern'); }
    setSpeichernd(false);
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Protokoll wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/trainingsprotokolle/${id}`);
      protokolleLaden();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Trainingsprotokoll</h1>
            <p className="text-muted-foreground">Was wurde trainiert, wer war da</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={gewaehlterTeamId} onChange={(e) => setGewaehlterTeamId(e.target.value)} className="w-48">
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.ageGroup})</option>)}
          </Select>
          {istBerechtigt && (
            <Button onClick={dialogOeffnen}>
              <Plus className="h-4 w-4 mr-2" />
              Protokoll
            </Button>
          )}
        </div>
      </div>

      {ladend ? (
        <div className="text-center py-12 text-muted-foreground">Laden...</div>
      ) : protokolle.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Trainingsprotokolle fuer dieses Team.
        </div>
      ) : (
        <div className="space-y-3">
          {protokolle.map((p) => {
            const anwesend = (p.teilnehmer || []).filter((t) => t.anwesend).length;
            const gesamt = (p.teilnehmer || []).length;
            return (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1">
                    <p className="font-medium">{p.thema}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.datum).toLocaleDateString('de-DE')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {p.dauer} Min.
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {anwesend}/{gesamt} anwesend
                      </span>
                    </div>
                    {p.inhalt && <p className="text-sm text-muted-foreground mt-1">{p.inhalt}</p>}
                  </div>
                  {istBerechtigt && (
                    <Button variant="ghost" size="icon" onClick={() => handleLoeschen(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Neues Protokoll */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trainingsprotokoll erstellen</DialogTitle>
            <DialogDescription>Training dokumentieren und Anwesenheit erfassen</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleErstellen} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Datum *</Label>
                <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Dauer (Min.)</Label>
                <Select value={dauer} onChange={(e) => setDauer(e.target.value)}>
                  <option value="60">60 Min.</option>
                  <option value="75">75 Min.</option>
                  <option value="90">90 Min.</option>
                  <option value="120">120 Min.</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Thema / Schwerpunkt *</Label>
              <Input value={thema} onChange={(e) => setThema(e.target.value)} placeholder="z.B. Passspiel, Pressing, Torschuss" required />
            </div>
            <div className="space-y-2">
              <Label>Trainingsinhalte</Label>
              <Textarea value={inhalt} onChange={(e) => setInhalt(e.target.value)} placeholder="Was wurde gemacht?" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea value={notizen} onChange={(e) => setNotizen(e.target.value)} placeholder="Besonderheiten, Verletzungen..." rows={2} />
            </div>

            {/* Anwesenheit */}
            {teamMitglieder.length > 0 && (
              <div className="space-y-2">
                <Label>Anwesenheit ({Object.values(anwesenheit).filter(Boolean).length}/{teamMitglieder.length})</Label>
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {teamMitglieder.map((tm) => (
                    <label key={tm.memberId} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0">
                      <input
                        type="checkbox"
                        checked={anwesenheit[tm.memberId] ?? false}
                        onChange={(e) => setAnwesenheit((prev) => ({ ...prev, [tm.memberId]: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">{tm.member.firstName} {tm.member.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOffen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={speichernd}>
                {speichernd ? 'Speichern...' : 'Protokoll speichern'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
