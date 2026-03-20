'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface Bucher {
  id: string;
  email: string;
}

interface BuchungItem {
  id: string;
  ressourceId: string;
  tenantId: string;
  bucherId: string;
  titel: string;
  start: string;
  ende: string;
  notiz: string | null;
  status: string;
  erstelltAm: string;
  bucher: Bucher;
  ressource?: Ressource;
}

interface Ressource {
  id: string;
  name: string;
  typ: string;
  beschreibung: string | null;
  bildUrl: string | null;
  maxPersonen: number | null;
  aktiv: boolean;
  buchungen: BuchungItem[];
}

// ==================== Hilfsfunktionen ====================

function montag(datum: Date): Date {
  const d = new Date(datum);
  const tag = d.getDay();
  const diff = tag === 0 ? -6 : 1 - tag;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function datumFormatieren(datum: Date): string {
  return datum.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  });
}

function stundenZeile(stunde: number): string {
  return `${stunde.toString().padStart(2, '0')}:00`;
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const STUNDEN_START = 8;
const STUNDEN_ENDE = 22;

// ==================== Farben fuer Buchungen ====================

const BUCHUNG_FARBEN = [
  'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300',
  'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300',
  'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300',
  'bg-pink-500/20 border-pink-500 text-pink-700 dark:text-pink-300',
  'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300',
];

function buchungFarbe(index: number): string {
  return BUCHUNG_FARBEN[index % BUCHUNG_FARBEN.length];
}

// ==================== Hauptkomponente ====================

export default function RessourcenPage() {
  const benutzer = useBenutzer();
  const istAdmin = benutzer && ['SUPERADMIN', 'ADMIN'].includes(benutzer.rolle);

  const [ressourcen, setRessourcen] = useState<Ressource[]>([]);
  const [ladend, setLadend] = useState(true);

  // Tab: 'verwaltung' oder 'kalender'
  const [tab, setTab] = useState<'verwaltung' | 'kalender'>('verwaltung');

  // Kalender-State
  const [gewaehlteRessource, setGewaehlteRessource] = useState<Ressource | null>(null);
  const [wochenStart, setWochenStart] = useState<Date>(montag(new Date()));
  const [wochenBuchungen, setWochenBuchungen] = useState<BuchungItem[]>([]);

  // Ressource-Dialog
  const [ressourceDialogOffen, setRessourceDialogOffen] = useState(false);
  const [bearbeitungsId, setBearbeitungsId] = useState<string | null>(null);
  const [resName, setResName] = useState('');
  const [resTyp, setResTyp] = useState('');
  const [resBeschreibung, setResBeschreibung] = useState('');
  const [resMaxPersonen, setResMaxPersonen] = useState('');
  const [speichernd, setSpeichernd] = useState(false);

  // Buchung-Dialog
  const [buchungDialogOffen, setBuchungDialogOffen] = useState(false);
  const [buchungTitel, setBuchungTitel] = useState('');
  const [buchungStart, setBuchungStart] = useState('');
  const [buchungEnde, setBuchungEnde] = useState('');
  const [buchungNotiz, setBuchungNotiz] = useState('');
  const [buchungFehler, setBuchungFehler] = useState('');

  // Detail-Dialog (Buchung anklicken)
  const [detailBuchung, setDetailBuchung] = useState<BuchungItem | null>(null);

  // ==================== Daten laden ====================

  const ressourcenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Ressource[]>('/ressourcen');
      setRessourcen(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Ressourcen:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  const buchungenLaden = useCallback(async () => {
    if (!gewaehlteRessource) return;
    const ende = new Date(wochenStart);
    ende.setDate(ende.getDate() + 7);
    try {
      const daten = await apiClient.get<BuchungItem[]>(
        `/buchungen?ressourceId=${gewaehlteRessource.id}&start=${wochenStart.toISOString()}&ende=${ende.toISOString()}`,
      );
      setWochenBuchungen(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Buchungen:', error);
    }
  }, [gewaehlteRessource, wochenStart]);

  useEffect(() => {
    ressourcenLaden();
  }, [ressourcenLaden]);

  useEffect(() => {
    if (gewaehlteRessource) {
      buchungenLaden();
    }
  }, [gewaehlteRessource, buchungenLaden]);

  // ==================== Ressource Handlers ====================

  const handleNeueRessource = () => {
    setBearbeitungsId(null);
    setResName('');
    setResTyp('');
    setResBeschreibung('');
    setResMaxPersonen('');
    setRessourceDialogOffen(true);
  };

  const handleRessourceBearbeiten = (r: Ressource) => {
    setBearbeitungsId(r.id);
    setResName(r.name);
    setResTyp(r.typ);
    setResBeschreibung(r.beschreibung || '');
    setResMaxPersonen(r.maxPersonen?.toString() || '');
    setRessourceDialogOffen(true);
  };

  const handleRessourceSpeichern = async () => {
    if (!resName || !resTyp) return;
    setSpeichernd(true);
    try {
      const daten = {
        name: resName,
        typ: resTyp,
        beschreibung: resBeschreibung || undefined,
        maxPersonen: resMaxPersonen ? parseInt(resMaxPersonen, 10) : undefined,
      };
      if (bearbeitungsId) {
        await apiClient.put(`/ressourcen/${bearbeitungsId}`, daten);
      } else {
        await apiClient.post('/ressourcen', daten);
      }
      setRessourceDialogOffen(false);
      ressourcenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setSpeichernd(false);
    }
  };

  const handleAktivToggle = async (r: Ressource) => {
    try {
      await apiClient.put(`/ressourcen/${r.id}`, { aktiv: !r.aktiv });
      ressourcenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleRessourceLoeschen = async (id: string) => {
    if (!confirm('Ressource wirklich löschen? Alle zugehörigen Buchungen werden ebenfalls gelöscht.')) return;
    try {
      await apiClient.delete(`/ressourcen/${id}`);
      ressourcenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // ==================== Kalender Handlers ====================

  const handleRessourceWaehlen = (r: Ressource) => {
    setGewaehlteRessource(r);
    setTab('kalender');
  };

  const handleWocheVor = () => {
    const neu = new Date(wochenStart);
    neu.setDate(neu.getDate() + 7);
    setWochenStart(neu);
  };

  const handleWocheZurueck = () => {
    const neu = new Date(wochenStart);
    neu.setDate(neu.getDate() - 7);
    setWochenStart(neu);
  };

  const handleHeute = () => {
    setWochenStart(montag(new Date()));
  };

  // Klick auf leeren Slot
  const handleSlotKlick = (tagIndex: number, stunde: number) => {
    const datum = new Date(wochenStart);
    datum.setDate(datum.getDate() + tagIndex);
    datum.setHours(stunde, 0, 0, 0);
    const endDatum = new Date(datum);
    endDatum.setHours(stunde + 1);

    // ISO-String in lokale Zeitformat fuer datetime-local Input
    const startLokal = new Date(datum.getTime() - datum.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    const endeLokal = new Date(endDatum.getTime() - endDatum.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setBuchungTitel('');
    setBuchungStart(startLokal);
    setBuchungEnde(endeLokal);
    setBuchungNotiz('');
    setBuchungFehler('');
    setBuchungDialogOffen(true);
  };

  const handleBuchungErstellen = async () => {
    if (!buchungTitel || !buchungStart || !buchungEnde || !gewaehlteRessource) return;
    setBuchungFehler('');
    setSpeichernd(true);
    try {
      await apiClient.post('/buchungen', {
        ressourceId: gewaehlteRessource.id,
        titel: buchungTitel,
        start: new Date(buchungStart).toISOString(),
        ende: new Date(buchungEnde).toISOString(),
        notiz: buchungNotiz || undefined,
      });
      setBuchungDialogOffen(false);
      buchungenLaden();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.';
      setBuchungFehler(msg);
    } finally {
      setSpeichernd(false);
    }
  };

  const handleBuchungStornieren = async (buchungId: string) => {
    if (!confirm('Buchung wirklich stornieren?')) return;
    try {
      await apiClient.delete(`/buchungen/${buchungId}`);
      setDetailBuchung(null);
      buchungenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // ==================== Kalender-Hilfsfunktionen ====================

  function buchungenFuerSlot(tagIndex: number, stunde: number): BuchungItem[] {
    const slotStart = new Date(wochenStart);
    slotStart.setDate(slotStart.getDate() + tagIndex);
    slotStart.setHours(stunde, 0, 0, 0);
    const slotEnde = new Date(slotStart);
    slotEnde.setHours(stunde + 1);

    return wochenBuchungen.filter((b) => {
      const bStart = new Date(b.start);
      const bEnde = new Date(b.ende);
      return bStart < slotEnde && bEnde > slotStart;
    });
  }

  function istStartSlot(buchung: BuchungItem, tagIndex: number, stunde: number): boolean {
    const bStart = new Date(buchung.start);
    const slotDatum = new Date(wochenStart);
    slotDatum.setDate(slotDatum.getDate() + tagIndex);
    return (
      bStart.getDate() === slotDatum.getDate() &&
      bStart.getMonth() === slotDatum.getMonth() &&
      bStart.getHours() === stunde
    );
  }

  function buchungDauer(buchung: BuchungItem): number {
    const bStart = new Date(buchung.start);
    const bEnde = new Date(buchung.ende);
    return Math.max(1, Math.ceil((bEnde.getTime() - bStart.getTime()) / (1000 * 60 * 60)));
  }

  // ==================== Rendering ====================

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Ressourcen werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Ressourcen & Platzbuchung</h1>
            <p className="text-muted-foreground">
              Raeume, Plaetze und Geraete verwalten und buchen
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {istAdmin && tab === 'verwaltung' && (
            <Button onClick={handleNeueRessource}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Ressource
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={tab === 'verwaltung' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('verwaltung')}
        >
          Uebersicht
        </Button>
        <Button
          variant={tab === 'kalender' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            if (!gewaehlteRessource && ressourcen.length > 0) {
              setGewaehlteRessource(ressourcen[0]);
            }
            setTab('kalender');
          }}
          disabled={ressourcen.length === 0}
        >
          Buchungskalender
        </Button>
      </div>

      {/* ==================== Tab: Verwaltung ==================== */}
      {tab === 'verwaltung' && (
        <>
          {ressourcen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Noch keine Ressourcen erfasst.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ressourcen.map((r) => (
                <Card
                  key={r.id}
                  className={`transition-opacity cursor-pointer hover:shadow-md ${!r.aktiv ? 'opacity-60' : ''}`}
                  onClick={() => handleRessourceWaehlen(r)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{r.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{r.typ}</p>
                        </div>
                      </div>
                      <Badge variant={r.aktiv ? 'default' : 'secondary'}>
                        {r.aktiv ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    {r.beschreibung && (
                      <p className="text-sm text-muted-foreground">{r.beschreibung}</p>
                    )}
                    {r.maxPersonen && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Max. {r.maxPersonen} Personen
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {r.buchungen.length} aktive Buchung{r.buchungen.length !== 1 ? 'en' : ''}
                    </div>

                    {istAdmin && (
                      <div className="flex gap-1 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRessourceBearbeiten(r)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAktivToggle(r)}
                        >
                          {r.aktiv ? (
                            <ToggleRight className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <ToggleLeft className="h-3.5 w-3.5 mr-1" />
                          )}
                          {r.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRessourceLoeschen(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== Tab: Buchungskalender ==================== */}
      {tab === 'kalender' && gewaehlteRessource && (
        <div className="space-y-4">
          {/* Ressource-Auswahl + Wochennavigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Ressource:</Label>
              <select
                className="border rounded px-3 py-1.5 text-sm bg-background"
                value={gewaehlteRessource.id}
                onChange={(e) => {
                  const r = ressourcen.find((res) => res.id === e.target.value);
                  if (r) setGewaehlteRessource(r);
                }}
              >
                {ressourcen.filter((r) => r.aktiv).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.typ})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleWocheZurueck}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleHeute}>
                Heute
              </Button>
              <span className="text-sm font-medium min-w-[160px] text-center">
                {datumFormatieren(wochenStart)} –{' '}
                {datumFormatieren(
                  new Date(
                    wochenStart.getTime() + 6 * 24 * 60 * 60 * 1000,
                  ),
                )}
              </span>
              <Button variant="outline" size="sm" onClick={handleWocheVor}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Wochenkalender-Grid */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="w-16 border-b border-r p-2 text-xs text-muted-foreground bg-muted/50">
                    Zeit
                  </th>
                  {WOCHENTAGE.map((tag, i) => {
                    const datum = new Date(wochenStart);
                    datum.setDate(datum.getDate() + i);
                    const istHeute =
                      datum.toDateString() === new Date().toDateString();
                    return (
                      <th
                        key={tag}
                        className={`border-b border-r p-2 text-xs font-medium ${
                          istHeute
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {tag} {datumFormatieren(datum)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  { length: STUNDEN_ENDE - STUNDEN_START },
                  (_, idx) => STUNDEN_START + idx,
                ).map((stunde) => (
                  <tr key={stunde}>
                    <td className="border-r p-1 text-xs text-muted-foreground text-center bg-muted/30 whitespace-nowrap">
                      {stundenZeile(stunde)}
                    </td>
                    {WOCHENTAGE.map((_, tagIndex) => {
                      const slotBuchungen = buchungenFuerSlot(tagIndex, stunde);
                      const hatBuchung = slotBuchungen.length > 0;

                      return (
                        <td
                          key={tagIndex}
                          className={`border-r border-b relative h-12 ${
                            !hatBuchung
                              ? 'cursor-pointer hover:bg-primary/5'
                              : ''
                          }`}
                          onClick={() => {
                            if (!hatBuchung) {
                              handleSlotKlick(tagIndex, stunde);
                            }
                          }}
                        >
                          {slotBuchungen.map((b, bIdx) => {
                            if (!istStartSlot(b, tagIndex, stunde)) return null;
                            const dauer = buchungDauer(b);
                            const farbe = buchungFarbe(bIdx);
                            return (
                              <div
                                key={b.id}
                                className={`absolute inset-x-0.5 top-0.5 rounded border-l-2 px-1 py-0.5 text-xs overflow-hidden cursor-pointer z-10 ${farbe}`}
                                style={{
                                  height: `calc(${dauer * 100}% - 4px)`,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailBuchung(b);
                                }}
                              >
                                <div className="font-medium truncate">
                                  {b.titel}
                                </div>
                                <div className="truncate opacity-75">
                                  {b.bucher.email.split('@')[0]}
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== Ressource-Dialog ==================== */}
      <Dialog open={ressourceDialogOffen} onOpenChange={setRessourceDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bearbeitungsId ? 'Ressource bearbeiten' : 'Neue Ressource'}
            </DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten der buchbaren Ressource.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                placeholder="z.B. Tennisplatz 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Typ *</Label>
              <Input
                value={resTyp}
                onChange={(e) => setResTyp(e.target.value)}
                placeholder="z.B. Platz, Raum, Geraet"
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={resBeschreibung}
                onChange={(e) => setResBeschreibung(e.target.value)}
                placeholder="z.B. Sandplatz mit Flutlicht"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Max. Personen</Label>
              <Input
                type="number"
                value={resMaxPersonen}
                onChange={(e) => setResMaxPersonen(e.target.value)}
                placeholder="z.B. 4"
                min={1}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRessourceDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleRessourceSpeichern}
                disabled={!resName || !resTyp || speichernd}
              >
                {speichernd
                  ? 'Wird gespeichert...'
                  : bearbeitungsId
                    ? 'Speichern'
                    : 'Ressource erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Buchung-Dialog ==================== */}
      <Dialog open={buchungDialogOffen} onOpenChange={setBuchungDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Buchung</DialogTitle>
            <DialogDescription>
              {gewaehlteRessource?.name} buchen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {buchungFehler && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-3">
                {buchungFehler}
              </div>
            )}
            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input
                value={buchungTitel}
                onChange={(e) => setBuchungTitel(e.target.value)}
                placeholder="z.B. Training U15"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start *</Label>
                <Input
                  type="datetime-local"
                  value={buchungStart}
                  onChange={(e) => setBuchungStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ende *</Label>
                <Input
                  type="datetime-local"
                  value={buchungEnde}
                  onChange={(e) => setBuchungEnde(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notiz</Label>
              <Textarea
                value={buchungNotiz}
                onChange={(e) => setBuchungNotiz(e.target.value)}
                placeholder="Optionale Anmerkungen"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBuchungDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleBuchungErstellen}
                disabled={!buchungTitel || !buchungStart || !buchungEnde || speichernd}
              >
                {speichernd ? 'Wird gebucht...' : 'Buchen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Buchung-Detail-Dialog ==================== */}
      <Dialog
        open={!!detailBuchung}
        onOpenChange={(open) => {
          if (!open) setDetailBuchung(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailBuchung?.titel}</DialogTitle>
            <DialogDescription>Buchungsdetails</DialogDescription>
          </DialogHeader>
          {detailBuchung && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Gebucht von:</div>
                <div>{detailBuchung.bucher.email}</div>
                <div className="text-muted-foreground">Start:</div>
                <div>
                  {new Date(detailBuchung.start).toLocaleString('de-DE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
                <div className="text-muted-foreground">Ende:</div>
                <div>
                  {new Date(detailBuchung.ende).toLocaleString('de-DE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
                <div className="text-muted-foreground">Status:</div>
                <div>
                  <Badge
                    variant={
                      detailBuchung.status === 'BESTAETIGT'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {detailBuchung.status}
                  </Badge>
                </div>
              </div>
              {detailBuchung.notiz && (
                <div>
                  <p className="text-sm text-muted-foreground">Notiz:</p>
                  <p className="text-sm">{detailBuchung.notiz}</p>
                </div>
              )}
              {(detailBuchung.bucherId === benutzer?.id || istAdmin) && (
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBuchungStornieren(detailBuchung.id)}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Stornieren
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
