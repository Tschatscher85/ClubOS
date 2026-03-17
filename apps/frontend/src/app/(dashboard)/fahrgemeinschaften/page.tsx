'use client';

import { useEffect, useState, useCallback } from 'react';
import { Car, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

interface Fahrgemeinschaft {
  id: string;
  fahrerId: string;
  startort: string;
  zielort: string;
  abfahrt: string;
  plaetze: number;
  kommentar: string | null;
  _count: { mitfahrer: number };
  mitfahrer?: Array<{ userId: string }>;
}

export default function FahrgemeinschaftenPage() {
  const benutzer = useBenutzer();
  const [fahrten, setFahrten] = useState<Fahrgemeinschaft[]>([]);
  const [ladend, setLadend] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);

  const [startort, setStartort] = useState('');
  const [zielort, setZielort] = useState('');
  const [abfahrt, setAbfahrt] = useState('');
  const [plaetze, setPlaetze] = useState(4);
  const [kommentar, setKommentar] = useState('');
  const [speichernd, setSpeichernd] = useState(false);

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
      await apiClient.post(`/fahrgemeinschaften/${id}/mitfahren`, {});
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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Fahrgemeinschaften werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Fahrtenboerse</h1>
            <p className="text-muted-foreground">
              {fahrten.length} {fahrten.length === 1 ? 'Fahrt' : 'Fahrten'} verfuegbar
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Fahrt anbieten
        </Button>
      </div>

      {/* Fahrtenliste */}
      {fahrten.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Fahrgemeinschaften vorhanden. Bieten Sie die erste Fahrt an.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fahrten.map((fahrt) => {
            const frei = freiePlaetze(fahrt);
            const istFahrer = benutzer?.id === fahrt.fahrerId;
            const bereitsAngemeldet = istMitfahrer(fahrt);

            return (
              <Card key={fahrt.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {fahrt.startort}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      {fahrt.zielort}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {abfahrtFormatieren(fahrt.abfahrt)}
                    </p>
                  </div>
                  <Badge variant={frei > 0 ? 'secondary' : 'destructive'}>
                    {fahrt._count.mitfahrer}/{fahrt.plaetze} Plaetze belegt
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fahrt.kommentar && (
                    <p className="text-sm text-muted-foreground">{fahrt.kommentar}</p>
                  )}

                  <div className="flex gap-2">
                    {istFahrer ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleLoeschen(fahrt.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Loeschen
                      </Button>
                    ) : bereitsAngemeldet ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAustreten(fahrt.id)}
                      >
                        Austreten
                      </Button>
                    ) : frei > 0 ? (
                      <Button size="sm" onClick={() => handleMitfahren(fahrt.id)}>
                        Mitfahren
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        Ausgebucht
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Neue Fahrt */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Fahrt anbieten</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Fahrgemeinschaft, damit andere Vereinsmitglieder mitfahren koennen.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleErstellen} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startort">Startort</Label>
              <Input
                id="startort"
                value={startort}
                onChange={(e) => setStartort(e.target.value)}
                placeholder="z.B. Vereinsheim"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zielort">Zielort</Label>
              <Input
                id="zielort"
                value={zielort}
                onChange={(e) => setZielort(e.target.value)}
                placeholder="z.B. Sporthalle Goeppingen"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abfahrt">Abfahrt</Label>
              <Input
                id="abfahrt"
                type="datetime-local"
                value={abfahrt}
                onChange={(e) => setAbfahrt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plaetze">Freie Plaetze</Label>
              <Input
                id="plaetze"
                type="number"
                min={1}
                max={9}
                value={plaetze}
                onChange={(e) => setPlaetze(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kommentar">Kommentar (optional)</Label>
              <Textarea
                id="kommentar"
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                placeholder="z.B. Treffpunkt am Parkplatz"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOffen(false);
                  formularZuruecksetzen();
                }}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={speichernd}>
                {speichernd ? 'Wird erstellt...' : 'Fahrt erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
