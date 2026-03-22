'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  HandHeart,
  Plus,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

// ==================== Typen ====================

interface Team {
  id: string;
  name: string;
}

interface Meldung {
  id: string;
  aufgabeId: string;
  mitgliedId: string;
  status: 'ANGEMELDET' | 'BESTAETIGT' | 'ABGELEHNT';
  erstelltAm: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    userId?: string;
  };
}

interface Aufgabe {
  id: string;
  tenantId: string;
  titel: string;
  beschreibung: string | null;
  datum: string | null;
  frist: string | null;
  maxHelfer: number | null;
  status: 'OFFEN' | 'BESETZT' | 'ABGESCHLOSSEN' | 'ABGESAGT';
  erstelltVon: string;
  erstelltAm: string;
  team: Team | null;
  meldungen: Meldung[];
}

interface StundenEintrag {
  id: string;
  datum: string;
  stunden: number;
  beschreibung: string | null;
  erstelltAm: string;
}

interface MeineStundenAntwort {
  stunden: StundenEintrag[];
  jahresSumme: number;
  geschaetzterBetrag: number;
  warnung: boolean;
  jahr: number;
}

interface TrainerUebersicht {
  userId: string;
  email: string;
  vorname: string;
  nachname: string;
  summeStunden: number;
  geschaetzterBetrag: number;
  warnung: boolean;
  kritisch: boolean;
}

interface UebersichtAntwort {
  jahr: number;
  trainer: TrainerUebersicht[];
}

// ==================== Status-Konfiguration ====================

const STATUS_KONFIG: Record<
  Aufgabe['status'],
  { label: string; klasse: string }
> = {
  OFFEN: { label: 'Offen', klasse: 'bg-green-100 text-green-700' },
  BESETZT: { label: 'Besetzt', klasse: 'bg-blue-100 text-blue-700' },
  ABGESCHLOSSEN: {
    label: 'Abgeschlossen',
    klasse: 'bg-gray-100 text-gray-700',
  },
  ABGESAGT: { label: 'Abgesagt', klasse: 'bg-red-100 text-red-700' },
};

const MELDUNG_STATUS_KONFIG: Record<
  Meldung['status'],
  { label: string; klasse: string }
> = {
  ANGEMELDET: { label: 'Angemeldet', klasse: 'bg-yellow-100 text-yellow-700' },
  BESTAETIGT: { label: 'Bestaetigt', klasse: 'bg-green-100 text-green-700' },
  ABGELEHNT: { label: 'Abgelehnt', klasse: 'bg-red-100 text-red-700' },
};

// ==================== Hauptseite ====================

function EhrenamtTabs() {
  const benutzer = useBenutzer();
  const istTrainer = benutzer && ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);
  const istAdmin = benutzer && ['SUPERADMIN', 'ADMIN'].includes(benutzer.rolle);

  return (
    <Tabs defaultValue="aufgaben">
      <TabsList>
        <TabsTrigger value="aufgaben">Helfer-Aufgaben</TabsTrigger>
        {istTrainer && (
          <TabsTrigger value="stunden">Meine Stunden</TabsTrigger>
        )}
        {istAdmin && (
          <TabsTrigger value="uebersicht">
            Uebungsleiter-Uebersicht
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="aufgaben">
        <HelferAufgabenTab />
      </TabsContent>

      {istTrainer && (
        <TabsContent value="stunden">
          <MeineStundenTab />
        </TabsContent>
      )}

      {istAdmin && (
        <TabsContent value="uebersicht">
          <UebersichtTab />
        </TabsContent>
      )}
    </Tabs>
  );
}

export default function EhrenamtSeite() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HandHeart className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Ehrenamt</h1>
          <p className="text-sm text-muted-foreground">
            Helfer-Aufgaben und Uebungsleiter-Stunden verwalten
          </p>
        </div>
      </div>
      <EhrenamtTabs />
    </div>
  );
}

// ==================== Tab 1: Helfer-Aufgaben ====================

