'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Send,
  Download,
  Zap,
  FileText,
  CloudSun,
  Pencil,
  Trash2,
  Globe,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { useBenutzer } from '@/hooks/use-auth';
import WetterBadge from '@/components/wetter/wetter-badge';
import { EventFormular } from '@/components/kalender/event-formular';

interface MitgliedKurz {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

interface AnmeldungData {
  id: string;
  eventId: string;
  memberId: string;
  status: 'PENDING' | 'YES' | 'NO' | 'MAYBE';
  reason: string | null;
  answeredAt: string | null;
  member: MitgliedKurz;
}

interface Zusammenfassung {
  gesamt: number;
  zugesagt: number;
  abgesagt: number;
  vielleicht: number;
  offen: number;
}

interface KommentarData {
  id: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface TeamInfo {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
}

interface EventDetail {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  location: string;
  hallName: string | null;
  hallAddress: string | null;
  untergrund: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  team: TeamInfo;
  attendances: AnmeldungData[];
  comments: KommentarData[];
}

const UNTERGRUND_LABEL: Record<string, string> = {
  HALLE: 'Halle',
  RASEN: 'Rasen',
  KUNSTRASEN: 'Kunstrasen',
  ASCHE: 'Asche',
  HARTPLATZ: 'Hartplatz',
  TARTANBAHN: 'Tartanbahn',
  SCHWIMMBAD: 'Schwimmbad',
  SONSTIGES: 'Sonstiges',
};

const TYP_LABEL: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' }> = {
  TRAINING: { text: 'Training', variant: 'secondary' },
  MATCH: { text: 'Spiel', variant: 'default' },
  TOURNAMENT: { text: 'Turnier', variant: 'default' },
  EVENT: { text: 'Veranstaltung', variant: 'default' },
  VOLUNTEER: { text: 'Helfereinsatz', variant: 'secondary' },
  TRIP: { text: 'Ausflug', variant: 'outline' },
  MEETING: { text: 'Besprechung', variant: 'outline' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; farbe: string }> = {
  YES: { label: 'Zugesagt', icon: CheckCircle2, farbe: 'text-green-600' },
  NO: { label: 'Abgesagt', icon: XCircle, farbe: 'text-red-600' },
  MAYBE: { label: 'Vielleicht', icon: HelpCircle, farbe: 'text-yellow-600' },
  PENDING: { label: 'Offen', icon: AlertCircle, farbe: 'text-muted-foreground' },
};

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKommentarZeit(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const benutzer = useBenutzer();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [anmeldungen, setAnmeldungen] = useState<AnmeldungData[]>([]);
  const [zusammenfassung, setZusammenfassung] = useState<Zusammenfassung | null>(null);
  const [kommentare, setKommentare] = useState<KommentarData[]>([]);
  const [ladend, setLadend] = useState(true);
  const [neuerKommentar, setNeuerKommentar] = useState('');
  const [kommentarLadend, setKommentarLadend] = useState(false);

  const [tokenErfolg, setTokenErfolg] = useState('');
  const [tokenLadend, setTokenLadend] = useState(false);

  const [absageGrund, setAbsageGrund] = useState('');
  const [zeigeAbsageGrund, setZeigeAbsageGrund] = useState(false);
  const [anmeldungLadend, setAnmeldungLadend] = useState(false);
  const [bearbeitenOffen, setBearbeitenOffen] = useState(false);

  // Landingpage
  const [lpOffen, setLpOffen] = useState(false);
  const [lpDaten, setLpDaten] = useState<{
    id?: string;
    slug: string;
    titel: string;
    beschreibung: string;
    ort: string;
    datum: string;
    zeitplan: string;
    anfahrt: string;
    kontaktEmail: string;
    kontaktTelefon: string;
  } | null>(null);
  const [lpLadend, setLpLadend] = useState(false);
  const [lpErfolg, setLpErfolg] = useState('');
  const [lpFehler, setLpFehler] = useState('');

  const datenLaden = useCallback(async () => {
    try {
      const [eventDaten, anmeldungDaten, kommentarDaten] = await Promise.all([
        apiClient.get<EventDetail>(`/veranstaltungen/${eventId}`),
        apiClient.get<{ anmeldungen: AnmeldungData[]; zusammenfassung: Zusammenfassung }>(
          `/veranstaltungen/${eventId}/anmeldung`,
        ),
        apiClient.get<KommentarData[]>(`/veranstaltungen/${eventId}/kommentare`),
      ]);
      setEvent(eventDaten);
      setAnmeldungen(anmeldungDaten.anmeldungen);
      setZusammenfassung(anmeldungDaten.zusammenfassung);
      setKommentare(kommentarDaten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, [eventId]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleAnmeldung = async (status: 'YES' | 'NO' | 'MAYBE', memberId: string) => {
    if (status === 'NO' && !zeigeAbsageGrund) {
      setZeigeAbsageGrund(true);
      return;
    }

    setAnmeldungLadend(true);
    try {
      await apiClient.post(`/veranstaltungen/${eventId}/anmeldung`, {
        status,
        memberId,
        ...(status === 'NO' && { grund: absageGrund }),
      });
      setZeigeAbsageGrund(false);
      setAbsageGrund('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setAnmeldungLadend(false);
    }
  };

  const handleCsvExport = () => {
    window.open(`${API_BASE_URL}/veranstaltungen/${eventId}/export/csv`, '_blank');
  };

  const handleSchnellTokens = async () => {
    setTokenLadend(true);
    try {
      await apiClient.post(`/veranstaltungen/${eventId}/schnell-tokens`, {});
      setTokenErfolg('Schnell-Tokens wurden erfolgreich generiert.');
      setTimeout(() => setTokenErfolg(''), 3000);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setTokenLadend(false);
    }
  };

  const handleKommentar = async () => {
    if (!neuerKommentar.trim()) return;
    setKommentarLadend(true);
    try {
      await apiClient.post(`/veranstaltungen/${eventId}/kommentare`, {
        inhalt: neuerKommentar,
      });
      setNeuerKommentar('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setKommentarLadend(false);
    }
  };

  const handleLoeschen = async () => {
    if (!confirm('Veranstaltung wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/veranstaltungen/${eventId}`);
      router.push('/kalender');
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const istAdmin = benutzer && ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);
  const istVorstand = benutzer && ['ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  // Landingpage-Status laden
  useEffect(() => {
    if (!istVorstand || !eventId) return;
    apiClient.get<{ id: string; slug: string; titel: string; beschreibung: string | null; ort: string | null; datum: string | null; zeitplan: string | null; anfahrt: string | null; kontaktEmail: string | null; kontaktTelefon: string | null } | null>(
      `/homepage/admin/event-landingpage/by-event/${eventId}`,
    ).then((data) => {
      if (data) {
        setLpDaten({
          id: data.id,
          slug: data.slug,
          titel: data.titel,
          beschreibung: data.beschreibung || '',
          ort: data.ort || '',
          datum: data.datum || '',
          zeitplan: data.zeitplan || '',
          anfahrt: data.anfahrt || '',
          kontaktEmail: data.kontaktEmail || '',
          kontaktTelefon: data.kontaktTelefon || '',
        });
      }
    }).catch(() => {
      // Noch keine Landingpage vorhanden
    });
  }, [istVorstand, eventId]);

  const handleLpErstellen = () => {
    if (!event) return;
    const autoSlug = event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    setLpDaten({
      slug: autoSlug,
      titel: event.title,
      beschreibung: '',
      ort: event.location || '',
      datum: '',
      zeitplan: '',
      anfahrt: '',
      kontaktEmail: '',
      kontaktTelefon: '',
    });
    setLpOffen(true);
  };

  const handleLpSpeichern = async () => {
    if (!lpDaten || !lpDaten.slug || !lpDaten.titel) return;
    setLpLadend(true);
    setLpFehler('');
    try {
      if (lpDaten.id) {
        await apiClient.put(`/homepage/admin/event-landingpage/${lpDaten.id}`, {
          titel: lpDaten.titel,
          beschreibung: lpDaten.beschreibung || undefined,
          ort: lpDaten.ort || undefined,
          datum: lpDaten.datum || undefined,
          zeitplan: lpDaten.zeitplan || undefined,
          anfahrt: lpDaten.anfahrt || undefined,
          kontaktEmail: lpDaten.kontaktEmail || undefined,
          kontaktTelefon: lpDaten.kontaktTelefon || undefined,
        });
      } else {
        const result = await apiClient.post<{ id: string }>('/homepage/admin/event-landingpage', {
          eventId,
          slug: lpDaten.slug,
          titel: lpDaten.titel,
          beschreibung: lpDaten.beschreibung || undefined,
          ort: lpDaten.ort || undefined,
          datum: lpDaten.datum || undefined,
          zeitplan: lpDaten.zeitplan || undefined,
          anfahrt: lpDaten.anfahrt || undefined,
          kontaktEmail: lpDaten.kontaktEmail || undefined,
          kontaktTelefon: lpDaten.kontaktTelefon || undefined,
        });
        setLpDaten((prev) => prev ? { ...prev, id: result.id } : prev);
      }
      setLpErfolg('Landingpage gespeichert!');
      setTimeout(() => setLpErfolg(''), 3000);
      setLpOffen(false);
    } catch (error) {
      setLpFehler(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    } finally {
      setLpLadend(false);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Veranstaltung wird geladen...
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

  const typInfo = TYP_LABEL[event.type] || { text: event.type, variant: 'outline' as const };

  // Eigenes Mitglied finden (fuer Anmeldung)
  const eigeneAnmeldung = anmeldungen.find(
    (a) => a.member && benutzer?.id,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/kalender')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant={typInfo.variant}>{typInfo.text}</Badge>
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() => router.push(`/teams/${event.team.id}`)}
              >
                {event.team.name}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {istAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBearbeitenOffen(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleLoeschen}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {event.type === 'MATCH' && istAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/spielberichte/${eventId}`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Spielbericht
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleCsvExport} title="CSV Export">
            <Download className="h-4 w-4" />
          </Button>
          {istAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSchnellTokens}
              disabled={tokenLadend}
            >
              <Zap className="h-4 w-4 mr-2" />
              {tokenLadend ? 'Generiere...' : 'Schnell-Tokens'}
            </Button>
          )}
        </div>
      </div>

      {tokenErfolg && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {tokenErfolg}
        </div>
      )}

      {/* Event-Info */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDatum(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatUhrzeit(event.date)}
              {event.endDate && ` — ${formatUhrzeit(event.endDate)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {event.location}
              {event.hallName && ` (${event.hallName})`}
            </span>
            {event.untergrund && (
              <Badge variant="outline" className="text-xs ml-1">
                {UNTERGRUND_LABEL[event.untergrund] || event.untergrund}
              </Badge>
            )}
          </div>
          {(event.hallAddress || event.location) && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(event.hallAddress || event.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline ml-6"
            >
              In Google Maps oeffnen
            </a>
          )}
          {event.notes && (
            <p className="text-sm text-muted-foreground mt-2">{event.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Wetter-Anzeige (nur fuer zukuenftige Events mit Koordinaten) */}
      {new Date(event.date) > new Date() && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CloudSun className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Wettervorhersage</span>
            </div>
            {event.lat !== null && event.lng !== null ? (
              <WetterBadge lat={event.lat} lng={event.lng} datum={event.date} />
            ) : (
              <WetterBadge eventId={event.id} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Anmeldestatus-Uebersicht */}
      {zusammenfassung && (
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {zusammenfassung.zugesagt}
              </p>
              <p className="text-xs text-muted-foreground">Zugesagt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {zusammenfassung.abgesagt}
              </p>
              <p className="text-xs text-muted-foreground">Abgesagt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {zusammenfassung.vielleicht}
              </p>
              <p className="text-xs text-muted-foreground">Vielleicht</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">
                {zusammenfassung.offen}
              </p>
              <p className="text-xs text-muted-foreground">Offen</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Anmeldungen-Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Anmeldungen ({zusammenfassung?.gesamt || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {anmeldungen.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Anmeldungen vorhanden.
            </p>
          ) : (
            <div className="space-y-2">
              {anmeldungen.map((a) => {
                const config = STATUS_CONFIG[a.status];
                const Icon = config.icon;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${config.farbe}`} />
                      <div>
                        <p className="text-sm font-medium">
                          {a.member.firstName} {a.member.lastName}
                        </p>
                        {a.reason && (
                          <p className="text-xs text-muted-foreground">
                            Grund: {a.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {/* Absage-Grund Eingabe */}
          {zeigeAbsageGrund && (
            <div className="mt-4 space-y-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Grund fuer die Absage:</p>
              <Textarea
                value={absageGrund}
                onChange={(e) => setAbsageGrund(e.target.value)}
                placeholder="Bitte geben Sie einen Grund an..."
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={absageGrund.length < 3 || anmeldungLadend}
                  onClick={() => {
                    // Verwende das erste Pending-Mitglied oder zeige einen Hinweis
                    const pendingAnmeldung = anmeldungen.find(
                      (a) => a.status === 'PENDING',
                    );
                    if (pendingAnmeldung) {
                      handleAnmeldung('NO', pendingAnmeldung.memberId);
                    }
                  }}
                >
                  {anmeldungLadend ? 'Wird gespeichert...' : 'Absage bestaetigen'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setZeigeAbsageGrund(false);
                    setAbsageGrund('');
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schnell-Anmeldung Buttons fuer Trainer */}
      {istAdmin && anmeldungen.some((a) => a.status === 'PENDING') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schnell-Anmeldung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Waehlen Sie ein Mitglied und setzen Sie den Status:
            </p>
            {anmeldungen
              .filter((a) => a.status === 'PENDING')
              .map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm">
                    {a.member.firstName} {a.member.lastName}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50"
                      disabled={anmeldungLadend}
                      onClick={() => handleAnmeldung('YES', a.memberId)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Ja
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      disabled={anmeldungLadend}
                      onClick={() => handleAnmeldung('NO', a.memberId)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Nein
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-yellow-600 hover:bg-yellow-50"
                      disabled={anmeldungLadend}
                      onClick={() => handleAnmeldung('MAYBE', a.memberId)}
                    >
                      <HelpCircle className="h-4 w-4 mr-1" />
                      Vielleicht
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Bearbeiten-Dialog */}
      {event && (
        <EventFormular
          offen={bearbeitenOffen}
          onSchliessen={() => setBearbeitenOffen(false)}
          onGespeichert={datenLaden}
          event={{
            id: event.id,
            title: event.title,
            type: event.type,
            date: event.date,
            endDate: event.endDate,
            location: event.location,
            untergrund: event.untergrund,
            teamId: event.team.id,
            notes: event.notes,
            hallName: event.hallName,
            hallAddress: event.hallAddress,
          }}
        />
      )}

      {/* Landingpage / Werbung */}
      {istVorstand && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Landingpage / Werbung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lpDaten?.id && !lpOffen ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="bg-green-600">Aktiv</Badge>
                  <a
                    href={`/event/${lpDaten.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    /event/{lpDaten.slug}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/event/${lpDaten.slug}`);
                      setLpErfolg('Link kopiert!');
                      setTimeout(() => setLpErfolg(''), 2000);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {lpErfolg && <span className="text-sm text-green-600">{lpErfolg}</span>}
                <Button variant="outline" size="sm" onClick={() => setLpOffen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Landingpage bearbeiten
                </Button>
              </div>
            ) : !lpOffen ? (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Erstellen Sie eine oeffentliche Werbeseite fuer diese Veranstaltung.
                  Ideal fuer Spiele, Turniere und Events - teilen Sie den Link mit Zuschauern, Eltern und Sponsoren.
                </p>
                <Button variant="outline" size="sm" onClick={handleLpErstellen}>
                  <Globe className="h-4 w-4 mr-2" />
                  Landingpage erstellen
                </Button>
              </div>
            ) : null}

            {lpOffen && lpDaten && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                {lpFehler && <p className="text-sm text-destructive">{lpFehler}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">URL-Slug *</Label>
                    <Input
                      value={lpDaten.slug}
                      onChange={(e) => setLpDaten({ ...lpDaten, slug: e.target.value })}
                      placeholder="z.b. sommerturnier-2026"
                      disabled={!!lpDaten.id}
                    />
                    {!lpDaten.id && (
                      <p className="text-xs text-muted-foreground">/event/{lpDaten.slug || '...'}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Titel *</Label>
                    <Input
                      value={lpDaten.titel}
                      onChange={(e) => setLpDaten({ ...lpDaten, titel: e.target.value })}
                      placeholder="Titel der Veranstaltung"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Beschreibung (HTML)</Label>
                  <Textarea
                    value={lpDaten.beschreibung}
                    onChange={(e) => setLpDaten({ ...lpDaten, beschreibung: e.target.value })}
                    placeholder="Beschreibung fuer Besucher der Werbeseite..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Ort / Adresse</Label>
                    <Input
                      value={lpDaten.ort}
                      onChange={(e) => setLpDaten({ ...lpDaten, ort: e.target.value })}
                      placeholder="z.B. Jahnhalle Goeppingen"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Datum (Freitext)</Label>
                    <Input
                      value={lpDaten.datum}
                      onChange={(e) => setLpDaten({ ...lpDaten, datum: e.target.value })}
                      placeholder="z.B. 14.-15. Juni 2026"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zeitplan / Ablauf (HTML)</Label>
                  <Textarea
                    value={lpDaten.zeitplan}
                    onChange={(e) => setLpDaten({ ...lpDaten, zeitplan: e.target.value })}
                    placeholder="z.B. 09:00 Einlass, 10:00 Anpfiff..."
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Anfahrt (HTML)</Label>
                  <Textarea
                    value={lpDaten.anfahrt}
                    onChange={(e) => setLpDaten({ ...lpDaten, anfahrt: e.target.value })}
                    placeholder="Anfahrtsbeschreibung, Parkplaetze..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Kontakt E-Mail</Label>
                    <Input
                      value={lpDaten.kontaktEmail}
                      onChange={(e) => setLpDaten({ ...lpDaten, kontaktEmail: e.target.value })}
                      placeholder="info@verein.de"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kontakt Telefon</Label>
                    <Input
                      value={lpDaten.kontaktTelefon}
                      onChange={(e) => setLpDaten({ ...lpDaten, kontaktTelefon: e.target.value })}
                      placeholder="07161 12345"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleLpSpeichern} disabled={lpLadend || !lpDaten.slug || !lpDaten.titel} size="sm">
                    {lpLadend ? 'Speichern...' : (lpDaten.id ? 'Speichern' : 'Landingpage erstellen')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setLpOffen(false)}>
                    Abbrechen
                  </Button>
                  {lpErfolg && <span className="text-sm text-green-600 self-center">{lpErfolg}</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kommentare */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Kommentare ({kommentare.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {kommentare.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Kommentare.
            </p>
          ) : (
            <div className="space-y-3">
              {kommentare.map((k) => (
                <div key={k.id} className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {k.userId === benutzer?.id ? 'Du' : `Benutzer ${k.userId.slice(0, 8)}...`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatKommentarZeit(k.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{k.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Neuer Kommentar */}
          <div className="flex gap-2">
            <Textarea
              value={neuerKommentar}
              onChange={(e) => setNeuerKommentar(e.target.value)}
              placeholder="Frage oder Kommentar schreiben..."
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleKommentar}
              disabled={!neuerKommentar.trim() || kommentarLadend}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
