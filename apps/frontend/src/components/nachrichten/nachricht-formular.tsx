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
}

interface NachrichtFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGesendet: () => void;
}

export function NachrichtFormular({
  offen,
  onSchliessen,
  onGesendet,
}: NachrichtFormularProps) {
  const [inhalt, setInhalt] = useState('');
  const [typ, setTyp] = useState('BROADCAST');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    if (offen) {
      apiClient
        .get<Team[]>('/teams')
        .then((daten) => {
          setTeams(daten);
          if (daten.length > 0 && !teamId) {
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
      await apiClient.post('/nachrichten', {
        inhalt,
        typ,
        ...(typ !== 'ANNOUNCEMENT' && teamId && { teamId }),
      });
      onGesendet();
      onSchliessen();
      setInhalt('');
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Senden.');
    } finally {
      setLadend(false);
    }
  };

  return (
    <Dialog open={offen} onOpenChange={onSchliessen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Nachricht</DialogTitle>
          <DialogDescription>
            Nachricht an Team oder den gesamten Verein senden
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={typ} onChange={(e) => setTyp(e.target.value)}>
                <option value="BROADCAST">Broadcast (Team)</option>
                <option value="ANNOUNCEMENT">Ankuendigung (Alle)</option>
                <option value="TEAM_CHAT">Team-Chat</option>
              </Select>
            </div>
            {typ !== 'ANNOUNCEMENT' && (
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nachricht *</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={inhalt}
              onChange={(e) => setInhalt(e.target.value)}
              placeholder="Nachricht eingeben..."
              required
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Stille-Stunden: Keine Push-Benachrichtigungen zwischen 22:00 und 07:00 Uhr
          </p>

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
              {ladend ? 'Senden...' : 'Senden'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
