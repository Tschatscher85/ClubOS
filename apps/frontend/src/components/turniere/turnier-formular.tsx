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
import { sportartenLaden, sportartenFallback } from '@/lib/sportarten';

interface TurnierFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
}

export function TurnierFormular({
  offen,
  onSchliessen,
  onGespeichert,
}: TurnierFormularProps) {
  const [name, setName] = useState('');
  const [sportart, setSportart] = useState('FUSSBALL');
  const [format, setFormat] = useState('GRUPPE');
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');
  const [sportartenOptionen, setSportartenOptionen] = useState(sportartenFallback());

  useEffect(() => {
    sportartenLaden().then((daten) => {
      setSportartenOptionen(
        daten.map((s) => ({
          wert: s.istVordefiniert ? s.name.toUpperCase().replace(/[^A-Z]/g, '') || s.name : s.name,
          label: s.name,
        })),
      );
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    try {
      await apiClient.post('/turniere', { name, sportart, format });
      onGespeichert();
      onSchliessen();
      setName('');
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler.');
    } finally {
      setLadend(false);
    }
  };

  return (
    <Dialog open={offen} onOpenChange={onSchliessen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Turnier erstellen</DialogTitle>
          <DialogDescription>
            Spielplan, Livescoring und oeffentliche Anzeigetafel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="turniername">Turniername *</Label>
            <Input
              id="turniername"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Filstal-Cup 2026"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sportart</Label>
              <Select value={sportart} onChange={(e) => setSportart(e.target.value)}>
                {sportartenOptionen.map((opt) => (
                  <option key={opt.wert} value={opt.wert}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="GRUPPE">Gruppenphase</option>
                <option value="KO">KO-System</option>
                <option value="SCHWEIZER">Schweizer System</option>
                <option value="KOMBINATION">Kombination</option>
              </Select>
            </div>
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
              {ladend ? 'Erstellen...' : 'Turnier erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
