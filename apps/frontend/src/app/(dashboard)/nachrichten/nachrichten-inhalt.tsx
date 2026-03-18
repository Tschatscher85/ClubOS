'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Plus, Trash2, Check, CheckCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { NachrichtFormular } from '@/components/nachrichten/nachricht-formular';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

interface Nachricht {
  id: string;
  content: string;
  type: string;
  senderId: string;
  createdAt: string;
  team: { id: string; name: string } | null;
  reads: { userId: string; readAt: string }[];
}

const TYP_LABEL: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' }> = {
  BROADCAST: { text: 'Broadcast', variant: 'default' },
  ANNOUNCEMENT: { text: 'Ankuendigung', variant: 'default' },
  TEAM_CHAT: { text: 'Team-Chat', variant: 'secondary' },
  QUESTION: { text: 'Frage', variant: 'outline' },
  FAQ_ANSWER: { text: 'FAQ', variant: 'outline' },
};

function zeitFormatieren(iso: string): string {
  const d = new Date(iso);
  const jetzt = new Date();
  const diff = jetzt.getTime() - d.getTime();
  const minuten = Math.floor(diff / 60000);
  const stunden = Math.floor(diff / 3600000);

  if (minuten < 1) return 'Gerade eben';
  if (minuten < 60) return `vor ${minuten} Min.`;
  if (stunden < 24) return `vor ${stunden} Std.`;

  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NachrichtenInhalt() {
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const { benutzer } = useAuth();

  // Notfall-Broadcast
  const [notfallOffen, setNotfallOffen] = useState(false);
  const [notfallInhalt, setNotfallInhalt] = useState('');
  const [notfallBestaetigt, setNotfallBestaetigt] = useState(false);
  const [notfallSendend, setNotfallSendend] = useState(false);
  const [notfallErfolg, setNotfallErfolg] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Nachricht[]>('/nachrichten');
      setNachrichten(daten);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleGelesen = async (id: string) => {
    try {
      await apiClient.post(`/nachrichten/${id}/gelesen`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleNotfallSenden = async () => {
    if (!notfallInhalt || !notfallBestaetigt) return;
    setNotfallSendend(true);
    try {
      await apiClient.post('/nachrichten/notfall', {
        inhalt: notfallInhalt,
        bestaetigung: true,
      });
      setNotfallErfolg(true);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setNotfallSendend(false);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Nachricht loeschen?')) return;
    try {
      await apiClient.delete(`/nachrichten/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Nachrichten werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Nachrichten</h1>
            <p className="text-muted-foreground">
              {nachrichten.length} Nachrichten
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN' || benutzer?.rolle === 'TRAINER') && (
            <Button
              variant="destructive"
              onClick={() => {
                setNotfallOffen(true);
                setNotfallInhalt('');
                setNotfallBestaetigt(false);
                setNotfallErfolg(false);
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Notfall
            </Button>
          )}
          <Button onClick={() => setFormularOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Nachricht
          </Button>
        </div>
      </div>

      {nachrichten.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Nachrichten. Senden Sie die erste Nachricht an Ihr Team.
        </div>
      ) : (
        <div className="space-y-3">
          {nachrichten.map((n) => {
            const typInfo = TYP_LABEL[n.type] || { text: n.type, variant: 'outline' as const };
            const istGelesen = benutzer
              ? n.reads.some((r) => r.userId === benutzer.id)
              : false;
            const leserAnzahl = n.reads.length;

            return (
              <Card
                key={n.id}
                className={!istGelesen ? 'border-primary/30 bg-primary/5' : ''}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={typInfo.variant}>{typInfo.text}</Badge>
                        {n.team && (
                          <Badge variant="outline">{n.team.name}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {zeitFormatieren(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {leserAnzahl > 0 ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          {leserAnzahl} gelesen
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!istGelesen && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGelesen(n.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Gelesen
                        </Button>
                      )}
                      {(benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleLoeschen(n.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NachrichtFormular
        offen={formularOffen}
        onSchliessen={() => setFormularOffen(false)}
        onGesendet={datenLaden}
      />

      {/* Notfall-Broadcast Dialog */}
      <Dialog open={notfallOffen} onOpenChange={setNotfallOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Notfall-Broadcast
            </DialogTitle>
            <DialogDescription>
              Diese Nachricht wird sofort an ALLE Mitglieder gesendet — auch
              ausserhalb der Stille-Stunden (22:00-07:00).
            </DialogDescription>
          </DialogHeader>

          {notfallErfolg ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Notfall-Broadcast wurde erfolgreich an alle Mitglieder gesendet.
              </div>
              <div className="flex justify-end">
                <Button onClick={() => { setNotfallOffen(false); datenLaden(); }}>
                  Schliessen
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Achtung: Die Nachricht wird an alle Vereinsmitglieder per E-Mail
                gesendet und ignoriert die Stille-Stunden.
              </div>
              <div className="space-y-2">
                <Label>Notfall-Nachricht *</Label>
                <Textarea
                  value={notfallInhalt}
                  onChange={(e) => setNotfallInhalt(e.target.value)}
                  placeholder="z.B. Training heute wegen Unwetter abgesagt!"
                  rows={4}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notfallBestaetigt}
                  onChange={(e) => setNotfallBestaetigt(e.target.checked)}
                  className="rounded border-red-300"
                />
                <span className="text-sm font-medium text-destructive">
                  Ja, ich bestaetige, dass dies ein Notfall ist
                </span>
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNotfallOffen(false)}>
                  Abbrechen
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleNotfallSenden}
                  disabled={!notfallInhalt || notfallInhalt.length < 5 || !notfallBestaetigt || notfallSendend}
                >
                  {notfallSendend ? 'Wird gesendet...' : 'Notfall-Broadcast senden'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
