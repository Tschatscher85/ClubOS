'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Shield, ShieldCheck, ShieldAlert, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

interface Benutzer {
  id: string;
  email: string;
  role: string;
  istAktiv: boolean;
  berechtigungen: string[];
  letzterLogin: string | null;
  createdAt: string;
  notizen: string | null;
}

const ROLLEN_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin / Vorstand',
  TRAINER: 'Trainer / Mitarbeiter',
  MEMBER: 'Mitglied',
  PARENT: 'Elternteil',
};

const ALLE_BERECHTIGUNGEN = [
  { key: 'MITGLIEDER', label: 'Mitglieder' },
  { key: 'TEAMS', label: 'Teams' },
  { key: 'KALENDER', label: 'Kalender' },
  { key: 'TURNIERE', label: 'Turniere' },
  { key: 'NACHRICHTEN', label: 'Nachrichten' },
  { key: 'BUCHHALTUNG', label: 'Buchhaltung' },
  { key: 'FORMULARE', label: 'Formulare' },
  { key: 'DOKUMENTE', label: 'Dokumente' },
  { key: 'EINSTELLUNGEN', label: 'Einstellungen' },
  { key: 'FAHRGEMEINSCHAFTEN', label: 'Fahrgemeinschaften' },
  { key: 'HALLENBELEGUNG', label: 'Hallenbelegung' },
  { key: 'SCHIEDSRICHTER', label: 'Schiedsrichter' },
  { key: 'SPONSOREN', label: 'Sponsoren' },
  { key: 'WORKFLOWS', label: 'Workflows' },
  { key: 'HOMEPAGE', label: 'Homepage' },
];

