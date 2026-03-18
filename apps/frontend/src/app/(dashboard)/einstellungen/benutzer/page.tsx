'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

interface Benutzer {
  id: string;
  email: string;
  role: string;
  vereinsRollen: string[];
  berechtigungen: string[];
  istAktiv: boolean;
  letzterLogin: string | null;
  notizen: string | null;
  createdAt: string;
}

interface RollenVorlage {
  id: string;
  name: string;
  beschreibung: string | null;
  systemRolle: string;
  berechtigungen: string[];
  farbe: string | null;
  sortierung: number;
  istStandard: boolean;
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
  { key: 'FAHRGEMEINSCHAFTEN', label: 'Fahrtenboerse' },
  { key: 'HALLENBELEGUNG', label: 'Belegung' },
  { key: 'SCHIEDSRICHTER', label: 'Schiedsrichter' },
  { key: 'SPONSOREN', label: 'Sponsoren' },
  { key: 'WORKFLOWS', label: 'Workflows' },
  { key: 'HOMEPAGE', label: 'Homepage' },
];

/** Standard-Farbe fuer Rollen ohne eigene Farbe */
const STANDARD_ROLLEN_FARBE = '#6b7280';

/** Berechnet die vereinigten Berechtigungen aller ausgewaehlten Rollen */
function berechneRollenBerechtigungen(
  ausgewaehlteRollen: string[],
  vorlagen: RollenVorlage[],
): string[] {
  const berechtigungen = new Set<string>();
  for (const rollenName of ausgewaehlteRollen) {
    const vorlage = vorlagen.find((v) => v.name === rollenName);
    if (vorlage) {
      for (const b of vorlage.berechtigungen) {
        berechtigungen.add(b);
      }
    }
  }
  return Array.from(berechtigungen);
}

