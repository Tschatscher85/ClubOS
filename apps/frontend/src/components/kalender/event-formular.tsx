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
}

interface EventData {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  location: string;
  hallName: string | null;
  hallAddress: string | null;
  teamId: string;
  notes: string | null;
}

interface EventFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  event?: EventData | null;
}

const EVENT_TYPEN = [
  { wert: 'TRAINING', label: 'Training' },
  { wert: 'MATCH', label: 'Spiel' },
  { wert: 'TOURNAMENT', label: 'Turnier' },
  { wert: 'TRIP', label: 'Ausflug' },
  { wert: 'MEETING', label: 'Besprechung' },
];

export function EventFormular({
  offen,
  onSchliessen,
  onGespeichert,
  event,
}: EventFormularProps) {
  const istBearbeitung = !!event;
  const [titel, setTitel] = useState(event?.title || '');
  const [typ, setTyp] = useState(event?.type || 'TRAINING');
  const [datum, setDatum] = useState(
    event?.date ? event.date.slice(0, 16) : '',
  );
  const [endDatum, setEndDatum] = useState(
    event?.endDate ? event.endDate.slice(0, 16) : '',
  );
  const [ort, setOrt] = useState(event?.location || '');
  const [hallenName, setHallenName] = useState(event?.hallName || '');
  const [hallenAdresse, setHallenAdresse] = useState(event?.hallAddress || '');
  const [teamId, setTeamId] = useState(event?.teamId || '');
  const [notizen, setNotizen] = useState(event?.notes || '');
  const [teams, setTeams] = useState<Team[]>([]);
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    if (offen) {
      apiClient
        .get<Team[]>('/teams')
        .then((daten) => {
          setTeams(daten);
          if (!teamId && daten.length > 0) {
            setTeamId(daten[0].id);
          }
        })
        .catch(() => {});
    }
  }, [offen, teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    try {
      const daten = {
        titel,
        typ,
        datum: new Date(datum).toISOString(),
        ...(endDatum && { endDatum: new Date(endDatum).toISOString() }),
        ort,
        ...(hallenName && { hallenName }),
        ...(hallenAdresse && { hallenAdresse }),
        teamId,
        ...(notizen && { notizen }),
      };

      if (istBearbeitung && event) {
        await apiClient.put(`/veranstaltungen/${event.id}`, daten);
      } else {
        await apiClient.post('/veranstaltungen', daten);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {istBearbeitung ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung'}
          </DialogTitle>
          <DialogDescription>
            Training, Spiel oder andere Veranstaltung planen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titel">Titel *</Label>
            <Input
              id="titel"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="z.B. Training Dienstag"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typ">Typ</Label>
              <Select id="typ" value={typ} onChange={(e) => setTyp(e.target.value)}>
                {EVENT_TYPEN.map((t) => (
                  <option key={t.wert} value={t.wert}>{t.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Select id="team" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="datum">Datum & Uhrzeit *</Label>
              <Input
                id="datum"
                type="datetime-local"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDatum">Ende</Label>
              <Input
                id="endDatum"
                type="datetime-local"
                value={endDatum}
                onChange={(e) => setEndDatum(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ort">Ort *</Label>
            <Input
              id="ort"
              value={ort}
              onChange={(e) => setOrt(e.target.value)}
              placeholder="Sportplatz am Bach"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hallenName">Hallenname</Label>
              <Input
                id="hallenName"
                value={hallenName}
                onChange={(e) => setHallenName(e.target.value)}
                placeholder="Jahnhalle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hallenAdresse">Hallenadresse</Label>
              <Input
                id="hallenAdresse"
                value={hallenAdresse}
                onChange={(e) => setHallenAdresse(e.target.value)}
                placeholder="Jahnstr. 5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notizen">Notizen</Label>
            <Input
              id="notizen"
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
              placeholder="Bitte Schienbeinschoner mitbringen"
            />
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
