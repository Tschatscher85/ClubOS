'use client';

import { useEffect, useState, useCallback } from 'react';
import { Car, Plus, Trash2, ArrowRight, Baby, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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

interface Fahrgemeinschaft {
  id: string;
  fahrerId: string;
  startort: string;
  zielort: string;
  abfahrt: string;
  plaetze: number;
  kindersitz: number;
  sitzErhoehung: number;
  kommentar: string | null;
  _count: { mitfahrer: number };
  mitfahrer?: Array<{ userId: string; anzahlPersonen: number; brauchtKindersitz: boolean; brauchtErhoehung: boolean }>;
}

export default function FahrgemeinschaftenInhalt() {
  const benutzer = useBenutzer();
  const [fahrten, setFahrten] = useState<Fahrgemeinschaft[]>([]);
  const [ladend, setLadend] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);

  // Erstellen-Formular
  const [startort, setStartort] = useState('');
  const [zielort, setZielort] = useState('');
  const [abfahrt, setAbfahrt] = useState('');
  const [plaetze, setPlaetze] = useState(4);
  const [kindersitz, setKindersitz] = useState(0);
  const [sitzErhoehung, setSitzErhoehung] = useState(0);
  const [kommentar, setKommentar] = useState('');
  const [speichernd, setSpeichernd] = useState(false);

  // Mitfahren-Dialog
  const [mitfahrDialog, setMitfahrDialog] = useState<string | null>(null);
  const [mitfahrPersonen, setMitfahrPersonen] = useState(1);
  const [mitfahrKindersitz, setMitfahrKindersitz] = useState(false);
  const [mitfahrErhoehung, setMitfahrErhoehung] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Fahrgemeinschaft[]>('/fahrgemeinschaften');
      setFahrten(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Fahrgemeinschaften:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const formularZuruecksetzen = () => {
    setStartort('');
    setZielort('');
    setAbfahrt('');
    setPlaetze(4);
    setKindersitz(0);
    setSitzErhoehung(0);
    setKommentar('');
  };

  const handleErstellen = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpeichernd(true);
    try {
      await apiClient.post('/fahrgemeinschaften', {
        startort,
        zielort,
        abfahrt,
        plaetze,
        kindersitz,
        sitzErhoehung,
        kommentar: kommentar || undefined,
      });
      setDialogOffen(false);
      formularZuruecksetzen();
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    } finally {
      setSpeichernd(false);
    }
  };

  const handleMitfahren = async (id: string) => {
    try {
      await apiClient.post(`/fahrgemeinschaften/${id}/mitfahren`, {
        anzahlPersonen: mitfahrPersonen,
        brauchtKindersitz: mitfahrKindersitz,
        brauchtErhoehung: mitfahrErhoehung,
      });
      setMitfahrDialog(null);
      setMitfahrPersonen(1);
      setMitfahrKindersitz(false);
      setMitfahrErhoehung(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Mitfahren:', error);
    }
  };

  const handleAustreten = async (id: string) => {
    try {
      await apiClient.delete(`/fahrgemeinschaften/${id}/mitfahren`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Austreten:', error);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Fahrt wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/fahrgemeinschaften/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  const istMitfahrer = (fahrt: Fahrgemeinschaft): boolean => {
    if (!benutzer || !fahrt.mitfahrer) return false;
    return fahrt.mitfahrer.some((m) => m.userId === benutzer.id);
  };

  const freiePlaetze = (fahrt: Fahrgemeinschaft): number => {
    return fahrt.plaetze - fahrt._count.mitfahrer;
  };

  const abfahrtFormatieren = (datum: string): string => {
    return new Date(datum).toLocaleString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">
          Fahrgemeinschaften werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {fahrten.length} {fahrten.length === 1 ? 'Fahrt' : 'Fahrten'} verfuegbar
        </Badge>
        <Button id="fahrt-erstellen-btn" className="hidden" onClick={() => setDialogOffen(true)}>
          Neue Fahrt
        </Button>
      </div>

      {/* Fahrtenliste */}
      {fahrten.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Noch keine Fahrgemeinschaften vorhanden.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fahrten.map((fahrt) => {
            const frei = freiePlaetze(fahrt);
            const istFahrer = benutzer?.id === fahrt.fahrerId;
            const bereitsAngemeldet = istMitfahrer(fahrt);

            return (
              <Card key={fahrt.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {fahrt.startort}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      {fahrt.zielort}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {abfahrtFormatieren(fahrt.abfahrt)}
                    </p>
                  </div>
                  <Badge variant={frei > 0 ? 'secondary' : 'destructive'} className="shrink-0">
                    {fahrt._count.mitfahrer}/{fahrt.plaetze}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Kindersitz/Erhoehung Info */}
                  {(fahrt.kindersitz > 0 || fahrt.sitzErhoehung > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {fahrt.kindersitz > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Baby className="h-3 w-3" />
                          {fahrt.kindersitz}x Kindersitz
                        </Badge>
                      )}
                      {fahrt.sitzErhoehung > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Baby className="h-3 w-3" />
                          {fahrt.sitzErhoehung}x Erhoehung
                        </Badge>
                      )}
                    </div>
                  )}

                  {fahrt.kommentar && (
                    <p className="text-sm text-muted-foreground">{fahrt.kommentar}</p>
                  )}

                  <div className="flex gap-2">
                    {istFahrer ? (
                      <Button variant="destructive" size="sm" onClick={() => handleLoeschen(fahrt.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Loeschen
                      </Button>
                    ) : bereitsAngemeldet ? (
                      <Button variant="outline" size="sm" onClick={() => handleAustreten(fahrt.id)}>
                        Austreten
                      </Button>
                    ) : frei > 0 ? (
                      <Button size="sm" onClick={() => setMitfahrDialog(fahrt.id)}>
                        <Users className="h-4 w-4 mr-1" />
                        Mitfahren
                      </Button>
                    ) : (
                      <Button size="sm" disabled>Ausgebucht</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Neue Fahrt erstellen */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Fahrt anbieten</DialogTitle>
            <DialogDescription>
              Fahrgemeinschaft erstellen, damit andere mitfahren koennen.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleErstellen} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Startort *</Label>
                <Input value={startort} onChange={(e) => setStartort(e.target.value)} placeholder="Vereinsheim, Parkplatz..." required />
              </div>
              <div className="space-y-2">
                <Label>Zielort *</Label>
                <Input value={zielort} onChange={(e) => setZielort(e.target.value)} placeholder="Sporthalle..." required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Abfahrt *</Label>
                <Input type="datetime-local" value={abfahrt} onChange={(e) => setAbfahrt(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Freie Plaetze</Label>
                <Input type="number" min={1} max={9} value={plaetze} onChange={(e) => setPlaetze(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kindersitze vorhanden</Label>
                <Select value={String(kindersitz)} onChange={(e) => setKindersitz(Number(e.target.value))}>
                  <option value="0">Keine</option>
                  <option value="1">1 Kindersitz</option>
                  <option value="2">2 Kindersitze</option>
                  <option value="3">3 Kindersitze</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sitzerhoehungen vorhanden</Label>
                <Select value={String(sitzErhoehung)} onChange={(e) => setSitzErhoehung(Number(e.target.value))}>
                  <option value="0">Keine</option>
                  <option value="1">1 Erhoehung</option>
                  <option value="2">2 Erhoehungen</option>
                  <option value="3">3 Erhoehungen</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kommentar (optional)</Label>
              <Textarea value={kommentar} onChange={(e) => setKommentar(e.target.value)} placeholder="Treffpunkt, Besonderheiten..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOffen(false); formularZuruecksetzen(); }}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={speichernd}>
                {speichernd ? 'Wird erstellt...' : 'Fahrt erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Mitfahren (Personenzahl + Kindersitz) */}
      <Dialog open={!!mitfahrDialog} onOpenChange={() => setMitfahrDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mitfahren</DialogTitle>
            <DialogDescription>Wie viele Personen fahren mit?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Anzahl Personen</Label>
              <Select value={String(mitfahrPersonen)} onChange={(e) => setMitfahrPersonen(Number(e.target.value))}>
                <option value="1">1 Person</option>
                <option value="2">2 Personen (z.B. Elternteil + Kind)</option>
                <option value="3">3 Personen</option>
                <option value="4">4 Personen</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={mitfahrKindersitz} onChange={(e) => setMitfahrKindersitz(e.target.checked)} className="rounded" />
                Kindersitz benoetigt
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={mitfahrErhoehung} onChange={(e) => setMitfahrErhoehung(e.target.checked)} className="rounded" />
                Sitzerhoehung benoetigt
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMitfahrDialog(null)}>Abbrechen</Button>
              <Button onClick={() => mitfahrDialog && handleMitfahren(mitfahrDialog)}>
                Mitfahren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