export default function BenutzerVerwaltungPage() {
  const { benutzer: aktuellerBenutzer } = useAuth();
  const [benutzerListe, setBenutzerListe] = useState<Benutzer[]>([]);
  const [rollenVorlagen, setRollenVorlagen] = useState<RollenVorlage[]>([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');

  // Neuen Benutzer erstellen
  const [erstellenDialogOffen, setErstellenDialogOffen] = useState(false);
  const [neueEmail, setNeueEmail] = useState('');
  const [neueNotizen, setNeueNotizen] = useState('');
  const [neueRollen, setNeueRollen] = useState<string[]>([]);
  const [neueZusatzBerechtigungen, setNeueZusatzBerechtigungen] = useState<string[]>([]);
  const [erstellenLadend, setErstellenLadend] = useState(false);
  const [erstellenZusatzOffen, setErstellenZusatzOffen] = useState(false);

  // Rollen/Berechtigungen bearbeiten
  const [bearbeitenBenutzer, setBearbeitenBenutzer] = useState<Benutzer | null>(null);
  const [bearbeitenRollen, setBearbeitenRollen] = useState<string[]>([]);
  const [bearbeitenZusatzBerechtigungen, setBearbeitenZusatzBerechtigungen] = useState<string[]>([]);
  const [bearbeitenLadend, setBearbeitenLadend] = useState(false);
  const [bearbeitenZusatzOffen, setBearbeitenZusatzOffen] = useState(false);

  const laden = useCallback(async () => {
    try {
      const [benutzerDaten, rollenDaten] = await Promise.all([
        apiClient.get<Benutzer[]>('/benutzer/verwaltung/liste'),
        apiClient.get<RollenVorlage[]>('/rollen-vorlagen'),
      ]);
      setBenutzerListe(benutzerDaten);
      setRollenVorlagen(rollenDaten.sort((a, b) => a.sortierung - b.sortierung));
    } catch {
      setFehler('Benutzer konnten nicht geladen werden.');
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  // Berechtigungen, die durch die ausgewaehlten Rollen im Erstellen-Dialog abgedeckt sind
  const erstellenRollenBerechtigungen = useMemo(
    () => berechneRollenBerechtigungen(neueRollen, rollenVorlagen),
    [neueRollen, rollenVorlagen],
  );

  // Berechtigungen, die durch die ausgewaehlten Rollen im Bearbeiten-Dialog abgedeckt sind
  const bearbeitenRollenBerechtigungen = useMemo(
    () => berechneRollenBerechtigungen(bearbeitenRollen, rollenVorlagen),
    [bearbeitenRollen, rollenVorlagen],
  );

  // Zusaetzliche Berechtigungen, die NICHT bereits durch Rollen abgedeckt sind
  const erstellenVerfuegbareZusatz = useMemo(
    () => ALLE_BERECHTIGUNGEN.filter((b) => !erstellenRollenBerechtigungen.includes(b.key)),
    [erstellenRollenBerechtigungen],
  );

  const bearbeitenVerfuegbareZusatz = useMemo(
    () => ALLE_BERECHTIGUNGEN.filter((b) => !bearbeitenRollenBerechtigungen.includes(b.key)),
    [bearbeitenRollenBerechtigungen],
  );

  const zeigeErfolg = (nachricht: string) => {
    setErfolg(nachricht);
    setTimeout(() => setErfolg(''), 5000);
  };

  const handleErstellen = async () => {
    if (!neueEmail) return;
    setErstellenLadend(true);
    setFehler('');
    setErfolg('');
    try {
      // Benutzer erstellen — Systemrolle wird aus der primaeren Vereinsrolle abgeleitet
      const ergebnis = await apiClient.post<{ nachricht: string; id?: string }>(
        '/benutzer/verwaltung/erstellen',
        {
          email: neueEmail,
          rolle: bestimmeSystemRolle(neueRollen, rollenVorlagen),
          notizen: neueNotizen || undefined,
        },
      );

      // Vereinsrollen zuweisen, falls vorhanden
      if (ergebnis.id && (neueRollen.length > 0 || neueZusatzBerechtigungen.length > 0)) {
        await apiClient.put(`/benutzer/verwaltung/${ergebnis.id}/vereinsrollen`, {
          vereinsRollen: neueRollen,
          zusaetzlicheBerechtigungen: neueZusatzBerechtigungen,
        });
      }

      zeigeErfolg(ergebnis.nachricht || 'Benutzer erstellt. Temporaeres Passwort wurde generiert.');
      // Dialog zuruecksetzen
      setNeueEmail('');
      setNeueNotizen('');
      setNeueRollen([]);
      setNeueZusatzBerechtigungen([]);
      setErstellenDialogOffen(false);
      setErstellenZusatzOffen(false);
      await laden();
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

  const handleRollenSpeichern = async () => {
    if (!bearbeitenBenutzer) return;
    setBearbeitenLadend(true);
    try {
      // Zusatzberechtigungen bereinigen: Nur solche behalten, die nicht schon durch Rollen abgedeckt sind
      const bereinigte = bearbeitenZusatzBerechtigungen.filter(
        (b) => !bearbeitenRollenBerechtigungen.includes(b),
      );
      await apiClient.put(`/benutzer/verwaltung/${bearbeitenBenutzer.id}/vereinsrollen`, {
        vereinsRollen: bearbeitenRollen,
        zusaetzlicheBerechtigungen: bereinigte,
      });
      setBearbeitenBenutzer(null);
      setBearbeitenZusatzOffen(false);
      await laden();
      zeigeErfolg('Rollen und Berechtigungen gespeichert.');
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    } finally {
      setBearbeitenLadend(false);
    }
  };

  const oeffneBearbeiten = (benutzer: Benutzer) => {
    setBearbeitenBenutzer(benutzer);
    setBearbeitenRollen(benutzer.vereinsRollen || []);
    // Zusatzberechtigungen: Berechtigungen des Benutzers, die nicht durch seine Rollen abgedeckt sind
    const rollenBer = berechneRollenBerechtigungen(benutzer.vereinsRollen || [], rollenVorlagen);
    const zusatz = (benutzer.berechtigungen || []).filter((b) => !rollenBer.includes(b));
    setBearbeitenZusatzBerechtigungen(zusatz);
    setBearbeitenZusatzOffen(false);
  };

  /** Bestimmt die Systemrolle aus den ausgewaehlten Vereinsrollen (hoechste Prioritaet) */
  function bestimmeSystemRolle(rollen: string[], vorlagen: RollenVorlage[]): string {
    const prioritaet: Record<string, number> = {
      SUPERADMIN: 4,
      ADMIN: 3,
      TRAINER: 2,
      MEMBER: 1,
      PARENT: 0,
    };
    let hoechste = 'MEMBER';
    for (const rollenName of rollen) {
      const vorlage = vorlagen.find((v) => v.name === rollenName);
      if (vorlage && (prioritaet[vorlage.systemRolle] ?? 0) > (prioritaet[hoechste] ?? 0)) {
        hoechste = vorlage.systemRolle;
      }
    }
    return hoechste;
  }

  /** Gibt die Farbe fuer eine Vereinsrolle zurueck */
  function rollenFarbe(rollenName: string): string {
    const vorlage = rollenVorlagen.find((v) => v.name === rollenName);
    return vorlage?.farbe || STANDARD_ROLLEN_FARBE;
  }

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
            Mitarbeiter anlegen, Vereinsrollen zuweisen und Bereiche freischalten
          </p>
        </div>
      </div>

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-center justify-between">
            {fehler}
            <button onClick={() => setFehler('')} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {erfolg && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {erfolg}
        </div>
      )}

      {/* Aktionsleiste */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {benutzerListe.length} Benutzer insgesamt
        </p>
        <Button onClick={() => setErstellenDialogOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuen Benutzer anlegen
        </Button>
      </div>

      {/* Benutzerliste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Benutzer
          </CardTitle>
          <CardDescription>
            Verwalte Zugaenge und weise Vereinsrollen zu
          </CardDescription>
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
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{b.email}</span>
                    {!b.istAktiv && (
                      <Badge variant="destructive">Deaktiviert</Badge>
                    )}
                  </div>

                  {/* Vereinsrollen als farbige Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {(b.vereinsRollen || []).length > 0 ? (
                      b.vereinsRollen.map((rolle) => (
                        <Badge
                          key={rolle}
                          className="text-xs text-white"
                          style={{ backgroundColor: rollenFarbe(rolle) }}
                        >
                          {rolle}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {ROLLEN_LABEL[b.role] || b.role}
                      </Badge>
                    )}
                  </div>

                  {/* Zusaetzliche Berechtigungen (ueber Rollen hinaus) */}
                  {(() => {
                    const rollenBer = berechneRollenBerechtigungen(
                      b.vereinsRollen || [],
                      rollenVorlagen,
                    );
                    const zusatz = (b.berechtigungen || []).filter(
                      (ber) => !rollenBer.includes(ber),
                    );
                    if (zusatz.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1">
                        {zusatz.map((ber) => (
                          <Badge key={ber} variant="outline" className="text-xs">
                            +{ALLE_BERECHTIGUNGEN.find((a) => a.key === ber)?.label || ber}
                          </Badge>
                        ))}
                      </div>
                    );
                  })()}

                  {b.letzterLogin && (
                    <p className="text-xs text-muted-foreground">
                      Letzter Login: {new Date(b.letzterLogin).toLocaleDateString('de-DE')}
                    </p>
                  )}
                  {b.notizen && (
                    <p className="text-xs text-muted-foreground italic">
                      {b.notizen}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => oeffneBearbeiten(b)}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Rollen
                  </Button>

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

            {benutzerListe.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Benutzer angelegt.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Neuen Benutzer anlegen */}
      <Dialog open={erstellenDialogOffen} onOpenChange={setErstellenDialogOffen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Neuen Benutzer anlegen
            </DialogTitle>
            <DialogDescription>
              Der Benutzer erhaelt ein temporaeres Passwort und kann sich damit anmelden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* E-Mail */}
            <div className="space-y-2">
              <Label>E-Mail-Adresse *</Label>
              <Input
                type="email"
                value={neueEmail}
                onChange={(e) => setNeueEmail(e.target.value)}
                placeholder="trainer@fckunchen.de"
              />
            </div>

            {/* Notizen */}
            <div className="space-y-2">
              <Label>Notizen (optional)</Label>
              <Textarea
                value={neueNotizen}
                onChange={(e) => setNeueNotizen(e.target.value)}
                placeholder="z.B. Zustaendig fuer U12-Mannschaft"
                rows={2}
              />
            </div>

            {/* Vereinsrollen */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Vereinsrollen</Label>
              <p className="text-sm text-muted-foreground">
                Waehle eine oder mehrere Rollen fuer diesen Benutzer.
                Jede Rolle bringt eigene Berechtigungen mit.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {rollenVorlagen.map((vorlage) => {
                  const aktiv = neueRollen.includes(vorlage.name);
                  return (
                    <button
                      key={vorlage.id}
                      type="button"
                      onClick={() => {
                        setNeueRollen((prev) =>
                          aktiv
                            ? prev.filter((r) => r !== vorlage.name)
                            : [...prev, vorlage.name],
                        );
                        // Zusatzberechtigungen bereinigen, wenn eine Rolle hinzugefuegt wird
                        if (!aktiv) {
                          setNeueZusatzBerechtigungen((prev) =>
                            prev.filter((b) => !vorlage.berechtigungen.includes(b)),
                          );
                        }
                      }}
                      className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                        aktiv
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: aktiv
                            ? vorlage.farbe || STANDARD_ROLLEN_FARBE
                            : 'transparent',
                          border: aktiv
                            ? 'none'
                            : `2px solid ${vorlage.farbe || STANDARD_ROLLEN_FARBE}`,
                        }}
                      >
                        {aktiv && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{vorlage.name}</div>
                        {vorlage.beschreibung && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {vorlage.beschreibung}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Berechtigungen aus Rollen (read-only) */}
              {erstellenRollenBerechtigungen.length > 0 && (
                <div className="rounded-md bg-muted/50 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Berechtigungen durch Rollen:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {erstellenRollenBerechtigungen.map((ber) => (
                      <Badge key={ber} variant="secondary" className="text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {ALLE_BERECHTIGUNGEN.find((a) => a.key === ber)?.label || ber}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Zusaetzliche Berechtigungen (einklappbar) */}
            {erstellenVerfuegbareZusatz.length > 0 && (
              <div className="space-y-3 border rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => setErstellenZusatzOffen(!erstellenZusatzOffen)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {erstellenZusatzOffen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="font-medium text-sm">Individuelle Anpassung</span>
                  {neueZusatzBerechtigungen.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {neueZusatzBerechtigungen.length} zusaetzlich
                    </Badge>
                  )}
                </button>

                {erstellenZusatzOffen && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Einzelne Berechtigungen hinzufuegen, die nicht durch die ausgewaehlten Rollen
                      abgedeckt sind.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {erstellenVerfuegbareZusatz.map((b) => {
                        const aktiv = neueZusatzBerechtigungen.includes(b.key);
                        return (
                          <Button
                            key={b.key}
                            size="sm"
                            type="button"
                            variant={aktiv ? 'default' : 'outline'}
                            onClick={() => {
                              setNeueZusatzBerechtigungen((prev) =>
                                aktiv
                                  ? prev.filter((x) => x !== b.key)
                                  : [...prev, b.key],
                              );
                            }}
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aktionen */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setErstellenDialogOffen(false);
                setNeueEmail('');
                setNeueNotizen('');
                setNeueRollen([]);
                setNeueZusatzBerechtigungen([]);
                setErstellenZusatzOffen(false);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleErstellen}
              disabled={erstellenLadend || !neueEmail}
            >
              <Plus className="h-4 w-4 mr-2" />
              {erstellenLadend ? 'Wird erstellt...' : 'Benutzer anlegen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Rollen bearbeiten */}
      <Dialog
        open={bearbeitenBenutzer !== null}
        onOpenChange={(offen) => {
          if (!offen) {
            setBearbeitenBenutzer(null);
            setBearbeitenZusatzOffen(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rollen bearbeiten
            </DialogTitle>
            <DialogDescription>
              {bearbeitenBenutzer?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Vereinsrollen */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Vereinsrollen</Label>
              <p className="text-sm text-muted-foreground">
                Waehle die Rollen, die dieser Benutzer im Verein ausfuellen soll.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {rollenVorlagen.map((vorlage) => {
                  const aktiv = bearbeitenRollen.includes(vorlage.name);
                  return (
                    <button
                      key={vorlage.id}
                      type="button"
                      onClick={() => {
                        setBearbeitenRollen((prev) =>
                          aktiv
                            ? prev.filter((r) => r !== vorlage.name)
                            : [...prev, vorlage.name],
                        );
                        // Zusatzberechtigungen bereinigen
                        if (!aktiv) {
                          setBearbeitenZusatzBerechtigungen((prev) =>
                            prev.filter((b) => !vorlage.berechtigungen.includes(b)),
                          );
                        }
                      }}
                      className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                        aktiv
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: aktiv
                            ? vorlage.farbe || STANDARD_ROLLEN_FARBE
                            : 'transparent',
                          border: aktiv
                            ? 'none'
                            : `2px solid ${vorlage.farbe || STANDARD_ROLLEN_FARBE}`,
                        }}
                      >
                        {aktiv && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{vorlage.name}</div>
                        {vorlage.beschreibung && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {vorlage.beschreibung}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vorlage.berechtigungen.map((ber) => (
                            <span
                              key={ber}
                              className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                            >
                              {ALLE_BERECHTIGUNGEN.find((a) => a.key === ber)?.label || ber}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Berechtigungen aus Rollen (read-only Uebersicht) */}
              {bearbeitenRollenBerechtigungen.length > 0 && (
                <div className="rounded-md bg-muted/50 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Berechtigungen durch Rollen:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {bearbeitenRollenBerechtigungen.map((ber) => (
                      <Badge key={ber} variant="secondary" className="text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {ALLE_BERECHTIGUNGEN.find((a) => a.key === ber)?.label || ber}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Zusaetzliche Berechtigungen (einklappbar) */}
            {bearbeitenVerfuegbareZusatz.length > 0 && (
              <div className="space-y-3 border rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => setBearbeitenZusatzOffen(!bearbeitenZusatzOffen)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {bearbeitenZusatzOffen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="font-medium text-sm">Individuelle Anpassung</span>
                  {bearbeitenZusatzBerechtigungen.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {bearbeitenZusatzBerechtigungen.length} zusaetzlich
                    </Badge>
                  )}
                </button>

                {bearbeitenZusatzOffen && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Einzelne Berechtigungen hinzufuegen, die nicht durch die ausgewaehlten Rollen
                      abgedeckt sind.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bearbeitenVerfuegbareZusatz.map((b) => {
                        const aktiv = bearbeitenZusatzBerechtigungen.includes(b.key);
                        return (
                          <Button
                            key={b.key}
                            size="sm"
                            type="button"
                            variant={aktiv ? 'default' : 'outline'}
                            onClick={() => {
                              setBearbeitenZusatzBerechtigungen((prev) =>
                                aktiv
                                  ? prev.filter((x) => x !== b.key)
                                  : [...prev, b.key],
                              );
                            }}
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aktionen */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setBearbeitenBenutzer(null);
                setBearbeitenZusatzOffen(false);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleRollenSpeichern}
              disabled={bearbeitenLadend}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {bearbeitenLadend ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
