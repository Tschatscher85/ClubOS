'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trophy,
  Users,
  AlertTriangle,
  Square,
  FileText,
  Sparkles,
  Send,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

interface TeamMitglied {
  id: string;
  memberId: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface EventDetail {
  id: string;
  title: string;
  type: string;
  date: string;
  team: {
    id: string;
    name: string;
    teamMembers: TeamMitglied[];
  };
}

interface Eintrag {
  name: string;
  minute?: number;
}

interface SpielberichtData {
  id: string;
  eventId: string;
  ergebnis: string;
  gegner: string;
  torschuetzen: Eintrag[] | null;
  assists: Eintrag[] | null;
  gelbeKarten: Eintrag[] | null;
  roteKarten: Eintrag[] | null;
  trainerNotiz: string | null;
  kiText: string | null;
  veröffentlicht: boolean;
}

type WizardSchritt = 'ergebnis' | 'torschuetzen' | 'karten' | 'notiz' | 'bericht';

export default function SpielberichtSeite() {
  const params = useParams();
  const router = useRouter();
  const benutzer = useBenutzer();
  const eventId = params.eventId as string;

  // Event-Daten
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [ladend, setLadend] = useState(true);
  const [vorhandenerBericht, setVorhandenerBericht] = useState<SpielberichtData | null>(null);

  // Wizard-State
  const [schritt, setSchritt] = useState<WizardSchritt>('ergebnis');

  // Formular-Daten
  const [heimTore, setHeimTore] = useState(0);
  const [gastTore, setGastTore] = useState(0);
  const [gegner, setGegner] = useState('');
  const [torschuetzen, setTorschuetzen] = useState<Eintrag[]>([]);
  const [gelbeKarten, setGelbeKarten] = useState<Eintrag[]>([]);
  const [roteKarten, setRoteKarten] = useState<Eintrag[]>([]);
  const [trainerNotiz, setTrainerNotiz] = useState('');

  // KI-Text
  const [kiText, setKiText] = useState('');
  const [generierend, setGenerierend] = useState(false);
  const [veroeffentlichend, setVeroeffentlichend] = useState(false);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');

  // Neuer Eintrag Helfer
  const [neuerTorName, setNeuerTorName] = useState('');
  const [neuerTorMinute, setNeuerTorMinute] = useState('');
  const [neueGelbName, setNeueGelbName] = useState('');
  const [neueGelbMinute, setNeueGelbMinute] = useState('');
  const [neueRotName, setNeueRotName] = useState('');
  const [neueRotMinute, setNeueRotMinute] = useState('');

  const datenLaden = useCallback(async () => {
    try {
      const eventDaten = await apiClient.get<EventDetail>(`/veranstaltungen/${eventId}`);
      setEvent(eventDaten);

      // Versuche vorhandenen Bericht zu laden
      try {
        const bericht = await apiClient.get<SpielberichtData>(`/spielberichte/${eventId}`);
        setVorhandenerBericht(bericht);
        // Vorhandene Daten in Formular laden
        const teile = bericht.ergebnis.split(':');
        setHeimTore(parseInt(teile[0]) || 0);
        setGastTore(parseInt(teile[1]) || 0);
        setGegner(bericht.gegner);
        setTorschuetzen(bericht.torschuetzen || []);
        setGelbeKarten(bericht.gelbeKarten || []);
        setRoteKarten(bericht.roteKarten || []);
        setTrainerNotiz(bericht.trainerNotiz || '');
        setKiText(bericht.kiText || '');
        if (bericht.kiText) {
          setSchritt('bericht');
        }
      } catch {
        // Kein Bericht vorhanden — das ist ok
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, [eventId]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleBerichtErstellen = async () => {
    setGenerierend(true);
    setFehler('');
    try {
      const ergebnis = `${heimTore}:${gastTore}`;
      const antwort = await apiClient.post<SpielberichtData>(`/spielberichte/${eventId}`, {
        ergebnis,
        gegner,
        torschuetzen,
        gelbeKarten,
        roteKarten,
        trainerNotiz: trainerNotiz || undefined,
      });
      setVorhandenerBericht(antwort);
      setKiText(antwort.kiText || '');
      setSchritt('bericht');
    } catch (error) {
      setFehler((error as Error).message || 'Fehler beim Erstellen des Berichts.');
    } finally {
      setGenerierend(false);
    }
  };

  const handleVeroeffentlichen = async () => {
    setVeroeffentlichend(true);
    setFehler('');
    try {
      await apiClient.put(`/spielberichte/${eventId}`, {
        kiText,
        veröffentlicht: true,
      });
      setErfolg('Spielbericht erfolgreich veröffentlicht!');
      setTimeout(() => setErfolg(''), 3000);
    } catch (error) {
      setFehler((error as Error).message || 'Fehler beim Veroeffentlichen.');
    } finally {
      setVeroeffentlichend(false);
    }
  };

  const handleSpeichern = async () => {
    setFehler('');
    try {
      await apiClient.put(`/spielberichte/${eventId}`, {
        kiText,
      });
      setErfolg('Aenderungen gespeichert.');
      setTimeout(() => setErfolg(''), 3000);
    } catch (error) {
      setFehler((error as Error).message || 'Fehler beim Speichern.');
    }
  };

  const eintragHinzufügen = (
    liste: Eintrag[],
    setListe: (l: Eintrag[]) => void,
    name: string,
    minute: string,
    setName: (v: string) => void,
    setMinute: (v: string) => void,
  ) => {
    if (!name.trim()) return;
    const neuerEintrag: Eintrag = {
      name: name.trim(),
      ...(minute ? { minute: parseInt(minute) } : {}),
    };
    setListe([...liste, neuerEintrag]);
    setName('');
    setMinute('');
  };

  const eintragEntfernen = (
    liste: Eintrag[],
    setListe: (l: Eintrag[]) => void,
    index: number,
  ) => {
    setListe(liste.filter((_, i) => i !== index));
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Wird geladen...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Veranstaltung nicht gefunden.
      </div>
    );
  }

  const istBerechtigt = benutzer && ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  const schritte: { key: WizardSchritt; label: string }[] = [
    { key: 'ergebnis', label: 'Ergebnis' },
    { key: 'torschuetzen', label: 'Torschuetzen' },
    { key: 'karten', label: 'Karten' },
    { key: 'notiz', label: 'Notiz' },
    { key: 'bericht', label: 'Bericht' },
  ];

  const schrittIndex = schritte.findIndex((s) => s.key === schritt);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/kalender/${eventId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Spielbericht</h1>
          <p className="text-sm text-muted-foreground">
            {event.title} — {event.team.name}
          </p>
        </div>
      </div>

      {fehler && (
        <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          {fehler}
        </div>
      )}

      {erfolg && (
        <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
          {erfolg}
        </div>
      )}

      {/* Fortschrittsanzeige */}
      <div className="flex items-center gap-2">
        {schritte.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (i <= schrittIndex || vorhandenerBericht) setSchritt(s.key);
              }}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                s.key === schritt
                  ? 'bg-primary text-primary-foreground'
                  : i < schrittIndex
                    ? 'bg-primary/20 text-primary cursor-pointer'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.label}
            </button>
            {i < schritte.length - 1 && (
              <div className="w-4 h-px bg-muted-foreground/30" />
            )}
          </div>
        ))}
      </div>

