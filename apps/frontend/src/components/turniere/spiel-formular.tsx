'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

interface SpielFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  turnierId: string;
}

export function SpielFormular({
  offen,
  onSchliessen,
  onGespeichert,
  turnierId,
}: SpielFormularProps) {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [zeit, setZeit] = useState('');
  const [feld, setFeld] = useState('');
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    try {
      await apiClient.post(`/turniere/${turnierId}/spiele`, {
        team1,
        team2,
        ...(zeit && { zeit: new Date(zeit).toISOString() }),
        ...(feld && { feld }),
      });
      onGespeichert();
      onSchliessen();
      setTeam1('');
      setTeam2('');
      setZeit('');
      setFeld('');
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
          <DialogTitle>Spiel hinzufuegen</DialogTitle>
          <DialogDescription>Spielpaarung zum Turnier hinzufuegen</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Team 1 *</Label>
              <Input
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                placeholder="FC Kunchen"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Team 2 *</Label>
              <Input
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                placeholder="TSV Rechberg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Anstosszeit</Label>
              <Input
                type="datetime-local"
                value={zeit}
                onChange={(e) => setZeit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Spielfeld</Label>
              <Input
                value={feld}
                onChange={(e) => setFeld(e.target.value)}
                placeholder="Platz 1"
              />
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
              {ladend ? 'Hinzufuegen...' : 'Spiel hinzufuegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
