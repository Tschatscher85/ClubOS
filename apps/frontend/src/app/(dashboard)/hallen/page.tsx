'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building,
  Plus,
  Clock,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

interface Halle {
  id: string;
  name: string;
  adresse: string | null;
  kapazitaet: number | null;
}

interface Team {
  id: string;
  name: string;
  ageGroup: string;
}

interface Belegung {
  id: string;
  wochentag: string;
  von: string;
  bis: string;
  notiz: string | null;
  halle: { id: string; name: string };
  team: { id: string; name: string };
}

interface Wochenplan {
  [wochentag: string]: Belegung[];
}

const WOCHENTAGE = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
const WOCHENTAG_LABEL: Record<string, string> = {
  MO: 'Montag',
  DI: 'Dienstag',
  MI: 'Mittwoch',
  DO: 'Donnerstag',
  FR: 'Freitag',
  SA: 'Samstag',
  SO: 'Sonntag',
};

export default function HallenPage() {
  const [hallen, setHallen] = useState<Halle[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [wochenplan, setWochenplan] = useState<Wochenplan>({});
  const [ladend, setLadend] = useState(true);

  // Neue Halle
  const [halleDialogOffen, setHalleDialogOffen] = useState(false);
  const [halleName, setHalleName] = useState('');
  const [halleAdresse, setHalleAdresse] = useState('');
  const [halleKapazitaet, setHalleKapazitaet] = useState('');
  const [halleSpeichernd, setHalleSpeichernd] = useState(false);

  // Neue Belegung
  const [belegungDialogOffen, setBelegungDialogOffen] = useState(false);
  const [belegungHalleId, setBelegungHalleId] = useState('');
  const [belegungTeamId, setBelegungTeamId] = useState('');
  const [belegungWochentag, setBelegungWochentag] = useState('MO');
  const [belegungVon, setBelegungVon] = useState('18:00');
  const [belegungBis, setBelegungBis] = useState('20:00');
  const [belegungNotiz, setBelegungNotiz] = useState('');
  const [belegungSpeichernd, setBelegungSpeichernd] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const [hallenDaten, teamsDaten, wochenplanDaten] = await Promise.all([
        apiClient.get<Halle[]>('/hallen'),
        apiClient.get<Team[]>('/teams'),
        apiClient.get<Wochenplan>('/hallen/wochenplan'),
      ]);
      setHallen(hallenDaten);
      setTeams(teamsDaten);
      setWochenplan(wochenplanDaten);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleHalleErstellen = async () => {
    if (!halleName) return;
    setHalleSpeichernd(true);
    try {
      await apiClient.post('/hallen', {
        name: halleName,
        adresse: halleAdresse || undefined,
        kapazitaet: halleKapazitaet ? parseInt(halleKapazitaet) : undefined,
      });
      setHalleDialogOffen(false);
      setHalleName('');
      setHalleAdresse('');
      setHalleKapazitaet('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setHalleSpeichernd(false);
    }
  };

  const handleBelegungErstellen = async () => {
    if (!belegungHalleId || !belegungTeamId) return;
    setBelegungSpeichernd(true);
    try {
      await apiClient.post(`/hallen/${belegungHalleId}/belegung`, {
        teamId: belegungTeamId,
        wochentag: belegungWochentag,
        von: belegungVon,
        bis: belegungBis,
        notiz: belegungNotiz || undefined,
      });
      setBelegungDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setBelegungSpeichernd(false);
    }
  };

  const handleBelegungLoeschen = async (id: string) => {
    if (!confirm('Belegung loeschen?')) return;
    try {
      await apiClient.delete(`/hallen/belegung/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Belegung wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Belegung</h1>
            <p className="text-muted-foreground">
              Wochenplan fuer Sporthallen und Trainingszeiten
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHalleDialogOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Halle
          </Button>
          <Button
            onClick={() => setBelegungDialogOffen(true)}
            disabled={hallen.length === 0}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Belegung eintragen
          </Button>
        </div>
      </div>

      {/* Wochenplan */}
      {WOCHENTAGE.map((tag) => {
        const belegungen = wochenplan[tag] || [];
        if (belegungen.length === 0) return null;

        return (
          <div key={tag} className="space-y-2">
            <h2 className="text-lg font-semibold">{WOCHENTAG_LABEL[tag]}</h2>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {belegungen
                .sort((a, b) => a.von.localeCompare(b.von))
                .map((b) => (
                  <Card key={b.id} className="relative">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {b.von} – {b.bis}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{b.team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.halle.name}
                          </p>
                          {b.notiz && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {b.notiz}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleBelegungLoeschen(b.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        );
      })}

      {Object.values(wochenplan).every((arr) => arr.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Belegungen eingetragen.
          {hallen.length === 0 && ' Erstellen Sie zuerst eine Halle.'}
        </div>
      )}

      {/* Hallen-Uebersicht */}
      {hallen.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Hallen</h2>
          <div className="flex flex-wrap gap-2">
            {hallen.map((h) => (
              <Badge key={h.id} variant="secondary" className="text-sm py-1 px-3">
                {h.name}
                {h.kapazitaet && ` (${h.kapazitaet} Plaetze)`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dialog: Neue Halle */}
      <Dialog open={halleDialogOffen} onOpenChange={setHalleDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Halle</DialogTitle>
            <DialogDescription>
              Erfassen Sie eine Sporthalle oder einen Trainingsplatz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={halleName}
                onChange={(e) => setHalleName(e.target.value)}
                placeholder="z.B. Jahnhalle"
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={halleAdresse}
                onChange={(e) => setHalleAdresse(e.target.value)}
                placeholder="z.B. Sportstr. 1, 73037 Goeppingen"
              />
            </div>
            <div className="space-y-2">
              <Label>Kapazitaet</Label>
              <Input
                type="number"
                value={halleKapazitaet}
                onChange={(e) => setHalleKapazitaet(e.target.value)}
                placeholder="z.B. 200"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setHalleDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleHalleErstellen} disabled={!halleName || halleSpeichernd}>
                {halleSpeichernd ? 'Wird erstellt...' : 'Halle erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Belegung eintragen */}
      <Dialog open={belegungDialogOffen} onOpenChange={setBelegungDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Belegung eintragen</DialogTitle>
            <DialogDescription>
              Tragen Sie eine regelmaessige Trainingszeit ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Halle *</Label>
              <Select
                value={belegungHalleId}
                onChange={(e) => setBelegungHalleId(e.target.value)}
              >
                <option value="">Halle waehlen...</option>
                {hallen.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team *</Label>
              <Select
                value={belegungTeamId}
                onChange={(e) => setBelegungTeamId(e.target.value)}
              >
                <option value="">Team waehlen...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.ageGroup})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wochentag *</Label>
              <Select
                value={belegungWochentag}
                onChange={(e) => setBelegungWochentag(e.target.value)}
              >
                {WOCHENTAGE.map((tag) => (
                  <option key={tag} value={tag}>{WOCHENTAG_LABEL[tag]}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Von *</Label>
                <Input
                  type="time"
                  value={belegungVon}
                  onChange={(e) => setBelegungVon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bis *</Label>
                <Input
                  type="time"
                  value={belegungBis}
                  onChange={(e) => setBelegungBis(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notiz</Label>
              <Input
                value={belegungNotiz}
                onChange={(e) => setBelegungNotiz(e.target.value)}
                placeholder="z.B. nur in der Winterpause"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBelegungDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleBelegungErstellen}
                disabled={!belegungHalleId || !belegungTeamId || belegungSpeichernd}
              >
                {belegungSpeichernd ? 'Wird gespeichert...' : 'Eintragen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
