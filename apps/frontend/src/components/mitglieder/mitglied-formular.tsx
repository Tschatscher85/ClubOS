'use client';

import { useState } from 'react';
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

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  sport: string[];
  parentEmail: string | null;
  status: string;
}

interface MitgliedFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  mitglied?: Mitglied | null;
}

const SPORTARTEN = [
  'FUSSBALL',
  'HANDBALL',
  'BASKETBALL',
  'FOOTBALL',
  'TENNIS',
  'TURNEN',
  'SCHWIMMEN',
  'LEICHTATHLETIK',
  'SONSTIGES',
];

const SPORTARTEN_LABEL: Record<string, string> = {
  FUSSBALL: 'Fussball',
  HANDBALL: 'Handball',
  BASKETBALL: 'Basketball',
  FOOTBALL: 'Football',
  TENNIS: 'Tennis',
  TURNEN: 'Turnen',
  SCHWIMMEN: 'Schwimmen',
  LEICHTATHLETIK: 'Leichtathletik',
  SONSTIGES: 'Sonstiges',
};

export function MitgliedFormular({
  offen,
  onSchliessen,
  onGespeichert,
  mitglied,
}: MitgliedFormularProps) {
  const istBearbeitung = !!mitglied;

  const [vorname, setVorname] = useState(mitglied?.firstName || '');
  const [nachname, setNachname] = useState(mitglied?.lastName || '');
  const [geburtsdatum, setGeburtsdatum] = useState(
    mitglied?.birthDate ? mitglied.birthDate.split('T')[0] : '',
  );
  const [telefon, setTelefon] = useState(mitglied?.phone || '');
  const [adresse, setAdresse] = useState(mitglied?.address || '');
  const [sportart, setSportart] = useState(mitglied?.sport?.[0] || 'FUSSBALL');
  const [elternEmail, setElternEmail] = useState(mitglied?.parentEmail || '');
  const [status, setStatus] = useState(mitglied?.status || 'PENDING');
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    try {
      const daten = {
        vorname,
        nachname,
        ...(geburtsdatum && { geburtsdatum }),
        ...(telefon && { telefon }),
        ...(adresse && { adresse }),
        sportarten: [sportart],
        ...(elternEmail && { elternEmail }),
        ...(istBearbeitung && { status }),
      };

      if (istBearbeitung && mitglied) {
        await apiClient.put(`/mitglieder/${mitglied.id}`, daten);
      } else {
        await apiClient.post('/mitglieder', daten);
      }

      onGespeichert();
      onSchliessen();
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Speichern.',
      );
    } finally {
      setLadend(false);
    }
  };

  return (
    <Dialog open={offen} onOpenChange={onSchliessen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {istBearbeitung ? 'Mitglied bearbeiten' : 'Neues Mitglied anlegen'}
          </DialogTitle>
          <DialogDescription>
            {istBearbeitung
              ? 'Mitgliedsdaten aktualisieren'
              : 'Erfassen Sie die Daten des neuen Mitglieds'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vorname">Vorname *</Label>
              <Input
                id="vorname"
                value={vorname}
                onChange={(e) => setVorname(e.target.value)}
                placeholder="Max"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nachname">Nachname *</Label>
              <Input
                id="nachname"
                value={nachname}
                onChange={(e) => setNachname(e.target.value)}
                placeholder="Mustermann"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
            <Input
              id="geburtsdatum"
              type="date"
              value={geburtsdatum}
              onChange={(e) => setGeburtsdatum(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input
              id="telefon"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="+49 176 12345678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Musterstr. 1, 73037 Goeppingen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sportart">Sportart</Label>
            <Select
              id="sportart"
              value={sportart}
              onChange={(e) => setSportart(e.target.value)}
            >
              {SPORTARTEN.map((s) => (
                <option key={s} value={s}>
                  {SPORTARTEN_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="elternEmail">Eltern-E-Mail (bei Jugendlichen)</Label>
            <Input
              id="elternEmail"
              type="email"
              value={elternEmail}
              onChange={(e) => setElternEmail(e.target.value)}
              placeholder="eltern@beispiel.de"
            />
          </div>

          {istBearbeitung && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PENDING">Ausstehend</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Inaktiv</option>
                <option value="CANCELLED">Ausgetreten</option>
              </Select>
            </div>
          )}

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
              {ladend ? 'Speichern...' : istBearbeitung ? 'Aktualisieren' : 'Anlegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
