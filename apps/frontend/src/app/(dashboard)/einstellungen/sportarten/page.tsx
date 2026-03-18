'use client';

import { useState, useEffect } from 'react';
import { Trophy, Plus, Pencil, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
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

  // Bearbeiten
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);
  const [bearbeitenDaten, setBearbeitenDaten] = useState<NeueSportart>(LEERE_SPORTART);
  const [speichernd, setSpeichernd] = useState(false);

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  const laden = async () => {
    setLadend(true);
    try {
      const result = await apiClient.get<Sportart[]>('/sportarten');
      setSportarten(result);
    } catch {
      setFehler('Fehler beim Laden der Sportarten.');
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => {
    laden();
  }, []);

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
      setTimeout(() => setErfolg(''), 5000);
      await laden();
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Loeschen der Sportart.',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/einstellungen">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurueck
          </Button>
        </Link>
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Sportarten</h1>
          <p className="text-muted-foreground">Sportarten des Vereins verwalten</p>
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
          <CardDescription>Diese Sportarten sind im System vordefiniert und koennen nicht geaendert werden.</CardDescription>
        </CardHeader>
        <CardContent>
          {ladend ? (
            <p className="text-muted-foreground">Wird geladen...</p>
          ) : vordefinierte.length === 0 ? (
            <p className="text-muted-foreground">Keine vordefinierten Sportarten vorhanden.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vordefinierte.map((sportart) => (
                <Badge key={sportart.id} variant="secondary" className="text-sm py-1 px-3">
                  {sportart.icon && <span className="mr-1">{sportart.icon}</span>}
                  {sportart.name}
                </Badge>
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
              <CardDescription>Selbst erstellte Sportarten des Vereins</CardDescription>
            </div>
            {istAdmin && !formularOffen && (
              <Button onClick={() => setFormularOffen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Neue Sportart
              </Button>
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
                  <Label>Icon</Label>
                  <Input
                    value={neueSportart.icon}
                    onChange={(e) => setNeueSportart((p) => ({ ...p, icon: e.target.value }))}
                    placeholder="z.B. Emoji oder Icon-Name"
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

          {/* Liste der eigenen Sportarten */}
          {ladend ? (
            <p className="text-muted-foreground">Wird geladen...</p>
          ) : eigene.length === 0 ? (
            <p className="text-muted-foreground">Noch keine eigenen Sportarten erstellt.</p>
          ) : (
            <div className="space-y-3">
              {eigene.map((sportart) => (
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
    </div>
  );
}
