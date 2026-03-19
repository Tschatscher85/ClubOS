'use client';

import { useState, useEffect } from 'react';
import { Trophy, Plus, Pencil, Trash2, ArrowLeft, Save, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { sportartenCacheLeeren } from '@/lib/sportarten';
import Link from 'next/link';

interface Sportart {
  id: string;
  name: string;
  beschreibung: string;
  icon: string;
  istVordefiniert: boolean;
}

interface NeueSportart {
  name: string;
  beschreibung: string;
  icon: string;
}

const LEERE_SPORTART: NeueSportart = {
  name: '',
  beschreibung: '',
  icon: '',
};

// Vorauswahl bekannter Sportarten die schnell hinzugefuegt werden koennen
const VORAUSWAHL_SPORTARTEN = [
  { name: 'Badminton', icon: '🏸' },
  { name: 'Volleyball', icon: '🏐' },
  { name: 'Tischtennis', icon: '🏓' },
  { name: 'Eishockey', icon: '🏒' },
  { name: 'Rugby', icon: '🏉' },
  { name: 'Baseball', icon: '⚾' },
  { name: 'Golf', icon: '⛳' },
  { name: 'Boxen', icon: '🥊' },
  { name: 'Judo', icon: '🥋' },
  { name: 'Karate', icon: '🥋' },
  { name: 'Reiten', icon: '🏇' },
  { name: 'Rudern', icon: '🚣' },
  { name: 'Klettern', icon: '🧗' },
  { name: 'Ski', icon: '⛷️' },
  { name: 'Tanzen', icon: '💃' },
  { name: 'Yoga', icon: '🧘' },
  { name: 'Fechten', icon: '🤺' },
  { name: 'Bogenschiessen', icon: '🏹' },
  { name: 'Segeln', icon: '⛵' },
  { name: 'Triathlon', icon: '🏊' },
];

export default function SportartenPage() {
  const { benutzer } = useAuth();
  const [sportarten, setSportarten] = useState<Sportart[]>([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');

  // Neue Sportart
  const [neueSportart, setNeueSportart] = useState<NeueSportart>(LEERE_SPORTART);
  const [erstellend, setErstellend] = useState(false);
  const [formularOffen, setFormularOffen] = useState(false);

  // Vorauswahl
  const [vorauswahlOffen, setVorauswahlOffen] = useState(false);

  // Bearbeiten
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);
  const [bearbeitenDaten, setBearbeitenDaten] = useState<NeueSportart>(LEERE_SPORTART);
  const [speichernd, setSpeichernd] = useState(false);

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  // Vordefinierte mit Aktivitaetsstatus
  const [vordefinierteAlle, setVordefinierteAlle] = useState<{ id: string; name: string; istAktiv: boolean }[]>([]);

  const laden = async () => {
    setLadend(true);
    try {
      const [result, vordefResult] = await Promise.all([
        apiClient.get<Sportart[]>('/sportarten'),
        apiClient.get<{ id: string; name: string; istAktiv: boolean }[]>('/sportarten/alle-vordefinierten').catch(() => []),
      ]);
      setSportarten(result);
      setVordefinierteAlle(vordefResult);
    } catch {
      setFehler('Fehler beim Laden der Sportarten.');
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => {
    laden();
  }, []);

  const handleVordefinierteToggle = async (sportId: string) => {
    const neueAktive = vordefinierteAlle
      .map((s) => s.id === sportId ? { ...s, istAktiv: !s.istAktiv } : s)
      .filter((s) => s.istAktiv)
      .map((s) => s.id);
    try {
      await apiClient.put('/sportarten/aktive', { sportarten: neueAktive });
      sportartenCacheLeeren();
      await laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    }
  };

  const handleErstellen = async () => {
    if (!neueSportart.name.trim()) {
      setFehler('Name ist erforderlich.');
      return;
    }
    setErstellend(true);
    setFehler('');
    setErfolg('');
    try {
      await apiClient.post('/sportarten/custom', neueSportart);
      setErfolg('Sportart erstellt.');
      setNeueSportart(LEERE_SPORTART);
      setFormularOffen(false);
      sportartenCacheLeeren();
      setTimeout(() => setErfolg(''), 5000);
      await laden();
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Erstellen der Sportart.',
      );
    } finally {
      setErstellend(false);
    }
  };

  const handleSchnellHinzufuegen = async (name: string, icon: string) => {
    setFehler('');
    setErfolg('');
    try {
      await apiClient.post('/sportarten/custom', { name, icon, beschreibung: '' });
      sportartenCacheLeeren();
      await laden();
      setErfolg(`"${name}" hinzugefuegt.`);
      setTimeout(() => setErfolg(''), 3000);
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Hinzufuegen.',
      );
    }
  };

  const handleSpeichern = async (id: string) => {
    if (!bearbeitenDaten.name.trim()) {
      setFehler('Name ist erforderlich.');
      return;
    }
    setSpeichernd(true);
    setFehler('');
    setErfolg('');
    try {
      await apiClient.put(`/sportarten/custom/${id}`, bearbeitenDaten);
      setErfolg('Sportart aktualisiert.');
      setBearbeitenId(null);
      sportartenCacheLeeren();
      setTimeout(() => setErfolg(''), 5000);
      await laden();
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Speichern der Sportart.',
      );
    } finally {
      setSpeichernd(false);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Sportart wirklich loeschen?')) return;
    setFehler('');
    setErfolg('');
    try {
      await apiClient.delete(`/sportarten/custom/${id}`);
      setErfolg('Sportart geloescht.');
      sportartenCacheLeeren();
      setTimeout(() => setErfolg(''), 5000);
      await laden();
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Loeschen der Sportart.',
      );
    }
  };

  // Alle leeren/unbenannten Sportarten auf einmal loeschen
  const handleLeereLoeschen = async () => {
    const leere = eigene.filter((s) => !s.name.trim());
    if (leere.length === 0) return;
    if (!confirm(`${leere.length} leere Sportarten loeschen?`)) return;
    setFehler('');
    setErfolg('');
    try {
      for (const s of leere) {
        await apiClient.delete(`/sportarten/custom/${s.id}`);
      }
      setErfolg(`${leere.length} leere Sportarten geloescht.`);
      sportartenCacheLeeren();
      setTimeout(() => setErfolg(''), 5000);
      await laden();
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Bereinigen.',
      );
    }
  };

  const startBearbeiten = (sportart: Sportart) => {
    setBearbeitenId(sportart.id);
    setBearbeitenDaten({
      name: sportart.name,
      beschreibung: sportart.beschreibung,
      icon: sportart.icon,
    });
  };

  const vordefinierte = sportarten.filter((s) => s.istVordefiniert);
  const eigene = sportarten.filter((s) => !s.istVordefiniert);
  const leereAnzahl = eigene.filter((s) => !s.name.trim()).length;

  // Welche Vorauswahl-Sportarten sind schon vorhanden?
  const vorhandeneNamen = new Set(sportarten.map((s) => s.name.toLowerCase()));
  const verfuegbareVorauswahl = VORAUSWAHL_SPORTARTEN.filter(
    (v) => !vorhandeneNamen.has(v.name.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Link href="/einstellungen" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Einstellungen
      </Link>
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Sportarten</h1>
          <p className="text-muted-foreground">
            Sportarten des Vereins verwalten — werden ueberall im System verwendet
          </p>
        </div>
      </div>

      {fehler && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{fehler}</div>
      )}
      {erfolg && (
        <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md p-3">{erfolg}</div>
      )}

      {/* Vordefinierte Sportarten */}
      <Card>
        <CardHeader>
          <CardTitle>Vordefinierte Sportarten</CardTitle>
          <CardDescription>
            Klicken Sie auf eine Sportart um sie fuer Ihren Verein zu aktivieren/deaktivieren.
            Nur aktive Sportarten erscheinen in Formularen.
            {vordefinierteAlle.filter((s) => s.istAktiv).length > 0 && (
              <span className="block mt-1 font-medium text-foreground">
                {vordefinierteAlle.filter((s) => s.istAktiv).length} aktiv
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ladend ? (
            <p className="text-muted-foreground">Wird geladen...</p>
          ) : vordefinierteAlle.length === 0 ? (
            <p className="text-muted-foreground">Keine vordefinierten Sportarten vorhanden.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vordefinierteAlle.map((sportart) => (
                <button
                  key={sportart.id}
                  onClick={() => handleVordefinierteToggle(sportart.id)}
                  className={`text-sm py-1 px-3 rounded-full border transition-colors ${
                    sportart.istAktiv
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {sportart.name}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eigene Sportarten */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Eigene Sportarten</CardTitle>
              <CardDescription>
                Zusaetzliche Sportarten fuer Ihren Verein. Erscheinen automatisch in Team-, Mitglied- und Abteilungs-Formularen.
              </CardDescription>
            </div>
            {istAdmin && (
              <div className="flex gap-2">
                {leereAnzahl > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLeereLoeschen}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {leereAnzahl} Leere bereinigen
                  </Button>
                )}
                {!formularOffen && (
                  <Button onClick={() => setFormularOffen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Neue Sportart
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Neue Sportart Formular */}
          {formularOffen && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="font-medium">Neue Sportart erstellen</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={neueSportart.name}
                    onChange={(e) => setNeueSportart((p) => ({ ...p, name: e.target.value }))}
                    placeholder="z.B. Badminton"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon (Emoji)</Label>
                  <Input
                    value={neueSportart.icon}
                    onChange={(e) => setNeueSportart((p) => ({ ...p, icon: e.target.value }))}
                    placeholder="z.B. 🏸"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Input
                    value={neueSportart.beschreibung}
                    onChange={(e) => setNeueSportart((p) => ({ ...p, beschreibung: e.target.value }))}
                    placeholder="Kurze Beschreibung"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleErstellen} disabled={erstellend} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {erstellend ? 'Erstellen...' : 'Erstellen'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormularOffen(false);
                    setNeueSportart(LEERE_SPORTART);
                  }}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {/* Schnell-Vorauswahl */}
          {istAdmin && verfuegbareVorauswahl.length > 0 && (
            <div>
              <button
                onClick={() => setVorauswahlOffen(!vorauswahlOffen)}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Zap className="h-4 w-4" />
                {vorauswahlOffen ? 'Vorauswahl verbergen' : 'Sportart schnell hinzufuegen'}
              </button>
              {vorauswahlOffen && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {verfuegbareVorauswahl.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => handleSchnellHinzufuegen(v.name, v.icon)}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-primary/10 hover:border-primary transition-colors"
                    >
                      <span>{v.icon}</span>
                      <span>{v.name}</span>
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Liste der eigenen Sportarten */}
          {ladend ? (
            <p className="text-muted-foreground">Wird geladen...</p>
          ) : eigene.filter((s) => s.name.trim()).length === 0 ? (
            <p className="text-muted-foreground">
              Noch keine eigenen Sportarten erstellt. Nutzen Sie die Schnell-Vorauswahl oben oder erstellen Sie eine neue Sportart.
            </p>
          ) : (
            <div className="space-y-3">
              {eigene
                .filter((s) => s.name.trim())
                .map((sportart) => (
                <div
                  key={sportart.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  {bearbeitenId === sportart.id ? (
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={bearbeitenDaten.name}
                            onChange={(e) =>
                              setBearbeitenDaten((p) => ({ ...p, name: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Icon</Label>
                          <Input
                            value={bearbeitenDaten.icon}
                            onChange={(e) =>
                              setBearbeitenDaten((p) => ({ ...p, icon: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Beschreibung</Label>
                          <Input
                            value={bearbeitenDaten.beschreibung}
                            onChange={(e) =>
                              setBearbeitenDaten((p) => ({ ...p, beschreibung: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSpeichern(sportart.id)}
                          disabled={speichernd}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          {speichernd ? 'Speichern...' : 'Speichern'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBearbeitenId(null)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        {sportart.icon && (
                          <span className="text-lg">{sportart.icon}</span>
                        )}
                        <div>
                          <p className="font-medium">{sportart.name}</p>
                          {sportart.beschreibung && (
                            <p className="text-sm text-muted-foreground">
                              {sportart.beschreibung}
                            </p>
                          )}
                        </div>
                      </div>
                      {istAdmin && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startBearbeiten(sportart)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoeschen(sportart.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <CardDescription>
            Aenderungen an Sportarten wirken sich automatisch auf alle Formulare im System aus
            (Team erstellen, Mitglied bearbeiten, Abteilung erstellen).
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