export default function BenutzerVerwaltungPage() {
  const { benutzer: aktuellerBenutzer } = useAuth();
  const [benutzerListe, setBenutzerListe] = useState<Benutzer[]>([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');

  // Neuen Benutzer erstellen
  const [neueEmail, setNeueEmail] = useState('');
  const [neueRolle, setNeueRolle] = useState('TRAINER');
  const [erstellenLadend, setErstellenLadend] = useState(false);

  // Berechtigungen bearbeiten
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);
  const [bearbeitenBerechtigungen, setBearbeitenBerechtigungen] = useState<string[]>([]);

  const laden = async () => {
    try {
      const daten = await apiClient.get<Benutzer[]>('/benutzer/verwaltung/liste');
      setBenutzerListe(daten);
    } catch {
      setFehler('Benutzer konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => { laden(); }, []);

  const handleErstellen = async () => {
    if (!neueEmail) return;
    setErstellenLadend(true);
    setFehler('');
    setErfolg('');
    try {
      const ergebnis = await apiClient.post<{ nachricht: string }>('/benutzer/verwaltung/erstellen', {
        email: neueEmail,
        rolle: neueRolle,
      });
      setErfolg(ergebnis.nachricht || 'Benutzer erstellt. Temporaeres Passwort wurde generiert.');
      setNeueEmail('');
      await laden();
      setTimeout(() => setErfolg(''), 8000);
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Erstellen.');
    } finally {
      setErstellenLadend(false);
    }
  };

  const handleDeaktivieren = async (id: string, aktiv: boolean) => {
    try {
      await apiClient.put(`/benutzer/verwaltung/${id}/${aktiv ? 'deaktivieren' : 'aktivieren'}`, {});
      await laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler.');
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Benutzer wirklich loeschen? Dies kann nicht rueckgaengig gemacht werden.')) return;
    try {
      await apiClient.delete(`/benutzer/verwaltung/${id}`);
      await laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Loeschen.');
    }
  };

  const handleBerechtigungenSpeichern = async (id: string) => {
    try {
      await apiClient.put(`/benutzer/verwaltung/${id}/berechtigungen`, {
        berechtigungen: bearbeitenBerechtigungen,
      });
      setBearbeitenId(null);
      await laden();
      setErfolg('Berechtigungen gespeichert.');
      setTimeout(() => setErfolg(''), 5000);
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler.');
    }
  };

  const toggleBerechtigung = (key: string) => {
    setBearbeitenBerechtigungen((prev) =>
      prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key],
    );
  };

  if (ladend) {
    return <div className="animate-pulse text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
          <p className="text-muted-foreground">
            Mitarbeiter anlegen, Rollen zuweisen und Bereiche freischalten
          </p>
        </div>
      </div>

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{fehler}</div>
      )}
      {erfolg && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">{erfolg}</div>
      )}

      {/* Neuen Benutzer anlegen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Neuen Benutzer anlegen
          </CardTitle>
          <CardDescription>
            Der Benutzer erhaelt ein temporaeres Passwort und kann sich damit anmelden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>E-Mail-Adresse</Label>
              <Input
                type="email"
                value={neueEmail}
                onChange={(e) => setNeueEmail(e.target.value)}
                placeholder="trainer@fckunchen.de"
              />
            </div>
            <div className="w-48 space-y-2">
              <Label>Rolle</Label>
              <Select value={neueRolle} onChange={(e) => setNeueRolle(e.target.value)}>
                <option value="ADMIN">Admin / Vorstand</option>
                <option value="TRAINER">Trainer / Mitarbeiter</option>
                <option value="MEMBER">Mitglied</option>
                <option value="PARENT">Elternteil</option>
              </Select>
            </div>
            <Button onClick={handleErstellen} disabled={erstellenLadend || !neueEmail}>
              <Plus className="h-4 w-4 mr-2" />
              {erstellenLadend ? 'Wird erstellt...' : 'Anlegen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benutzerliste */}
      <Card>
        <CardHeader>
          <CardTitle>{benutzerListe.length} Benutzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {benutzerListe.map((b) => (
              <div
                key={b.id}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  !b.istAktiv ? 'opacity-50 bg-muted/50' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.email}</span>
                    <Badge variant={b.istAktiv ? 'secondary' : 'outline'}>
                      {ROLLEN_LABEL[b.role] || b.role}
                    </Badge>
                    {!b.istAktiv && (
                      <Badge variant="destructive">Deaktiviert</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {b.berechtigungen?.map((berechtigung) => (
                      <Badge key={berechtigung} variant="outline" className="text-xs">
                        {berechtigung}
                      </Badge>
                    ))}
                  </div>
                  {b.letzterLogin && (
                    <p className="text-xs text-muted-foreground">
                      Letzter Login: {new Date(b.letzterLogin).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Berechtigungen bearbeiten */}
                  {bearbeitenId === b.id ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleBerechtigungenSpeichern(b.id)}>
                        Speichern
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setBearbeitenId(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBearbeitenId(b.id);
                        setBearbeitenBerechtigungen(b.berechtigungen || []);
                      }}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Berechtigungen
                    </Button>
                  )}

                  {/* Aktivieren/Deaktivieren */}
                  {b.id !== aktuellerBenutzer?.id && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeaktivieren(b.id, b.istAktiv)}
                        title={b.istAktiv ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        {b.istAktiv ? (
                          <UserX className="h-4 w-4 text-orange-500" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLoeschen(b.id)}
                        title="Loeschen"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Berechtigungen-Editor */}
          {bearbeitenId && (
            <div className="mt-4 rounded-lg border p-4 bg-muted/30">
              <p className="text-sm font-medium mb-3">
                Berechtigungen fuer{' '}
                {benutzerListe.find((b) => b.id === bearbeitenId)?.email}:
              </p>
              <div className="flex flex-wrap gap-2">
                {ALLE_BERECHTIGUNGEN.map((b) => (
                  <Button
                    key={b.key}
                    size="sm"
                    variant={bearbeitenBerechtigungen.includes(b.key) ? 'default' : 'outline'}
                    onClick={() => toggleBerechtigung(b.key)}
                  >
                    {bearbeitenBerechtigungen.includes(b.key) ? (
                      <ShieldCheck className="h-3 w-3 mr-1" />
                    ) : (
                      <ShieldAlert className="h-3 w-3 mr-1" />
                    )}
                    {b.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
