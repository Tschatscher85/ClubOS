'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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

interface Team {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  trainerId: string;
}

interface Benutzer {
  id: string;
  email: string;
  role: string;
}

interface TeamFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  team?: Team | null;
}

const SPORTARTEN = [
  { wert: 'FUSSBALL', label: 'Fussball' },
  { wert: 'HANDBALL', label: 'Handball' },
  { wert: 'BASKETBALL', label: 'Basketball' },
  { wert: 'FOOTBALL', label: 'Football' },
  { wert: 'TENNIS', label: 'Tennis' },
  { wert: 'TURNEN', label: 'Turnen' },
  { wert: 'SCHWIMMEN', label: 'Schwimmen' },
  { wert: 'LEICHTATHLETIK', label: 'Leichtathletik' },
  { wert: 'SONSTIGES', label: 'Sonstiges' },
];

const ALTERSKLASSEN = [
  'Bambini', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12',
  'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19',
  'Senioren', 'AH',
];

export function TeamFormular({
  offen,
  onSchliessen,
  onGespeichert,
  team,
}: TeamFormularProps) {
  const istBearbeitung = !!team;
  const [name, setName] = useState(team?.name || '');
  const [sportart, setSportart] = useState(team?.sport || 'FUSSBALL');
  const [altersklasse, setAltersklasse] = useState(team?.ageGroup || 'U10');
  const [trainerId, setTrainerId] = useState(team?.trainerId || '');
  const [benutzer, setBenutzer] = useState<Benutzer[]>([]);
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    if (offen) {
      apiClient
        .get<Benutzer[]>('/benutzer')
        .then((daten) => {
          const trainer = daten.filter(
            (b) => b.role === 'TRAINER' || b.role === 'ADMIN' || b.role === 'SUPERADMIN',
          );
          setBenutzer(trainer);
          if (!trainerId && trainer.length > 0) {
            setTrainerId(trainer[0].id);
          }
        })
        .catch(() => {});
    }
  }, [offen, trainerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    try {
      const daten = { name, sportart, altersklasse, trainerId };

      if (istBearbeitung && team) {
        await apiClient.put(`/teams/${team.id}`, daten);
      } else {
        await apiClient.post('/teams', daten);
      }

      onGespeichert();
      onSchliessen();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    } finally {
      setLadend(false);
    }
  };

  return (
    <Dialog open={offen} onOpenChange={onSchliessen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {istBearbeitung ? 'Team bearbeiten' : 'Neues Team erstellen'}
          </DialogTitle>
          <DialogDescription>
            Mannschaft mit Sportart, Altersklasse und Trainer anlegen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamname">Teamname *</Label>
            <Input
              id="teamname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. E-Jugend 1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sportart">Sportart</Label>
              <Select
                id="sportart"
                value={sportart}
                onChange={(e) => setSportart(e.target.value)}
              >
                {SPORTARTEN.map((s) => (
                  <option key={s.wert} value={s.wert}>{s.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="altersklasse">Altersklasse</Label>
              <Select
                id="altersklasse"
                value={altersklasse}
                onChange={(e) => setAltersklasse(e.target.value)}
              >
                {ALTERSKLASSEN.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trainer">Trainer</Label>
            <Select
              id="trainer"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              {benutzer.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.email} ({b.role})
                </option>
              ))}
            </Select>
          </div>

          {fehler && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {fehler}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onSchliessen}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={ladend}>
              {ladend ? 'Speichern...' : istBearbeitung ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
