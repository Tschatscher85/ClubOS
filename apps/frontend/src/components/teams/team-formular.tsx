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
  abteilungId?: string | null;
}

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  userId: string | null;
}

interface Benutzer {
  id: string;
  email: string;
  role: string;
  vereinsRollen: string[];
}

interface Abteilung {
  id: string;
  name: string;
  sport: string;
}

interface TeamFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  team?: Team | null;
}

const SPORTARTEN = [
  { wert: 'FUSSBALL', label: 'Fußball' },
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
  const [name, setName] = useState('');
  const [sportart, setSportart] = useState('FUSSBALL');
  const [altersklasse, setAltersklasse] = useState('U10');
  const [trainerId, setTrainerId] = useState('');
  const [abteilungId, setAbteilungId] = useState('');
  const [trainerListe, setTrainerListe] = useState<{ id: string; name: string }[]>([]);
  const [abteilungen, setAbteilungen] = useState<Abteilung[]>([]);
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  // Daten laden + Felder setzen
  useEffect(() => {
    if (!offen) return;

    // Abteilungen laden
    apiClient.get<Abteilung[]>('/abteilungen')
      .then(setAbteilungen)
      .catch(() => {});

    // Trainer laden: Versuche Verwaltungs-API, Fallback auf /benutzer
    Promise.all([
      apiClient.get<Mitglied[]>('/mitglieder'),
      apiClient.get<Benutzer[]>('/benutzer/verwaltung/liste')
        .catch(() => apiClient.get<Benutzer[]>('/benutzer').then((users) =>
          users.map((u) => ({ ...u, vereinsRollen: [] as string[] })),
        ))
        .catch(() => [] as Benutzer[]),
    ]).then(([mitglieder, benutzerListe]) => {
      // Finde User-IDs die Trainer-Rolle haben
      const trainerUserIds = new Set(
        benutzerListe
          .filter((b) =>
            (b.vereinsRollen || []).includes('Trainer') ||
            (b.vereinsRollen || []).includes('Vorstand') ||
            ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(b.role),
          )
          .map((b) => b.id),
      );

      // Mitglieder mit Trainer-User matchen
      const trainerMitglieder = mitglieder
        .filter((m) => m.userId && trainerUserIds.has(m.userId))
        .map((m) => ({
          id: m.userId!,
          name: `${m.firstName} ${m.lastName}`,
        }));

      // Fallback: User ohne Mitglied-Profil (z.B. Admin ohne Member-Eintrag)
      const vorhandeneUserIds = new Set(trainerMitglieder.map((t) => t.id));
      const ohneProfileTrainer = benutzerListe
        .filter((b) => trainerUserIds.has(b.id) && !vorhandeneUserIds.has(b.id))
        .map((b) => ({
          id: b.id,
          name: b.email.split('@')[0],
        }));

      setTrainerListe([...trainerMitglieder, ...ohneProfileTrainer]);
    }).catch(() => {});

    // Felder setzen
    if (team) {
      setName(team.name || '');
      setSportart(team.sport || 'FUSSBALL');
      setAltersklasse(team.ageGroup || 'U10');
      setTrainerId(team.trainerId || '');
      setAbteilungId(team.abteilungId || '');
    } else {
      setName('');
      setSportart('FUSSBALL');
      setAltersklasse('U10');
      setTrainerId('');
      setAbteilungId('');
    }
    setFehler('');
  }, [offen, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    try {
      const daten = {
        name,
        sportart,
        altersklasse,
        trainerId: trainerId || undefined,
        abteilungId: abteilungId || undefined,
      };

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
            Mannschaft einer Abteilung zuordnen, Sportart und Trainer festlegen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Abteilung */}
          {abteilungen.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="abteilung">Abteilung</Label>
              <Select
                id="abteilung"
                value={abteilungId}
                onChange={(e) => {
                  setAbteilungId(e.target.value);
                  // Sportart automatisch von Abteilung übernehmen
                  const abt = abteilungen.find((a) => a.id === e.target.value);
                  if (abt?.sport) setSportart(abt.sport);
                }}
              >
                <option value="">-- Keine Abteilung --</option>
                {abteilungen.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
          )}

          {/* Teamname */}
          <div className="space-y-2">
            <Label htmlFor="teamname">Teamname *</Label>
            <Input
              id="teamname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Bambini, E-Jugend 1"
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

          {/* Trainer - zeigt Namen statt E-Mails */}
          <div className="space-y-2">
            <Label htmlFor="trainer">Trainer</Label>
            <Select
              id="trainer"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              <option value="">-- Kein Trainer zugewiesen --</option>
              {trainerListe.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            {trainerListe.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Noch keine Trainer vorhanden. Weisen Sie einem Mitglied die Rolle &quot;Trainer&quot; zu.
              </p>
            )}
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