function HelferAufgabenTab() {
  const benutzer = useBenutzer();
  const istTrainer = benutzer && ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);

  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [laden, setLaden] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [expandiert, setExpandiert] = useState<string | null>(null);

  // Formular
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [datum, setDatum] = useState('');
  const [frist, setFrist] = useState('');
  const [maxHelfer, setMaxHelfer] = useState('');
  const [teamId, setTeamId] = useState('');

  const laden_ = useCallback(async () => {
    try {
      const [aufgabenDaten, teamsDaten] = await Promise.all([
        apiClient.get<Aufgabe[]>('/ehrenamt/aufgaben'),
        apiClient.get<Team[]>('/teams'),
      ]);
      setAufgaben(aufgabenDaten);
      setTeams(Array.isArray(teamsDaten) ? teamsDaten : []);
    } catch {
      // Fehler ignorieren
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    laden_();
  }, [laden_]);

  const formularZuruecksetzen = () => {
    setTitel('');
    setBeschreibung('');
    setDatum('');
    setFrist('');
    setMaxHelfer('');
    setTeamId('');
  };

  const aufgabeErstellen = async () => {
    if (!titel.trim()) return;
    try {
      await apiClient.post('/ehrenamt/aufgaben', {
        titel: titel.trim(),
        beschreibung: beschreibung.trim() || undefined,
        datum: datum || undefined,
        frist: frist || undefined,
        maxHelfer: maxHelfer ? parseInt(maxHelfer, 10) : undefined,
        teamId: teamId || undefined,
      });
      setDialogOffen(false);
      formularZuruecksetzen();
      await laden_();
    } catch {
      // Fehler ignorieren
    }
  };

  const melden = async (aufgabeId: string) => {
    try {
      await apiClient.post(`/ehrenamt/aufgaben/${aufgabeId}/melden`, {});
      await laden_();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Anmelden.');
    }
  };

  const meldungZurueckziehen = async (aufgabeId: string) => {
    try {
      await apiClient.delete(`/ehrenamt/aufgaben/${aufgabeId}/melden`);
      await laden_();
    } catch {
      // Fehler ignorieren
    }
  };

  const meldungBestaetigen = async (meldungId: string) => {
    try {
      await apiClient.put(`/ehrenamt/meldung/${meldungId}/bestaetigen`, {});
      await laden_();
    } catch {
      // Fehler ignorieren
    }
  };

  const meldungAblehnen = async (meldungId: string) => {
    try {
      await apiClient.put(`/ehrenamt/meldung/${meldungId}/ablehnen`, {});
      await laden_();
    } catch {
      // Fehler ignorieren
    }
  };

  const aufgabeLoeschen = async (aufgabeId: string) => {
    if (!confirm('Aufgabe wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/ehrenamt/aufgaben/${aufgabeId}`);
      await laden_();
    } catch {
      // Fehler ignorieren
    }
  };

  const statusAendern = async (aufgabeId: string, status: string) => {
    try {
      await apiClient.put(`/ehrenamt/aufgaben/${aufgabeId}/status`, { status });
      await laden_();
    } catch {
      // Fehler ignorieren
    }
  };

  const istAngemeldet = (aufgabe: Aufgabe): boolean => {
    if (!benutzer) return false;
    return aufgabe.meldungen.some(
      (m) => m.member.userId === benutzer.id && m.status !== 'ABGELEHNT',
    );
  };

  if (laden) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Lade Aufgaben...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Aktionsleiste */}
      {istTrainer && (
        <div className="flex justify-end">
          <Button onClick={() => setDialogOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Aufgabe
          </Button>
        </div>
      )}

      {/* Aufgaben-Liste */}
      {aufgaben.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <HandHeart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Helfer-Aufgaben vorhanden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {aufgaben.map((aufgabe) => {
            const konfig = STATUS_KONFIG[aufgabe.status];
            const helferAnzahl = aufgabe.meldungen.filter(
              (m) => m.status !== 'ABGELEHNT',
            ).length;
            const istExpanded = expandiert === aufgabe.id;
            const kannLoeschen =
              istTrainer &&
              (aufgabe.erstelltVon === benutzer?.id ||
                ['SUPERADMIN', 'ADMIN'].includes(benutzer?.rolle || ''));

            return (
              <Card key={aufgabe.id}>
                <CardContent className="p-4">
                  {/* Kopfzeile */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base">
                          {aufgabe.titel}
                        </h3>
                        <Badge className={konfig.klasse}>{konfig.label}</Badge>
                        {aufgabe.team && (
                          <Badge variant="outline">{aufgabe.team.name}</Badge>
                        )}
                      </div>
                      {aufgabe.beschreibung && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {aufgabe.beschreibung}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {aufgabe.datum && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(aufgabe.datum).toLocaleDateString(
                              'de-DE',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              },
                            )}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {helferAnzahl}
                          {aufgabe.maxHelfer !== null
                            ? ` / ${aufgabe.maxHelfer}`
                            : ''}{' '}
                          Helfer
                        </span>
                        {aufgabe.frist && (
                          <span>
                            Frist:{' '}
                            {new Date(aufgabe.frist).toLocaleDateString(
                              'de-DE',
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Melden / Abmelden Button */}
                      {aufgabe.status === 'OFFEN' && !istAngemeldet(aufgabe) && (
                        <Button
                          size="sm"
                          onClick={() => melden(aufgabe.id)}
                        >
                          Ich helfe mit!
                        </Button>
                      )}
                      {istAngemeldet(aufgabe) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => meldungZurueckziehen(aufgabe.id)}
                        >
                          Abmelden
                        </Button>
                      )}

                      {/* Loeschen */}
                      {kannLoeschen && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => aufgabeLoeschen(aufgabe.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}

                      {/* Expandieren */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpandiert(istExpanded ? null : aufgabe.id)
                        }
                      >
                        {istExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expandierter Bereich */}
                  {istExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {/* Status-Aktionen */}
                      {istTrainer && aufgabe.status === 'OFFEN' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              statusAendern(aufgabe.id, 'ABGESCHLOSSEN')
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Abschliessen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() =>
                              statusAendern(aufgabe.id, 'ABGESAGT')
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Absagen
                          </Button>
                        </div>
                      )}
                      {istTrainer && aufgabe.status === 'BESETZT' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            statusAendern(aufgabe.id, 'ABGESCHLOSSEN')
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Abschliessen
                        </Button>
                      )}

                      {/* Meldungen-Liste */}
                      <h4 className="text-sm font-medium">
                        Angemeldete Helfer ({aufgabe.meldungen.length})
                      </h4>
                      {aufgabe.meldungen.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Noch keine Anmeldungen.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {aufgabe.meldungen.map((m) => {
                            const mKonfig = MELDUNG_STATUS_KONFIG[m.status];
                            return (
                              <div
                                key={m.id}
                                className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {m.member.firstName} {m.member.lastName}
                                  </span>
                                  <Badge className={mKonfig.klasse}>
                                    {mKonfig.label}
                                  </Badge>
                                </div>
                                {istTrainer && m.status === 'ANGEMELDET' && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-green-600"
                                      onClick={() =>
                                        meldungBestaetigen(m.id)
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-red-600"
                                      onClick={() => meldungAblehnen(m.id)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Neue Aufgabe Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Helfer-Aufgabe</DialogTitle>
            <DialogDescription>
              Erstelle eine neue Aufgabe, fuer die Helfer gesucht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titel">Titel *</Label>
              <Input
                id="titel"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="z.B. Kuchenverkauf beim Heimspiel"
              />
            </div>
            <div>
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="Details zur Aufgabe..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="datum">Datum</Label>
                <Input
                  id="datum"
                  type="date"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="frist">Anmeldefrist</Label>
                <Input
                  id="frist"
                  type="date"
                  value={frist}
                  onChange={(e) => setFrist(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxHelfer">Max. Helfer</Label>
                <Input
                  id="maxHelfer"
                  type="number"
                  min="1"
                  value={maxHelfer}
                  onChange={(e) => setMaxHelfer(e.target.value)}
                  placeholder="Unbegrenzt"
                />
              </div>
              <div>
                <Label htmlFor="team">Team (optional)</Label>
                <Select
                  id="team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  <option value="">Alle Mitglieder</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOffen(false);
                  formularZuruecksetzen();
                }}
              >
                Abbrechen
              </Button>
              <Button onClick={aufgabeErstellen} disabled={!titel.trim()}>
                Erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Tab 2: Meine Stunden ====================

function MeineStundenTab() {
  const [daten, setDaten] = useState<MeineStundenAntwort | null>(null);
  const [laden, setLaden] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);

  // Formular
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [stunden, setStunden] = useState('');
  const [beschreibung, setBeschreibung] = useState('');

  const laden_ = useCallback(async () => {
    try {
      const ergebnis =
        await apiClient.get<MeineStundenAntwort>('/ehrenamt/stunden');
      setDaten(ergebnis);
    } catch {
      // Fehler ignorieren
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    laden_();
  }, [laden_]);

  const stundenErfassen = async () => {
    const stundenZahl = parseFloat(stunden);
    if (!datum || isNaN(stundenZahl) || stundenZahl <= 0) return;
    try {
      await apiClient.post('/ehrenamt/stunden', {
        datum,
        stunden: stundenZahl,
        beschreibung: beschreibung.trim() || undefined,
      });
      setDialogOffen(false);
      setDatum(new Date().toISOString().slice(0, 10));
      setStunden('');
      setBeschreibung('');
      await laden_();
    } catch {
      // Fehler ignorieren
    }
  };

  if (laden) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Lade Stunden...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warnung */}
      {daten?.warnung && (
        <div className="flex items-center gap-3 rounded-md border border-orange-300 bg-orange-50 p-4">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
          <div>
            <p className="font-medium text-orange-800">
              Uebungsleiterpauschale beachten!
            </p>
            <p className="text-sm text-orange-700">
              Dein geschaetzter Betrag von{' '}
              {daten.geschaetzterBetrag.toLocaleString('de-DE')} EUR naehert sich
              der Freigrenze von 3.300 EUR. Bitte pruefe die tatsaechliche
              Verguetung.
            </p>
          </div>
        </div>
      )}

      {/* Zusammenfassung */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {daten?.jahresSumme.toFixed(1) || '0'} h
            </p>
            <p className="text-sm text-muted-foreground">
              Jahresstunden {daten?.jahr}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {daten?.geschaetzterBetrag.toLocaleString('de-DE') || '0'} EUR
            </p>
            <p className="text-sm text-muted-foreground">
              Geschaetzter Betrag (20 EUR/h)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {daten?.stunden.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Eintraege</p>
          </CardContent>
        </Card>
      </div>

      {/* Aktionsleiste */}
      <div className="flex justify-end">
        <Button onClick={() => setDialogOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Stunden eintragen
        </Button>
      </div>

      {/* Stunden-Tabelle */}
      {!daten?.stunden.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Stunden erfasst.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Datum</th>
                    <th className="text-right p-3 font-medium">Stunden</th>
                    <th className="text-left p-3 font-medium">Beschreibung</th>
                  </tr>
                </thead>
                <tbody>
                  {daten.stunden.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-3">
                        {new Date(s.datum).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {s.stunden.toFixed(1)} h
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {s.beschreibung || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stunden eintragen Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stunden eintragen</DialogTitle>
            <DialogDescription>
              Erfasse deine Uebungsleiter-Stunden fuer die
              Uebungsleiterpauschale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stunden-datum">Datum *</Label>
              <Input
                id="stunden-datum"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="stunden-anzahl">Stunden *</Label>
              <Input
                id="stunden-anzahl"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={stunden}
                onChange={(e) => setStunden(e.target.value)}
                placeholder="z.B. 1.5"
              />
            </div>
            <div>
              <Label htmlFor="stunden-beschreibung">Beschreibung</Label>
              <Input
                id="stunden-beschreibung"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="z.B. Training U12"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={stundenErfassen}
                disabled={!datum || !stunden || parseFloat(stunden) <= 0}
              >
                Eintragen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Tab 3: Uebungsleiter-Uebersicht (ADMIN) ====================

function UebersichtTab() {
  const [daten, setDaten] = useState<UebersichtAntwort | null>(null);
  const [laden, setLaden] = useState(true);
  const [jahr, setJahr] = useState(new Date().getFullYear());

  const laden_ = useCallback(async () => {
    setLaden(true);
    try {
      const ergebnis = await apiClient.get<UebersichtAntwort>(
        `/ehrenamt/stunden/uebersicht?jahr=${jahr}`,
      );
      setDaten(ergebnis);
    } catch {
      // Fehler ignorieren
    } finally {
      setLaden(false);
    }
  }, [jahr]);

  useEffect(() => {
    laden_();
  }, [laden_]);

  const csvExportieren = () => {
    if (!daten?.trainer.length) return;

    const kopfzeile = 'Name;E-Mail;Stunden;Geschaetzter Betrag (EUR);Warnung';
    const zeilen = daten.trainer.map(
      (t) =>
        `${t.vorname} ${t.nachname};${t.email};${t.summeStunden.toFixed(1)};${t.geschaetzterBetrag.toFixed(2)};${t.kritisch ? 'KRITISCH' : t.warnung ? 'WARNUNG' : 'OK'}`,
    );
    const csv = [kopfzeile, ...zeilen].join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uebungsleiter-stunden-${jahr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Jahresauswahl: aktuelles Jahr + 2 zurueck
  const aktuellesJahr = new Date().getFullYear();
  const jahresOptionen = [
    aktuellesJahr,
    aktuellesJahr - 1,
    aktuellesJahr - 2,
  ];

  if (laden) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Lade Uebersicht...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Steuerung */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label htmlFor="jahr-auswahl">Jahr:</Label>
          <Select
            id="jahr-auswahl"
            value={String(jahr)}
            onChange={(e) => setJahr(parseInt(e.target.value, 10))}
            className="w-28"
          >
            {jahresOptionen.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={csvExportieren}
          disabled={!daten?.trainer.length}
        >
          <Download className="h-4 w-4 mr-2" />
          CSV Export
        </Button>
      </div>

      {/* Tabelle */}
      {!daten?.trainer.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Keine Stunden fuer {jahr} erfasst.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">E-Mail</th>
                    <th className="text-right p-3 font-medium">
                      Jahresstunden
                    </th>
                    <th className="text-right p-3 font-medium">
                      Gesch. Betrag
                    </th>
                    <th className="text-center p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {daten.trainer.map((t) => (
                    <tr
                      key={t.userId}
                      className={`border-b last:border-0 ${
                        t.kritisch
                          ? 'bg-red-50'
                          : t.warnung
                            ? 'bg-orange-50'
                            : ''
                      }`}
                    >
                      <td className="p-3 font-medium">
                        {t.vorname} {t.nachname}
                      </td>
                      <td className="p-3 text-muted-foreground">{t.email}</td>
                      <td className="p-3 text-right">
                        {t.summeStunden.toFixed(1)} h
                      </td>
                      <td className="p-3 text-right">
                        {t.geschaetzterBetrag.toLocaleString('de-DE')} EUR
                      </td>
                      <td className="p-3 text-center">
                        {t.kritisch ? (
                          <Badge className="bg-red-100 text-red-700">
                            Ueber 3.300 EUR
                          </Badge>
                        ) : t.warnung ? (
                          <Badge className="bg-orange-100 text-orange-700">
                            Ab 2.800 EUR
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info-Hinweis */}
      <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Die Uebungsleiterpauschale ist bis 3.300 EUR/Jahr steuerfrei (Stand
          2026). Der geschaetzte Betrag basiert auf 20 EUR/Stunde und dient nur
          als Richtwert. Die tatsaechliche Verguetung kann abweichen.
        </p>
      </div>
    </div>
  );
}
