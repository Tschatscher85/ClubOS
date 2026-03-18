'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, Save, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

interface RollenVorlage {
  id: string;
  name: string;
  beschreibung: string | null;
  systemRolle: string;
  berechtigungen: string[];
  farbe: string | null;
  sortierung: number;
  istStandard: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  { key: 'FAHRGEMEINSCHAFTEN', label: 'Fahrtenboerse' },
  { key: 'HALLENBELEGUNG', label: 'Belegung' },
  { key: 'SCHIEDSRICHTER', label: 'Schiedsrichter' },
  { key: 'SPONSOREN', label: 'Sponsoren' },
  { key: 'WORKFLOWS', label: 'Workflows' },
  { key: 'HOMEPAGE', label: 'Homepage' },
];

const SYSTEM_ROLLEN = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'TRAINER', label: 'Trainer' },
  { value: 'MEMBER', label: 'Mitglied' },
  { value: 'PARENT', label: 'Elternteil' },
];

const SYSTEM_ROLLEN_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Administrator',
  TRAINER: 'Trainer',
  MEMBER: 'Mitglied',
  PARENT: 'Elternteil',
};

export default function RollenVorlagenPage() {
  const [vorlagen, setVorlagen] = useState<RollenVorlage[]>([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');

  // Lokale Aenderungen pro Rolle tracken
  const [geaenderteBerechtigungen, setGeaenderteBerechtigungen] = useState<
    Record<string, string[]>
  >({});
  const [speichernLadend, setSpeichernLadend] = useState<string | null>(null);

  // Dialog fuer neue Rolle
  const [dialogOffen, setDialogOffen] = useState(false);
  const [neueName, setNeueName] = useState('');
  const [neueBeschreibung, setNeueBeschreibung] = useState('');
  const [neueSystemRolle, setNeueSystemRolle] = useState('MEMBER');
  const [neueFarbe, setNeueFarbe] = useState('#6366f1');
  const [neueBerechtigungen, setNeueBerechtigungen] = useState<string[]>([]);
  const [erstellenLadend, setErstellenLadend] = useState(false);

  const laden = useCallback(async () => {
    try {
      const daten = await apiClient.get<RollenVorlage[]>('/rollen-vorlagen');
      setVorlagen(daten);
      setGeaenderteBerechtigungen({});
    } catch {
      setFehler('Rollen-Vorlagen konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const zeigeErfolg = (nachricht: string) => {
    setErfolg(nachricht);
    setTimeout(() => setErfolg(''), 5000);
  };

  // Berechtigung fuer eine bestehende Rolle toggeln
  const toggleBerechtigung = (rolleId: string, key: string) => {
    setGeaenderteBerechtigungen((prev) => {
      const vorlage = vorlagen.find((v) => v.id === rolleId);
      const aktuelle = prev[rolleId] ?? vorlage?.berechtigungen ?? [];
      const neu = aktuelle.includes(key)
        ? aktuelle.filter((b) => b !== key)
        : [...aktuelle, key];
      return { ...prev, [rolleId]: neu };
    });
  };

  const hatAenderungen = (rolleId: string): boolean => {
    if (!geaenderteBerechtigungen[rolleId]) return false;
    const vorlage = vorlagen.find((v) => v.id === rolleId);
    if (!vorlage) return false;
    const original = [...vorlage.berechtigungen].sort().join(',');
    const aktuell = [...geaenderteBerechtigungen[rolleId]].sort().join(',');
    return original !== aktuell;
  };

  const getBerechtigungen = (vorlage: RollenVorlage): string[] => {
    return geaenderteBerechtigungen[vorlage.id] ?? vorlage.berechtigungen;
  };

  const handleSpeichern = async (rolleId: string) => {
    const berechtigungen = geaenderteBerechtigungen[rolleId];
    if (!berechtigungen) return;

    setSpeichernLadend(rolleId);
    setFehler('');
    try {
      const vorlage = vorlagen.find((v) => v.id === rolleId);
      if (!vorlage) return;

      await apiClient.put(`/rollen-vorlagen/${rolleId}`, {
        name: vorlage.name,
        beschreibung: vorlage.beschreibung,
        systemRolle: vorlage.systemRolle,
        berechtigungen,
        farbe: vorlage.farbe,
        sortierung: vorlage.sortierung,
      });
      await laden();
      zeigeErfolg('Berechtigungen gespeichert.');
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    } finally {
      setSpeichernLadend(null);
    }
  };

  const handleLoeschen = async (rolleId: string) => {
    if (!confirm('Rolle wirklich loeschen? Dies kann nicht rueckgaengig gemacht werden.')) return;
    setFehler('');
    try {
      await apiClient.delete(`/rollen-vorlagen/${rolleId}`);
      await laden();
      zeigeErfolg('Rolle geloescht.');
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Loeschen.');
    }
  };

  const handleErstellen = async () => {
    if (!neueName.trim()) return;
    setErstellenLadend(true);
    setFehler('');
    try {
      await apiClient.post('/rollen-vorlagen', {
        name: neueName.trim(),
        beschreibung: neueBeschreibung.trim() || null,
        systemRolle: neueSystemRolle,
        berechtigungen: neueBerechtigungen,
        farbe: neueFarbe,
        sortierung: vorlagen.length + 1,
      });
      setDialogOffen(false);
      resetDialog();
      await laden();
      zeigeErfolg('Neue Rolle erstellt.');
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Erstellen.');
    } finally {
      setErstellenLadend(false);
    }
  };

  const resetDialog = () => {
    setNeueName('');
    setNeueBeschreibung('');
    setNeueSystemRolle('MEMBER');
    setNeueFarbe('#6366f1');
    setNeueBerechtigungen([]);
  };

  const toggleNeueBerechtigung = (key: string) => {
    setNeueBerechtigungen((prev) =>
      prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key],
    );
  };

  if (ladend) {
    return <div className="animate-pulse text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Vereinsrollen</h1>
            <p className="text-muted-foreground">
              Rollen-Vorlagen fuer Ihren Verein. Jede Rolle definiert welche Bereiche ein Benutzer
              sehen und nutzen darf.
            </p>
          </div>
        </div>

        <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Rolle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Neue Rolle erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine neue Rollen-Vorlage fuer Ihren Verein.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={neueName}
                  onChange={(e) => setNeueName(e.target.value)}
                  placeholder="z.B. Jugendtrainer"
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Input
                  value={neueBeschreibung}
                  onChange={(e) => setNeueBeschreibung(e.target.value)}
                  placeholder="Optionale Beschreibung der Rolle"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>System-Rolle</Label>
                  <Select
                    value={neueSystemRolle}
                    onChange={(e) => setNeueSystemRolle(e.target.value)}
                  >
                    {SYSTEM_ROLLEN.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <Label>Farbe</Label>
                  <Input
                    type="color"
                    value={neueFarbe}
                    onChange={(e) => setNeueFarbe(e.target.value)}
                    className="h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Berechtigungen</Label>
                <div className="flex flex-wrap gap-2">
                  {ALLE_BERECHTIGUNGEN.map((b) => (
                    <Button
                      key={b.key}
                      type="button"
                      size="sm"
                      variant={neueBerechtigungen.includes(b.key) ? 'default' : 'outline'}
                      onClick={() => toggleNeueBerechtigung(b.key)}
                    >
                      {neueBerechtigungen.includes(b.key) ? (
                        <ShieldCheck className="h-3 w-3 mr-1" />
                      ) : (
                        <ShieldAlert className="h-3 w-3 mr-1" />
                      )}
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDialogOffen(false);
                    resetDialog();
                  }}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleErstellen} disabled={erstellenLadend || !neueName.trim()}>
                  {erstellenLadend ? 'Wird erstellt...' : 'Erstellen'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meldungen */}
      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{fehler}</div>
      )}
      {erfolg && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {erfolg}
        </div>
      )}

      {/* Rollen-Karten */}
      <div className="grid gap-4">
        {vorlagen.map((vorlage) => {
          const berechtigungen = getBerechtigungen(vorlage);
          const geaendert = hatAenderungen(vorlage.id);

          return (
            <Card key={vorlage.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2">
                      {vorlage.farbe && (
                        <span
                          className="inline-block h-4 w-4 rounded-full"
                          style={{ backgroundColor: vorlage.farbe }}
                        />
                      )}
                      {vorlage.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      System: {SYSTEM_ROLLEN_LABEL[vorlage.systemRolle] || vorlage.systemRolle}
                    </Badge>
                    {vorlage.istStandard && (
                      <Badge variant="outline" className="text-xs">
                        Standard
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {geaendert && (
                      <Button
                        size="sm"
                        onClick={() => handleSpeichern(vorlage.id)}
                        disabled={speichernLadend === vorlage.id}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {speichernLadend === vorlage.id ? 'Speichern...' : 'Speichern'}
                      </Button>
                    )}
                    {!vorlage.istStandard && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLoeschen(vorlage.id)}
                        title="Rolle loeschen"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                {vorlage.beschreibung && (
                  <CardDescription>{vorlage.beschreibung}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ALLE_BERECHTIGUNGEN.map((b) => {
                    const aktiv = berechtigungen.includes(b.key);
                    return (
                      <Button
                        key={b.key}
                        size="sm"
                        variant={aktiv ? 'default' : 'outline'}
                        onClick={() => toggleBerechtigung(vorlage.id, b.key)}
                        className="text-xs"
                      >
                        {aktiv ? (
                          <ShieldCheck className="h-3 w-3 mr-1" />
                        ) : (
                          <ShieldAlert className="h-3 w-3 mr-1" />
                        )}
                        {b.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {vorlagen.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Noch keine Rollen-Vorlagen vorhanden. Erstellen Sie Ihre erste Rolle.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
