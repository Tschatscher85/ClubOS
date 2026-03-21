'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  UsersRound,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  X,
  Baby,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useBenutzer } from '@/hooks/use-auth';

interface FamilieMitglied {
  id: string;
  memberId: string | null;
  userId: string | null;
  rolle: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber: string;
  } | null;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
}

interface Familie {
  id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  mitglieder: FamilieMitglied[];
}

interface MitgliedOption {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

interface BenutzerOption {
  id: string;
  email: string;
  role: string;
}

const ROLLEN_LABEL: Record<string, string> = {
  KIND: 'Kind',
  MUTTER: 'Mutter',
  VATER: 'Vater',
  ERZIEHUNGSBERECHTIGTER: 'Erziehungsberechtigter',
  PARTNER: 'Partner',
};

const ROLLEN_ICON: Record<string, typeof Baby> = {
  KIND: Baby,
  MUTTER: User,
  VATER: User,
  ERZIEHUNGSBERECHTIGTER: User,
  PARTNER: Users,
};

const ROLLEN_FARBE: Record<string, string> = {
  KIND: 'bg-blue-100 text-blue-700 border-blue-300',
  MUTTER: 'bg-pink-100 text-pink-700 border-pink-300',
  VATER: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  ERZIEHUNGSBERECHTIGTER: 'bg-purple-100 text-purple-700 border-purple-300',
  PARTNER: 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

export default function FamilienPage() {
  const benutzer = useBenutzer();
  const [familien, setFamilien] = useState<Familie[]>([]);
  const [ladend, setLadend] = useState(true);
  const [expandiert, setExpandiert] = useState<Record<string, boolean>>({});

  // Neue Familie Dialog
  const [neuDialogOffen, setNeuDialogOffen] = useState(false);
  const [neuName, setNeuName] = useState('');
  const [erstellend, setErstellend] = useState(false);

  // Mitglied hinzufuegen Dialog
  const [hinzufuegenDialog, setHinzufuegenDialog] = useState<string | null>(null);
  const [hinzufuegenRolle, setHinzufuegenRolle] = useState('KIND');
  const [hinzufuegenMemberId, setHinzufuegenMemberId] = useState('');
  const [hinzufuegenUserId, setHinzufuegenUserId] = useState('');
  const [hinzufuegend, setHinzufuegend] = useState(false);

  // Verfuegbare Mitglieder und Benutzer
  const [mitglieder, setMitglieder] = useState<MitgliedOption[]>([]);
  const [benutzerListe, setBenutzerListe] = useState<BenutzerOption[]>([]);

  const istAdmin =
    benutzer && ['SUPERADMIN', 'ADMIN'].includes(benutzer.rolle);

  const datenLaden = useCallback(async () => {
    try {
      const familienDaten = await apiClient.get<Familie[]>('/familien');
      setFamilien(familienDaten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  const stammdatenLaden = useCallback(async () => {
    try {
      const [mitgliederDaten, benutzerDaten] = await Promise.all([
        apiClient.get<MitgliedOption[]>('/mitglieder').catch(() => [] as MitgliedOption[]),
        apiClient.get<BenutzerOption[]>('/benutzer').catch(() => [] as BenutzerOption[]),
      ]);
      setMitglieder(mitgliederDaten);
      setBenutzerListe(benutzerDaten);
    } catch {
      // Ignorieren
    }
  }, []);

  useEffect(() => {
    datenLaden();
    stammdatenLaden();
  }, [datenLaden, stammdatenLaden]);

  const handleNeueFamilie = async () => {
    setErstellend(true);
    try {
      await apiClient.post('/familien', { name: neuName.trim() || undefined });
      setNeuDialogOffen(false);
      setNeuName('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setErstellend(false);
    }
  };

  const handleMitgliedHinzufuegen = async () => {
    if (!hinzufuegenDialog) return;
    const istKind = hinzufuegenRolle === 'KIND';

    if (istKind && !hinzufuegenMemberId) return;
    if (!istKind && !hinzufuegenUserId) return;

    setHinzufuegend(true);
    try {
      await apiClient.post(`/familien/${hinzufuegenDialog}/mitglied`, {
        memberId: istKind ? hinzufuegenMemberId : undefined,
        userId: !istKind ? hinzufuegenUserId : undefined,
        rolle: hinzufuegenRolle,
      });
      setHinzufuegenDialog(null);
      setHinzufuegenMemberId('');
      setHinzufuegenUserId('');
      setHinzufuegenRolle('KIND');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setHinzufuegend(false);
    }
  };

  const handleMitgliedEntfernen = async (familieId: string, fmId: string) => {
    if (!confirm('Familienmitglied wirklich entfernen?')) return;
    try {
      await apiClient.delete(`/familien/${familieId}/mitglied/${fmId}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleFamilieLoeschen = async (id: string) => {
    if (!confirm('Familie und alle Zuordnungen wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/familien/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const toggleExpandiert = (id: string) => {
    setExpandiert((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Familien werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersRound className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Familien</h1>
            <p className="text-muted-foreground">
              Familien verwalten und Eltern-Kind-Zuordnungen pflegen
            </p>
          </div>
        </div>
        {istAdmin && (
          <Button onClick={() => setNeuDialogOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Familie
          </Button>
        )}
      </div>

      {/* Statistik */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Familien gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{familien.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kinder zugeordnet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {familien.reduce(
                (sum, f) => sum + f.mitglieder.filter((m) => m.rolle === 'KIND').length,
                0,
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eltern verknuepft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">
              {familien.reduce(
                (sum, f) =>
                  sum + f.mitglieder.filter((m) => m.rolle !== 'KIND').length,
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Familien-Liste */}
      {familien.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UsersRound className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-1">Noch keine Familien angelegt</p>
          <p className="text-sm">
            Erstellen Sie Familien, um Eltern und Kinder zu verknuepfen.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {familien.map((familie) => {
            const kinder = familie.mitglieder.filter((m) => m.rolle === 'KIND');
            const eltern = familie.mitglieder.filter((m) => m.rolle !== 'KIND');
            const isExpanded = expandiert[familie.id];

            return (
              <Card key={familie.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{familie.name}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{familie.mitglieder.length} Mitglieder</span>
                        <span>{kinder.length} {kinder.length === 1 ? 'Kind' : 'Kinder'}</span>
                        <span>{eltern.length} {eltern.length === 1 ? 'Elternteil' : 'Elternteile'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {istAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setHinzufuegenDialog(familie.id);
                              setHinzufuegenRolle('KIND');
                            }}
                            title="Mitglied hinzufuegen"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFamilieLoeschen(familie.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Kurzansicht: Kinder und Eltern */}
                  <div className="flex flex-wrap gap-2">
                    {kinder.map((fm) => (
                      <Badge
                        key={fm.id}
                        className={`${ROLLEN_FARBE.KIND} border`}
                      >
                        <Baby className="h-3 w-3 mr-1" />
                        {fm.member
                          ? `${fm.member.firstName} ${fm.member.lastName}`
                          : 'Unbekannt'}
                      </Badge>
                    ))}
                    {eltern.map((fm) => (
                      <Badge
                        key={fm.id}
                        className={`${ROLLEN_FARBE[fm.rolle] || ROLLEN_FARBE.PARTNER} border`}
                      >
                        <User className="h-3 w-3 mr-1" />
                        {ROLLEN_LABEL[fm.rolle] || fm.rolle}
                        {fm.user ? `: ${fm.user.email}` : ''}
                      </Badge>
                    ))}
                  </div>

                  {/* Expandieren */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpandiert(familie.id)}
                    className="w-full"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Weniger anzeigen
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Details anzeigen
                      </>
                    )}
                  </Button>

                  {/* Expandierte Detailansicht */}
                  {isExpanded && (
                    <div className="rounded-lg border p-3 space-y-2">
                      {familie.mitglieder.map((fm) => {
                        const RolleIcon = ROLLEN_ICON[fm.rolle] || User;
                        return (
                          <div
                            key={fm.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <RolleIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                {fm.member ? (
                                  <p className="text-sm font-medium">
                                    {fm.member.firstName} {fm.member.lastName}
                                    <span className="text-muted-foreground ml-2 text-xs">
                                      ({fm.member.memberNumber})
                                    </span>
                                  </p>
                                ) : fm.user ? (
                                  <p className="text-sm font-medium">
                                    {fm.user.email}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Unbekannt
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${ROLLEN_FARBE[fm.rolle] || ''} border text-xs`}
                              >
                                {ROLLEN_LABEL[fm.rolle] || fm.rolle}
                              </Badge>
                              {istAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleMitgliedEntfernen(familie.id, fm.id)
                                  }
                                >
                                  <X className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Neue Familie */}
      <Dialog open={neuDialogOffen} onOpenChange={setNeuDialogOffen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Familie erstellen</DialogTitle>
            <DialogDescription>
              Geben Sie optional einen Namen an. Sonst wird er automatisch
              nach dem ersten zugeordneten Mitglied benannt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Familienname (optional)</Label>
              <Input
                value={neuName}
                onChange={(e) => setNeuName(e.target.value)}
                placeholder="z.B. Familie Mueller"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNeuDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleNeueFamilie} disabled={erstellend}>
                {erstellend ? 'Wird erstellt...' : 'Familie erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Mitglied hinzufuegen */}
      <Dialog
        open={!!hinzufuegenDialog}
        onOpenChange={(open) => !open && setHinzufuegenDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Familienmitglied hinzufuegen</DialogTitle>
            <DialogDescription>
              Waehlen Sie die Rolle und die Person aus.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rolle</Label>
              <select
                value={hinzufuegenRolle}
                onChange={(e) => {
                  setHinzufuegenRolle(e.target.value);
                  setHinzufuegenMemberId('');
                  setHinzufuegenUserId('');
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="KIND">Kind (Mitglied)</option>
                <option value="MUTTER">Mutter (Benutzer)</option>
                <option value="VATER">Vater (Benutzer)</option>
                <option value="ERZIEHUNGSBERECHTIGTER">
                  Erziehungsberechtigter (Benutzer)
                </option>
                <option value="PARTNER">Partner (Benutzer)</option>
              </select>
            </div>

            {hinzufuegenRolle === 'KIND' ? (
              <div className="space-y-2">
                <Label>Mitglied auswaehlen</Label>
                <select
                  value={hinzufuegenMemberId}
                  onChange={(e) => setHinzufuegenMemberId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Mitglied waehlen...</option>
                  {mitglieder.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.memberNumber})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Benutzer auswaehlen</Label>
                <select
                  value={hinzufuegenUserId}
                  onChange={(e) => setHinzufuegenUserId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Benutzer waehlen...</option>
                  {benutzerListe.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.email} ({b.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setHinzufuegenDialog(null)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleMitgliedHinzufuegen}
                disabled={
                  hinzufuegend ||
                  (hinzufuegenRolle === 'KIND'
                    ? !hinzufuegenMemberId
                    : !hinzufuegenUserId)
                }
              >
                {hinzufuegend ? 'Wird hinzugefuegt...' : 'Hinzufuegen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
