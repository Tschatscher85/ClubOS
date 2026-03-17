'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Plus, Trash2, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function NachrichtenPage() {
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const { benutzer } = useAuth();

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
        <Button onClick={() => setFormularOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Nachricht
        </Button>
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
    </div>
  );
}
