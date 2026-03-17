'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserCog, Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
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
import { useBenutzer } from '@/hooks/use-auth';

interface Benutzer {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  createdAt: string;
}

const ROLLEN_BADGE: Record<string, { farbe: string; label: string }> = {
  SUPERADMIN: { farbe: 'bg-red-100 text-red-800', label: 'Superadmin' },
  ADMIN: { farbe: 'bg-blue-100 text-blue-800', label: 'Admin' },
  TRAINER: { farbe: 'bg-green-100 text-green-800', label: 'Trainer' },
  MEMBER: { farbe: 'bg-gray-100 text-gray-800', label: 'Mitglied' },
  PARENT: { farbe: 'bg-purple-100 text-purple-800', label: 'Elternteil' },
};

export default function MitarbeiterPage() {
  const aktuellBenutzer = useBenutzer();
  const [benutzer, setBenutzer] = useState<Benutzer[]>([]);
  const [ladend, setLadend] = useState(true);

  // Neuer Benutzer Dialog
  const [neuDialogOffen, setNeuDialogOffen] = useState(false);
  const [neuEmail, setNeuEmail] = useState('');
  const [neuPasswort, setNeuPasswort] = useState('');
  const [neuRolle, setNeuRolle] = useState('TRAINER');
  const [neuSpeichernd, setNeuSpeichernd] = useState(false);

  // Bearbeiten Dialog
  const [bearbeitenDialogOffen, setBearbeitenDialogOffen] = useState(false);
  const [bearbeitenBenutzer, setBearbeitenBenutzer] = useState<Benutzer | null>(null);
  const [bearbeitenEmail, setBearbeitenEmail] = useState('');
  const [bearbeitenRolle, setBearbeitenRolle] = useState('');
  const [bearbeitenSpeichernd, setBearbeitenSpeichernd] = useState(false);

  // Passwort Dialog
  const [passwortDialogOffen, setPasswortDialogOffen] = useState(false);
  const [passwortBenutzerId, setPasswortBenutzerId] = useState('');
  const [neuesPasswort, setNeuesPasswort] = useState('');
  const [passwortSpeichernd, setPasswortSpeichernd] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Benutzer[]>('/benutzer');
      setBenutzer(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  // Zugriffskontrolle
  if (aktuellBenutzer && !['SUPERADMIN', 'ADMIN'].includes(aktuellBenutzer.rolle)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Kein Zugriff auf diese Seite.</p>
      </div>
    );
  }

  const handleNeuErstellen = async () => {
    if (!neuEmail || neuPasswort.length < 8) return;
    setNeuSpeichernd(true);
    try {
      await apiClient.post('/benutzer', {
        email: neuEmail,
        passwort: neuPasswort,
        rolle: neuRolle,
      });
      setNeuDialogOffen(false);
      setNeuEmail('');
      setNeuPasswort('');
      setNeuRolle('TRAINER');
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    } finally {
      setNeuSpeichernd(false);
    }
  };

  const handleBearbeitenOeffnen = (b: Benutzer) => {
    setBearbeitenBenutzer(b);
    setBearbeitenEmail(b.email);
    setBearbeitenRolle(b.role);
    setBearbeitenDialogOffen(true);
  };

  const handleBearbeitenSpeichern = async () => {
    if (!bearbeitenBenutzer) return;
    setBearbeitenSpeichernd(true);
    try {
      await apiClient.put(`/benutzer/${bearbeitenBenutzer.id}`, {
        email: bearbeitenEmail,
        rolle: bearbeitenRolle,
      });
      setBearbeitenDialogOffen(false);
      setBearbeitenBenutzer(null);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Bearbeiten:', error);
    } finally {
      setBearbeitenSpeichernd(false);
    }
  };

  const handlePasswortOeffnen = (id: string) => {
    setPasswortBenutzerId(id);
    setNeuesPasswort('');
    setPasswortDialogOffen(true);
  };

  const handlePasswortSpeichern = async () => {
    if (neuesPasswort.length < 8) return;
    setPasswortSpeichernd(true);
    try {
      await apiClient.put(`/benutzer/${passwortBenutzerId}/passwort`, {
        neuesPasswort,
      });
      setPasswortDialogOffen(false);
      setNeuesPasswort('');
    } catch (error) {
      console.error('Fehler beim Passwort-Reset:', error);
    } finally {
      setPasswortSpeichernd(false);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Benutzer wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.')) return;
    try {
      await apiClient.delete(`/benutzer/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Benutzer werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Mitarbeiter & Benutzer</h1>
            <p className="text-muted-foreground">
              Benutzerkonten und Rollen verwalten
            </p>
          </div>
        </div>
        <Button onClick={() => setNeuDialogOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Benutzer-Liste */}
      {benutzer.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Benutzer vorhanden.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left font-medium">E-Mail</th>
                <th className="h-12 px-4 text-left font-medium">Rolle</th>
                <th className="h-12 px-4 text-left font-medium hidden md:table-cell">
                  Erstellt am
                </th>
                <th className="h-12 px-4 text-right font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {benutzer.map((b) => {
                const rollenInfo = ROLLEN_BADGE[b.role] || {
                  farbe: 'bg-gray-100 text-gray-800',
                  label: b.role,
                };
                return (
                  <tr key={b.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{b.email}</td>
                    <td className="px-4 py-3">
                      <Badge className={rollenInfo.farbe}>
                        {rollenInfo.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Bearbeiten"
                          onClick={() => handleBearbeitenOeffnen(b)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Passwort zuruecksetzen"
                          onClick={() => handlePasswortOeffnen(b.id)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Loeschen"
                          onClick={() => handleLoeschen(b.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Neuer Benutzer Dialog */}
      <Dialog open={neuDialogOffen} onOpenChange={setNeuDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Benutzer</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Benutzerkonto mit E-Mail, Passwort und Rolle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="neu-email">E-Mail *</Label>
              <Input
                id="neu-email"
                type="email"
                value={neuEmail}
                onChange={(e) => setNeuEmail(e.target.value)}
                placeholder="benutzer@verein.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neu-passwort">Passwort * (mind. 8 Zeichen)</Label>
              <Input
                id="neu-passwort"
                type="password"
                value={neuPasswort}
                onChange={(e) => setNeuPasswort(e.target.value)}
                placeholder="Sicheres Passwort"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neu-rolle">Rolle</Label>
              <Select
                id="neu-rolle"
                value={neuRolle}
                onChange={(e) => setNeuRolle(e.target.value)}
              >
                <option value="ADMIN">Admin</option>
                <option value="TRAINER">Trainer</option>
                <option value="MEMBER">Mitglied</option>
                <option value="PARENT">Elternteil</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setNeuDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleNeuErstellen}
                disabled={!neuEmail || neuPasswort.length < 8 || neuSpeichernd}
              >
                {neuSpeichernd ? 'Wird erstellt...' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bearbeiten Dialog */}
      <Dialog open={bearbeitenDialogOffen} onOpenChange={setBearbeitenDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>
              Aendern Sie die E-Mail-Adresse oder die Rolle des Benutzers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="bearbeiten-email">E-Mail</Label>
              <Input
                id="bearbeiten-email"
                type="email"
                value={bearbeitenEmail}
                onChange={(e) => setBearbeitenEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bearbeiten-rolle">Rolle</Label>
              <Select
                id="bearbeiten-rolle"
                value={bearbeitenRolle}
                onChange={(e) => setBearbeitenRolle(e.target.value)}
              >
                <option value="ADMIN">Admin</option>
                <option value="TRAINER">Trainer</option>
                <option value="MEMBER">Mitglied</option>
                <option value="PARENT">Elternteil</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setBearbeitenDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleBearbeitenSpeichern}
                disabled={bearbeitenSpeichernd}
              >
                {bearbeitenSpeichernd ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Passwort zuruecksetzen Dialog */}
      <Dialog open={passwortDialogOffen} onOpenChange={setPasswortDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort zuruecksetzen</DialogTitle>
            <DialogDescription>
              Geben Sie ein neues Passwort fuer den Benutzer ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="neues-passwort">
                Neues Passwort (mind. 8 Zeichen)
              </Label>
              <Input
                id="neues-passwort"
                type="password"
                value={neuesPasswort}
                onChange={(e) => setNeuesPasswort(e.target.value)}
                placeholder="Neues sicheres Passwort"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPasswortDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handlePasswortSpeichern}
                disabled={neuesPasswort.length < 8 || passwortSpeichernd}
              >
                {passwortSpeichernd ? 'Wird gespeichert...' : 'Passwort setzen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
