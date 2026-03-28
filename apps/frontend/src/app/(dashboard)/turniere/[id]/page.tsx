'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Trophy,
  Plus,
  Trash2,
  Radio,
  ExternalLink,
  ArrowLeft,
  Globe,
  Save,
  Loader2,
  Play,
  Clock,
  Zap,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SpielFormular } from '@/components/turniere/spiel-formular';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';

interface Spiel {
  id: string;
  team1: string;
  team2: string;
  score1: number | null;
  score2: number | null;
  time: string | null;
  field: string | null;
  status: string;
}

interface Turnier {
  id: string;
  name: string;
  sport: string;
  format: string;
  publicUrl: string;
  isLive: boolean;
  matches: Spiel[];
}

const STATUS_LABEL: Record<string, string> = {
  GEPLANT: 'Geplant',
  LAUFEND: 'Laufend',
  BEENDET: 'Beendet',
  ABGESAGT: 'Abgesagt',
};

export default function TurnierDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [turnier, setTurnier] = useState<Turnier | null>(null);
  const [ladend, setLadend] = useState(true);
  const [spielFormularOffen, setSpielFormularOffen] = useState(false);

  // Spielplan-Generator
  const [generatorOffen, setGeneratorOffen] = useState(false);
  const [genTeams, setGenTeams] = useState('');
  const [genStartzeit, setGenStartzeit] = useState('');
  const [genDauer, setGenDauer] = useState('10');
  const [genPuffer, setGenPuffer] = useState('2');
  const [genFelder, setGenFelder] = useState('');
  const [genLadend, setGenLadend] = useState(false);

  // Spielzeit-Einstellungen
  const [spielDauer, setSpielDauer] = useState('10');
  const [spielPuffer, setSpielPuffer] = useState('2');

  // Landingpage
  const [lpOffen, setLpOffen] = useState(false);
  const [lpLadend, setLpLadend] = useState(false);
  const [lpId, setLpId] = useState<string | null>(null);
  const [lpDaten, setLpDaten] = useState({
    slug: '',
    titel: '',
    beschreibung: '',
    ort: '',
    datum: '',
  });

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Turnier>(`/turniere/${id}`);
      setTurnier(daten);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, [id]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleLiveToggle = async () => {
    if (!turnier) return;
    try {
      await apiClient.put(`/turniere/${id}/live`, {
        isLive: !turnier.isLive,
      });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleScoreUpdate = async (
    spielId: string,
    feld: 'score1' | 'score2',
    wert: string,
  ) => {
    try {
      await apiClient.put(`/turniere/${id}/spiele/${spielId}`, {
        [feld]: parseInt(wert) || 0,
      });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleStatusUpdate = async (spielId: string, status: string) => {
    try {
      await apiClient.put(`/turniere/${id}/spiele/${spielId}`, { status });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // Landingpage laden
  useEffect(() => {
    apiClient.get<{ id: string; slug: string; titel: string; beschreibung: string; ort: string; datum: string }>(`/homepage/admin/turnier-landingpage?tournamentId=${id}`)
      .then((lp) => {
        if (lp?.id) {
          setLpId(lp.id);
          setLpDaten({
            slug: lp.slug || '',
            titel: lp.titel || '',
            beschreibung: lp.beschreibung || '',
            ort: lp.ort || '',
            datum: lp.datum || '',
          });
        }
      })
      .catch(() => {});
  }, [id]);

  const lpSpeichern = async () => {
    setLpLadend(true);
    try {
      if (lpId) {
        await apiClient.put(`/homepage/admin/turnier-landingpage/${lpId}`, lpDaten);
      } else {
        const neu = await apiClient.post<{ id: string }>('/homepage/admin/turnier-landingpage', {
          tournamentId: id,
          ...lpDaten,
          slug: lpDaten.slug || turnier?.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || id,
        });
        setLpId(neu.id);
      }
      setLpOffen(false);
    } catch (err) {
      console.error('Landingpage-Fehler:', err);
    } finally {
      setLpLadend(false);
    }
  };

  const handleSpielLoeschen = async (spielId: string) => {
    try {
      await apiClient.delete(`/turniere/${id}/spiele/${spielId}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // Spielplan generieren
  const handleSpielplanGenerieren = async () => {
    const teams = genTeams.split('\n').map((t) => t.trim()).filter(Boolean);
    if (teams.length < 2 || !genStartzeit) return;
    setGenLadend(true);
    try {
      const felder = genFelder.split(',').map((f) => f.trim()).filter(Boolean);
      await apiClient.post(`/turniere/${id}/spielplan-generieren`, {
        teams,
        startzeit: new Date(genStartzeit).toISOString(),
        spielDauerMinuten: parseInt(genDauer),
        pufferMinuten: parseInt(genPuffer),
        felder: felder.length > 0 ? felder : undefined,
      });
      setGeneratorOffen(false);
      setGenTeams('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setGenLadend(false);
    }
  };

  // "Spiel beginnt jetzt" - synct Uhrzeit ab diesem Spiel
  const handleJetztStarten = async (spielId: string) => {
    try {
      await apiClient.put(`/turniere/${id}/zeiten-sync`, {
        abSpielId: spielId,
        startzeit: new Date().toISOString(),
        spielDauerMinuten: parseInt(spielDauer),
        pufferMinuten: parseInt(spielPuffer),
      });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend || !turnier) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  const liveUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/turnier/${turnier.publicUrl}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/turniere">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{turnier.name}</h1>
            <div className="flex gap-2 mt-1">
              {turnier.isLive && (
                <Badge variant="default" className="bg-red-500">
                  <Radio className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={turnier.isLive ? 'destructive' : 'default'}
            onClick={handleLiveToggle}
          >
            <Radio className="h-4 w-4 mr-2" />
            {turnier.isLive ? 'Live beenden' : 'Live schalten'}
          </Button>
          <Button variant="outline" onClick={() => setGeneratorOffen(!generatorOffen)}>
            <Zap className="h-4 w-4 mr-2" />
            Spielplan
          </Button>
          <Button variant="outline" onClick={() => setSpielFormularOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Spiel
          </Button>
        </div>
      </div>

      {/* Live-Link */}
      <Card>
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Oeffentlicher Link:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs">
              {liveUrl}
            </code>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(liveUrl)}
          >
            Kopieren
          </Button>
        </CardContent>
      </Card>

      {/* Landingpage */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Turnier-Landingpage:</span>
              {lpId ? (
                <Badge variant="outline" className="text-green-600">Aktiv</Badge>
              ) : (
                <span className="text-muted-foreground">Nicht erstellt</span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setLpOffen(!lpOffen)}>
              {lpId ? 'Bearbeiten' : 'Erstellen'}
            </Button>
          </div>

          {lpOffen && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Titel</Label>
                  <Input
                    value={lpDaten.titel}
                    onChange={(e) => setLpDaten({ ...lpDaten, titel: e.target.value })}
                    placeholder={turnier?.name || 'Turniername'}
                  />
                </div>
                <div>
                  <Label>URL-Slug</Label>
                  <Input
                    value={lpDaten.slug}
                    onChange={(e) => setLpDaten({ ...lpDaten, slug: e.target.value })}
                    placeholder="hallencup-2026"
                  />
                </div>
              </div>
              <div>
                <Label>Beschreibung</Label>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]"
                  value={lpDaten.beschreibung}
                  onChange={(e) => setLpDaten({ ...lpDaten, beschreibung: e.target.value })}
                  placeholder="Infos zum Turnier, Teilnehmer, Preise..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ort</Label>
                  <Input
                    value={lpDaten.ort}
                    onChange={(e) => setLpDaten({ ...lpDaten, ort: e.target.value })}
                    placeholder="Sporthalle Musterstadt"
                  />
                </div>
                <div>
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={lpDaten.datum}
                    onChange={(e) => setLpDaten({ ...lpDaten, datum: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setLpOffen(false)}>
                  Abbrechen
                </Button>
                <Button size="sm" onClick={lpSpeichern} disabled={lpLadend}>
                  {lpLadend ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spielplan-Generator */}
      {generatorOffen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Zap className="h-5 w-5" /> Spielplan generieren</span>
              <Button variant="ghost" size="icon" onClick={() => setGeneratorOffen(false)}><X className="h-4 w-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Teams (eins pro Zeile) *</Label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px] mt-1"
                value={genTeams}
                onChange={(e) => setGenTeams(e.target.value)}
                placeholder={"FC Kunchen\nTSV Rechberg\nSV Gammelshausen\nSC Geislingen\nFV Goeppingen\nTSG Eislingen"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {genTeams.split('\n').filter((t) => t.trim()).length} Teams → {(() => { const n = genTeams.split('\n').filter((t) => t.trim()).length; return n > 1 ? (n * (n - 1)) / 2 : 0; })()} Spiele
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label>Startzeit *</Label>
                <Input type="datetime-local" value={genStartzeit} onChange={(e) => setGenStartzeit(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Spieldauer (Min.)</Label>
                <Select className="mt-1" value={genDauer} onChange={(e) => setGenDauer(e.target.value)}>
                  <option value="6">6 Min.</option>
                  <option value="8">8 Min.</option>
                  <option value="10">10 Min.</option>
                  <option value="12">12 Min.</option>
                  <option value="15">15 Min.</option>
                  <option value="20">20 Min.</option>
                </Select>
              </div>
              <div>
                <Label>Puffer (Min.)</Label>
                <Select className="mt-1" value={genPuffer} onChange={(e) => setGenPuffer(e.target.value)}>
                  <option value="1">1 Min.</option>
                  <option value="2">2 Min.</option>
                  <option value="3">3 Min.</option>
                  <option value="5">5 Min.</option>
                </Select>
              </div>
              <div>
                <Label>Spielfelder</Label>
                <Input value={genFelder} onChange={(e) => setGenFelder(e.target.value)} placeholder="Feld 1, Feld 2" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-0.5">Komma-getrennt fuer parallele Spiele</p>
              </div>
            </div>
            <Button onClick={handleSpielplanGenerieren} disabled={genLadend || genTeams.split('\n').filter((t) => t.trim()).length < 2 || !genStartzeit}>
              {genLadend ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Spielplan generieren
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Spielzeit-Einstellungen */}
      {turnier.matches.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Spieldauer:</span>
          <Select className="w-24 h-8 text-xs" value={spielDauer} onChange={(e) => setSpielDauer(e.target.value)}>
            <option value="6">6 Min.</option>
            <option value="8">8 Min.</option>
            <option value="10">10 Min.</option>
            <option value="12">12 Min.</option>
            <option value="15">15 Min.</option>
            <option value="20">20 Min.</option>
          </Select>
          <span className="text-muted-foreground">Puffer:</span>
          <Select className="w-20 h-8 text-xs" value={spielPuffer} onChange={(e) => setSpielPuffer(e.target.value)}>
            <option value="1">1 Min.</option>
            <option value="2">2 Min.</option>
            <option value="3">3 Min.</option>
            <option value="5">5 Min.</option>
          </Select>
        </div>
      )}

      {/* Spielplan */}
      <Card>
        <CardHeader>
          <CardTitle>Spielplan</CardTitle>
        </CardHeader>
        <CardContent>
          {turnier.matches.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Noch keine Spiele. Fuegen Sie Spielpaarungen hinzu.
            </p>
          ) : (
            <div className="space-y-3">
              {turnier.matches.map((spiel) => (
                <div
                  key={spiel.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {/* Spielfeld & Zeit */}
                  <div className="w-20 text-xs text-muted-foreground text-center">
                    {spiel.field && <div>{spiel.field}</div>}
                    {spiel.time && (
                      <div>
                        {new Date(spiel.time).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>

                  {/* Team 1 */}
                  <div className="flex-1 text-right font-medium">
                    {spiel.team1}
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1">
                    <Input
                      className="w-12 text-center h-8"
                      value={spiel.score1 ?? ''}
                      onChange={(e) =>
                        handleScoreUpdate(spiel.id, 'score1', e.target.value)
                      }
                      placeholder="-"
                    />
                    <span className="text-muted-foreground">:</span>
                    <Input
                      className="w-12 text-center h-8"
                      value={spiel.score2 ?? ''}
                      onChange={(e) =>
                        handleScoreUpdate(spiel.id, 'score2', e.target.value)
                      }
                      placeholder="-"
                    />
                  </div>

                  {/* Team 2 */}
                  <div className="flex-1 font-medium">{spiel.team2}</div>

                  {/* Status */}
                  <Select
                    className="w-28 h-8 text-xs"
                    value={spiel.status}
                    onChange={(e) =>
                      handleStatusUpdate(spiel.id, e.target.value)
                    }
                  >
                    <option value="GEPLANT">Geplant</option>
                    <option value="LAUFEND">Laufend</option>
                    <option value="BEENDET">Beendet</option>
                    <option value="ABGESAGT">Abgesagt</option>
                  </Select>

                  {/* Jetzt starten */}
                  {spiel.status === 'GEPLANT' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleJetztStarten(spiel.id)}
                      title="Spiel beginnt jetzt - synchronisiert alle folgenden Zeiten"
                    >
                      <Play className="h-3 w-3" />
                      Jetzt
                    </Button>
                  )}

                  {/* Loeschen */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSpielLoeschen(spiel.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spiel-Formular */}
      <SpielFormular
        offen={spielFormularOffen}
        onSchliessen={() => setSpielFormularOffen(false)}
        onGespeichert={datenLaden}
        turnierId={id}
      />
    </div>
  );
}
