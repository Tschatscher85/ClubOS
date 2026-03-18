'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  UserCheck,
  AlertTriangle,
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
import { useAuth } from '@/hooks/use-auth';

interface Einteilung {
  id: string;
  eventId: string;
  memberId: string;
  status: string;
  bestaetigt: boolean;
  notiz: string | null;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
}

const STATUS_FARBE: Record<string, string> = {
  EINGETEILT: 'bg-blue-100 text-blue-800',
  BESTAETIGT: 'bg-green-100 text-green-800',
  ABGELEHNT: 'bg-red-100 text-red-800',
  ERSATZ: 'bg-orange-100 text-orange-800',
};

const STATUS_LABEL: Record<string, string> = {
  EINGETEILT: 'Eingeteilt',
  BESTAETIGT: 'Bestaetigt',
  ABGELEHNT: 'Abgelehnt',
  ERSATZ: 'Ersatz',
};

export default function SchiedsrichterPage() {
  const { benutzer } = useAuth();
  const [einteilungen, setEinteilungen] = useState<Einteilung[]>([]);
  const [ladend, setLadend] = useState(true);

  // Manuell einteilen
  const [dialogOffen, setDialogOffen] = useState(false);
  const [eventId, setEventId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [notiz, setNotiz] = useState('');
  const [speichernd, setSpeichernd] = useState(false);

  const istAdmin =
    benutzer?.rolle === 'ADMIN' ||
    benutzer?.rolle === 'SUPERADMIN' ||
    benutzer?.rolle === 'TRAINER';

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Einteilung[]>('/schiedsrichter');
      setEinteilungen(daten);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleEinteilen = async () => {
    if (!eventId || !memberId) return;
    setSpeichernd(true);
    try {
      await apiClient.post('/schiedsrichter', {
        eventId,
        memberId,
        notiz: notiz || undefined,
      });
      setDialogOffen(false);
      setEventId('');
      setMemberId('');
      setNotiz('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setSpeichernd(false);
    }
  };

  const handleAutoEinteilen = async (eId: string) => {
    try {
      await apiClient.post(`/schiedsrichter/auto/${eId}`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleBestaetigen = async (id: string) => {
    try {
      await apiClient.post(`/schiedsrichter/${id}/bestaetigen`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleAblehnen = async (id: string) => {
    try {
      await apiClient.post(`/schiedsrichter/${id}/ablehnen`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Schiedsrichter-Einteilung wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Schiedsrichter-Einteilung</h1>
            <p className="text-muted-foreground">
              Schiedsrichter fuer Spiele einteilen und verwalten
            </p>
          </div>
        </div>
        {istAdmin && (
          <Button onClick={() => setDialogOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Manuell einteilen
          </Button>
        )}
      </div>

      {einteilungen.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Schiedsrichter eingeteilt.
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Event</th>
                <th className="text-left p-3 font-medium">Mitglied</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Notiz</th>
                <th className="text-right p-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {einteilungen.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="p-3 text-muted-foreground">{e.eventId}</td>
                  <td className="p-3">{e.memberId}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_FARBE[e.status] || ''}`}
                    >
                      {STATUS_LABEL[e.status] || e.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{e.notiz || '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {e.status === 'EINGETEILT' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBestaetigen(e.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" />
                            Bestaetigen
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAblehnen(e.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schiedsrichter einteilen</DialogTitle>
            <DialogDescription>
              Weisen Sie einem Mitglied die Schiedsrichter-Rolle fuer ein Spiel zu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event-ID *</Label>
              <Input
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Event-ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Mitglied-ID *</Label>
              <Input
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Mitglied-ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Notiz</Label>
              <Input
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
                placeholder="z.B. Hauptschiedsrichter"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleEinteilen}
                disabled={!eventId || !memberId || speichernd}
              >
                {speichernd ? 'Wird gespeichert...' : 'Einteilen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