      {/* Schritt 1: Ergebnis + Gegner */}
      {schritt === 'ergebnis' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Ergebnis eingeben
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Gegner</Label>
              <Input
                value={gegner}
                onChange={(e) => setGegner(e.target.value)}
                placeholder="z.B. TSV Musterstadt"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Ergebnis</Label>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{event.team.name}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setHeimTore(Math.max(0, heimTore - 1))}
                    >
                      -
                    </Button>
                    <span className="text-3xl font-bold w-12 text-center">{heimTore}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setHeimTore(heimTore + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <span className="text-2xl font-bold text-muted-foreground">:</span>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{gegner || 'Gegner'}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setGastTore(Math.max(0, gastTore - 1))}
                    >
                      -
                    </Button>
                    <span className="text-3xl font-bold w-12 text-center">{gastTore}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setGastTore(gastTore + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => setSchritt('torschuetzen')}
              disabled={!gegner.trim()}
            >
              Weiter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schritt 2: Torschuetzen */}
      {schritt === 'torschuetzen' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Torschuetzen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {torschuetzen.length > 0 && (
              <div className="space-y-2">
                {torschuetzen.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">
                      {t.name}
                      {t.minute ? ` (${t.minute}.)` : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => eintragEntfernen(torschuetzen, setTorschuetzen, i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={neuerTorName}
                onChange={(e) => setNeuerTorName(e.target.value)}
                placeholder="Spielername"
                className="flex-1"
              />
              <Input
                value={neuerTorMinute}
                onChange={(e) => setNeuerTorMinute(e.target.value)}
                placeholder="Min."
                className="w-20"
                type="number"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  eintragHinzufügen(
                    torschuetzen,
                    setTorschuetzen,
                    neuerTorName,
                    neuerTorMinute,
                    setNeuerTorName,
                    setNeuerTorMinute,
                  )
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSchritt('ergebnis')}>
                Zurueck
              </Button>
              <Button className="flex-1" onClick={() => setSchritt('karten')}>
                Weiter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schritt 3: Karten */}
      {schritt === 'karten' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Karten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gelbe Karten */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Square className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                Gelbe Karten
              </Label>
              {gelbeKarten.length > 0 && (
                <div className="space-y-2 mb-2">
                  {gelbeKarten.map((k, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                      <span className="text-sm">
                        {k.name}
                        {k.minute ? ` (${k.minute}.)` : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => eintragEntfernen(gelbeKarten, setGelbeKarten, i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={neueGelbName}
                  onChange={(e) => setNeueGelbName(e.target.value)}
                  placeholder="Spielername"
                  className="flex-1"
                />
                <Input
                  value={neueGelbMinute}
                  onChange={(e) => setNeueGelbMinute(e.target.value)}
                  placeholder="Min."
                  className="w-20"
                  type="number"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    eintragHinzufügen(
                      gelbeKarten,
                      setGelbeKarten,
                      neueGelbName,
                      neueGelbMinute,
                      setNeueGelbName,
                      setNeueGelbMinute,
                    )
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Rote Karten */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Square className="h-4 w-4 fill-red-500 text-red-500" />
                Rote Karten
              </Label>
              {roteKarten.length > 0 && (
                <div className="space-y-2 mb-2">
                  {roteKarten.map((k, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-md">
                      <span className="text-sm">
                        {k.name}
                        {k.minute ? ` (${k.minute}.)` : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => eintragEntfernen(roteKarten, setRoteKarten, i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={neueRotName}
                  onChange={(e) => setNeueRotName(e.target.value)}
                  placeholder="Spielername"
                  className="flex-1"
                />
                <Input
                  value={neueRotMinute}
                  onChange={(e) => setNeueRotMinute(e.target.value)}
                  placeholder="Min."
                  className="w-20"
                  type="number"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    eintragHinzufügen(
                      roteKarten,
                      setRoteKarten,
                      neueRotName,
                      neueRotMinute,
                      setNeueRotName,
                      setNeueRotMinute,
                    )
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSchritt('torschuetzen')}>
                Zurueck
              </Button>
              <Button className="flex-1" onClick={() => setSchritt('notiz')}>
                Weiter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schritt 4: Trainer-Notiz */}
      {schritt === 'notiz' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Trainer-Notiz (optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={trainerNotiz}
              onChange={(e) => setTrainerNotiz(e.target.value)}
              placeholder="z.B. Starke zweite Halbzeit, gute Mannschaftsleistung..."
              rows={4}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSchritt('karten')}>
                Zurueck
              </Button>
              <Button
                className="flex-1"
                onClick={handleBerichtErstellen}
                disabled={generierend || !istBerechtigt}
              >
                {generierend ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    KI generiert Bericht...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Bericht erstellen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schritt 5: Bericht anzeigen + bearbeiten */}
      {schritt === 'bericht' && (
        <>
          {/* Zusammenfassung */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {event.team.name} vs. {gegner} — {heimTore}:{gastTore}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {torschuetzen.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Tore:</span>
                  {torschuetzen.map((t, i) => (
                    <Badge key={i} variant="secondary">
                      {t.name}
                      {t.minute ? ` (${t.minute}.)` : ''}
                    </Badge>
                  ))}
                </div>
              )}
              {gelbeKarten.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Gelb:</span>
                  {gelbeKarten.map((k, i) => (
                    <Badge key={i} className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {k.name}
                      {k.minute ? ` (${k.minute}.)` : ''}
                    </Badge>
                  ))}
                </div>
              )}
              {roteKarten.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Rot:</span>
                  {roteKarten.map((k, i) => (
                    <Badge key={i} variant="destructive">
                      {k.name}
                      {k.minute ? ` (${k.minute}.)` : ''}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* KI-generierter Text */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                KI-generierter Spielbericht
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {kiText ? (
                <Textarea
                  value={kiText}
                  onChange={(e) => setKiText(e.target.value)}
                  rows={8}
                  className="text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Kein KI-Text generiert. Die KI ist moeglicherweise nicht konfiguriert.
                  Sie koennen den Bericht manuell verfassen.
                </p>
              )}

              {!kiText && (
                <Textarea
                  value={kiText}
                  onChange={(e) => setKiText(e.target.value)}
                  rows={8}
                  placeholder="Spielbericht hier manuell eingeben..."
                  className="text-sm"
                />
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSchritt('notiz')}>
                  Zurueck
                </Button>
                <Button variant="outline" onClick={handleSpeichern}>
                  Speichern
                </Button>
                {istBerechtigt && (
                  <Button
                    className="flex-1"
                    onClick={handleVeroeffentlichen}
                    disabled={veroeffentlichend}
                  >
                    {veroeffentlichend ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird veröffentlicht...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Veroeffentlichen
                      </>
                    )}
                  </Button>
                )}
              </div>

              {vorhandenerBericht?.veröffentlicht && (
                <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
                  Dieser Spielbericht wurde bereits veröffentlicht.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
