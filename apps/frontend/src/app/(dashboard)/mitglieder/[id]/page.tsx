'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Phone,
  MapPin,
  Calendar,
  Mail,
  Dumbbell,
  Link2,
  PenTool,
  Shield,
  User,
  QrCode,
  Key,
  Loader2,
  TrendingUp,
  HeartPulse,
  Info,
  FileText,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { sportartLabel } from '@/lib/sportarten';
import { useBenutzer } from '@/hooks/use-auth';
import { UnterschriftPad } from '@/components/unterschrift/unterschrift-pad';

interface TeamMitgliedschaft {
  id: string;
  rolle: string;
  team: {
    id: string;
    name: string;
    sport: string;
    ageGroup: string;
  };
}

interface BenutzerInfo {
  id: string;
  email: string;
  role: string;
}

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  memberNumber: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  joinDate: string;
  status: string;
  sport: string[];
  parentEmail: string | null;
  signatureUrl: string | null;
  qrCode: string | null;
  teamMembers: TeamMitgliedschaft[];
  user: BenutzerInfo | null;
}

interface FormularEinreichung {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  daten: Record<string, unknown>;
  signatureUrl?: string;
  kommentar?: string;
  template: { name: string; type: string };
}

interface AnwesenheitsStatistik {
  gesamt: number;
  zugesagt: number;
  abgesagt: number;
  vielleicht: number;
  offen: number;
  quote: number;
  letzteEvents: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
    status: string;
  }>;
}

interface VerletzungDaten {
  id: string;
  memberId: string;
  art: string;
  koerperteil: string;
  datum: string;
  pauseVoraus: number | null;
  zurueckAm: string | null;
  notiz: string | null;
  status: string;
  erstelltAm: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber: string;
  };
}

const REHA_STATUS_CONFIG: Record<string, { label: string; farbe: string; bgFarbe: string }> = {
  VERLETZT: { label: 'Verletzt', farbe: 'text-red-700', bgFarbe: 'bg-red-100 border-red-300' },
  REHA: { label: 'Reha', farbe: 'text-orange-700', bgFarbe: 'bg-orange-100 border-orange-300' },
  BEOBACHTEN: { label: 'Beobachten', farbe: 'text-yellow-700', bgFarbe: 'bg-yellow-100 border-yellow-300' },
  FIT: { label: 'Fit', farbe: 'text-green-700', bgFarbe: 'bg-green-100 border-green-300' },
};

const STATUS_ICON: Record<
  string,
  { icon: typeof CheckCircle2; farbe: string; label: string }
> = {
  YES: { icon: CheckCircle2, farbe: 'text-green-600', label: 'Zugesagt' },
  NO: { icon: XCircle, farbe: 'text-red-600', label: 'Abgesagt' },
  MAYBE: { icon: HelpCircle, farbe: 'text-yellow-600', label: 'Vielleicht' },
  PENDING: { icon: Clock, farbe: 'text-muted-foreground', label: 'Offen' },
};

const VERANSTALTUNGSTYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
};

// Sportarten-Labels dynamisch via sportartLabel()

const STATUS_LABEL: Record<
  string,
  { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING: { text: 'Ausstehend', variant: 'outline' },
  ACTIVE: { text: 'Aktiv', variant: 'default' },
  INACTIVE: { text: 'Inaktiv', variant: 'secondary' },
  CANCELLED: { text: 'Ausgetreten', variant: 'destructive' },
};

const ROLLEN_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  TRAINER: 'Trainer',
  MEMBER: 'Mitglied',
  PARENT: 'Elternteil',
};

function quoteFarbe(quote: number): string {
  if (quote > 75) return 'text-green-600';
  if (quote > 50) return 'text-yellow-600';
  return 'text-red-600';
}

export default function MitgliedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const benutzer = useBenutzer();
  const mitgliedId = params.id as string;

  const istTrainerOderAdmin =
    benutzer && ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);

  const [mitglied, setMitglied] = useState<Mitglied | null>(null);
  const [statistik, setStatistik] = useState<AnwesenheitsStatistik | null>(null);
  const [ladend, setLadend] = useState(true);

  // Benutzer verknuepfen
  const [alleBenutzer, setAlleBenutzer] = useState<BenutzerInfo[]>([]);
  const [ausgewaehlterBenutzerId, setAusgewaehlterBenutzerId] = useState('');
  const [verknuepfenLadend, setVerknuepfenLadend] = useState(false);

  // QR-Code
  const [qrLadend, setQrLadend] = useState(false);

  // Login erstellen
  const [loginErstellend, setLoginErstellend] = useState(false);

  // Unterschrift
  const [unterschriftPadOffen, setUnterschriftPadOffen] = useState(false);
  const [unterschriftSpeichernd, setUnterschriftSpeichernd] = useState(false);

  // Verletzungen
  const [verletzungen, setVerletzungen] = useState<VerletzungDaten[]>([]);

  // Formular-Einreichungen
  const [formulare, setFormulare] = useState<FormularEinreichung[]>([]);

  const datenLaden = useCallback(async () => {
    try {
      const [mitgliedDaten, statistikDaten] = await Promise.all([
        apiClient.get<Mitglied>(`/mitglieder/${mitgliedId}`),
        apiClient.get<AnwesenheitsStatistik>(
          `/veranstaltungen/statistik/mitglied/${mitgliedId}`,
        ),
      ]);
      setMitglied(mitgliedDaten);
      setStatistik(statistikDaten);

      // Formulare laden
      apiClient.get<FormularEinreichung[]>(`/mitglieder/${mitgliedId}/formulare`)
        .then(setFormulare)
        .catch(() => setFormulare([]));

      // Wenn kein Benutzer verknuepft, lade verfuegbare Benutzer
      if (!mitgliedDaten.user) {
        try {
          const benutzerDaten = await apiClient.get<BenutzerInfo[]>('/benutzer');
          setAlleBenutzer(benutzerDaten);
        } catch {
          // Kein Zugriff auf Benutzer-Liste ist ok (z.B. kein Admin)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitglied-Daten:', error);
    } finally {
      setLadend(false);
    }
  }, [mitgliedId]);

  const verletzungenLaden = useCallback(async () => {
    if (!istTrainerOderAdmin) return;
    try {
      const daten = await apiClient.get<VerletzungDaten[]>(
        `/verletzungen/mitglied/${mitgliedId}`,
      );
      setVerletzungen(daten);
    } catch {
      // Kein Zugriff oder Fehler ignorieren
    }
  }, [mitgliedId, istTrainerOderAdmin]);

  useEffect(() => {
    datenLaden();
    verletzungenLaden();
  }, [datenLaden, verletzungenLaden]);

  const handleVerknuepfen = useCallback(async () => {
    if (!ausgewaehlterBenutzerId) return;
    setVerknuepfenLadend(true);
    try {
      await apiClient.put(`/mitglieder/${mitgliedId}/verknuepfen`, {
        userId: ausgewaehlterBenutzerId,
      });
      setAusgewaehlterBenutzerId('');
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Verknuepfen:', error);
    } finally {
      setVerknuepfenLadend(false);
    }
  }, [ausgewaehlterBenutzerId, mitgliedId, datenLaden]);

  const handleQrGenerieren = useCallback(async () => {
    setQrLadend(true);
    try {
      const ergebnis = await apiClient.get<{ qrCode: string }>(
        `/qrcode/mitglied/${mitgliedId}`,
      );
      setMitglied((prev) =>
        prev ? { ...prev, qrCode: ergebnis.qrCode } : prev,
      );
    } catch (error) {
      console.error('Fehler beim Generieren des QR-Codes:', error);
    } finally {
      setQrLadend(false);
    }
  }, [mitgliedId]);

  const handleLoginErstellen = useCallback(async () => {
    setLoginErstellend(true);
    try {
      await apiClient.post(`/mitglieder/${mitgliedId}/login-erstellen`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLoginErstellend(false);
    }
  }, [mitgliedId, datenLaden]);

  const handleUnterschriftGespeichert = useCallback(
    async (dataUrl: string) => {
      setUnterschriftSpeichernd(true);
      try {
        await apiClient.put(`/mitglieder/${mitgliedId}`, {
          signatureUrl: dataUrl,
        });
        setUnterschriftPadOffen(false);
        datenLaden();
      } catch (error) {
        console.error('Fehler beim Speichern der Unterschrift:', error);
      } finally {
        setUnterschriftSpeichernd(false);
      }
    },
    [mitgliedId, datenLaden],
  );

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Mitglied wird geladen...
        </div>
      </div>
    );
  }

  if (!mitglied) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Mitglied nicht gefunden.</p>
          <Button variant="outline" onClick={() => router.push('/mitglieder')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurueck zur Liste
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABEL[mitglied.status] || {
    text: mitglied.status,
    variant: 'outline' as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/mitglieder')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {mitglied.firstName} {mitglied.lastName}
            </h1>
            <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
          </div>
          <p className="text-muted-foreground">
            Mitgliedsnr. {mitglied.memberNumber}
          </p>
        </div>
        {istTrainerOderAdmin && (
          <Button
            variant="outline"
            onClick={() => router.push(`/mitglieder/${mitgliedId}/entwicklung`)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Entwicklung
          </Button>
        )}
      </div>

      {/* Statistik-Karten */}
      {statistik && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anwesenheitsquote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${quoteFarbe(statistik.quote)}`}
              >
                {statistik.quote}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Zugesagt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistik.zugesagt} von {statistik.gesamt}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Abgesagt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistik.abgesagt}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Offen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {statistik.offen}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {mitglied.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">E-Mail</p>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${mitglied.email}`} className="text-sm text-primary hover:underline">{mitglied.email}</a>
                    <button onClick={() => navigator.clipboard.writeText(mitglied.email!)} className="text-muted-foreground hover:text-foreground" title="Kopieren">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {mitglied.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefon</p>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${mitglied.phone}`} className="text-sm text-primary hover:underline">{mitglied.phone}</a>
                    <button onClick={() => navigator.clipboard.writeText(mitglied.phone!)} className="text-muted-foreground hover:text-foreground" title="Kopieren">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {mitglied.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <div className="flex items-center gap-2">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mitglied.address)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{mitglied.address}</a>
                    <button onClick={() => navigator.clipboard.writeText(mitglied.address!)} className="text-muted-foreground hover:text-foreground" title="Kopieren">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {mitglied.birthDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Geburtsdatum</p>
                  <p className="text-sm">
                    {new Date(mitglied.birthDate).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
            {mitglied.parentEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Eltern-E-Mail
                  </p>
                  <p className="text-sm">{mitglied.parentEmail}</p>
                </div>
              </div>
            )}
            {mitglied.sport.length > 0 && (
              <div className="flex items-center gap-3">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Sportarten</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mitglied.sport.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {sportartLabel(s)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          {!mitglied.phone &&
            !mitglied.address &&
            !mitglied.birthDate &&
            !mitglied.parentEmail &&
            mitglied.sport.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Keine Profilinformationen vorhanden.
              </p>
            )}
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mitglied.teamMembers && mitglied.teamMembers.length > 0 ? (
            <div className="space-y-2">
              {mitglied.teamMembers.map((tm) => (
                <div
                  key={tm.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/teams/${tm.team.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{tm.team.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {sportartLabel(tm.team.sport)}
                      </span>
                      <span>-</span>
                      <span>{tm.team.ageGroup}</span>
                    </div>
                  </div>
                  {tm.rolle && (
                    <Badge variant="outline" className="text-xs">
                      {tm.rolle}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Noch keinem Team zugeordnet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Verletzungshistorie (nur fuer Trainer/Admin) */}
      {istTrainerOderAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-red-500" />
              Verletzungshistorie
              {verletzungen.filter((v) => v.status !== 'FIT').length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {verletzungen.filter((v) => v.status !== 'FIT').length} aktiv
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verletzungen.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Verletzungen dokumentiert.
              </p>
            ) : (
              <div className="space-y-2">
                {verletzungen.map((v) => {
                  const statusConfig = REHA_STATUS_CONFIG[v.status] || REHA_STATUS_CONFIG.VERLETZT;
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-md border px-4 py-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {v.art} - {v.koerperteil}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>
                            {new Date(v.datum).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          {v.pauseVoraus && (
                            <span>ca. {v.pauseVoraus} Tage Pause</span>
                          )}
                          {v.zurueckAm && (
                            <span>
                              Zurueck: {new Date(v.zurueckAm).toLocaleDateString('de-DE')}
                            </span>
                          )}
                        </div>
                        {v.notiz && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {v.notiz}
                          </p>
                        )}
                      </div>
                      <Badge className={`${statusConfig.bgFarbe} ${statusConfig.farbe} border`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Gesundheitsdaten werden nur vereinsintern gespeichert (Art. 9 DSGVO)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Formulare & Dokumente */}
      {formulare.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Formulare & Dokumente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formulare.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{f.template.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>
                        {new Date(f.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          f.status === 'GENEHMIGT'
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : f.status === 'ABGELEHNT'
                              ? 'border-red-300 text-red-700 bg-red-50'
                              : f.status === 'EINGEREICHT'
                                ? 'border-orange-300 text-orange-700 bg-orange-50'
                                : ''
                        }
                      >
                        {f.status === 'EINGEREICHT'
                          ? 'Eingereicht'
                          : f.status === 'GENEHMIGT'
                            ? 'Genehmigt'
                            : f.status === 'ABGELEHNT'
                              ? 'Abgelehnt'
                              : f.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {f.signatureUrl && (
                      <Badge variant="secondary" className="text-xs">
                        Unterschrieben
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(
                          `${API_BASE_URL}/formulare/einreichungen/${f.id}/export`,
                          '_blank',
                        );
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benutzerkonto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Benutzerkonto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mitglied.user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">E-Mail</p>
                  <p className="text-sm">{mitglied.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Rolle</p>
                  <Badge variant="secondary">
                    {ROLLEN_LABEL[mitglied.user.role] || mitglied.user.role}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Kein Benutzerkonto verknuepft.
              </p>
              {alleBenutzer.length > 0 && (
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="benutzer-verknuepfen">
                      Benutzer auswaehlen
                    </Label>
                    <Select
                      id="benutzer-verknuepfen"
                      value={ausgewaehlterBenutzerId}
                      onChange={(e) =>
                        setAusgewaehlterBenutzerId(e.target.value)
                      }
                    >
                      <option value="">Benutzer waehlen...</option>
                      {alleBenutzer.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.email} ({ROLLEN_LABEL[b.role] || b.role})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    onClick={handleVerknuepfen}
                    disabled={!ausgewaehlterBenutzerId || verknuepfenLadend}
                  >
                    {verknuepfenLadend ? 'Wird verknuepft...' : 'Verknuepfen'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR-Code Mitgliedsausweis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Digitaler Mitgliedsausweis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mitglied.qrCode ? (
            <div className="flex items-start gap-6">
              <img
                src={mitglied.qrCode}
                alt="QR-Code Mitgliedsausweis"
                className="rounded-lg border p-2 bg-white"
                style={{ maxWidth: '180px' }}
              />
              <div className="space-y-2">
                <p className="font-medium">
                  {mitglied.firstName} {mitglied.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mitglied.memberNumber}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQrGenerieren}
                  disabled={qrLadend}
                >
                  Neu generieren
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Noch kein QR-Code generiert.
              </p>
              <Button onClick={handleQrGenerieren} disabled={qrLadend}>
                {qrLadend ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird generiert...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    QR-Code generieren
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login erstellen (falls kein User verknuepft) */}
      {!mitglied.user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Login erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Erstellt einen Login-Zugang fuer dieses Mitglied. Ein temporaeres
              Passwort wird generiert.
              {!mitglied.email && !mitglied.parentEmail && (
                <span className="block mt-1 text-destructive">
                  Bitte zuerst eine E-Mail-Adresse hinterlegen.
                </span>
              )}
            </p>
            <Button
              onClick={handleLoginErstellen}
              disabled={
                loginErstellend || (!mitglied.email && !mitglied.parentEmail)
              }
            >
              {loginErstellend ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Login erstellen
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Digitale Unterschrift */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Digitale Unterschrift
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mitglied.signatureUrl && !unterschriftPadOffen && (
            <div className="space-y-3">
              <div className="rounded-md border p-2 inline-block bg-white">
                <img
                  src={mitglied.signatureUrl}
                  alt="Digitale Unterschrift"
                  className="max-w-[400px] h-auto"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => setUnterschriftPadOffen(true)}
                >
                  Neue Unterschrift
                </Button>
              </div>
            </div>
          )}
          {!mitglied.signatureUrl && !unterschriftPadOffen && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Keine Unterschrift vorhanden.
              </p>
              <Button
                variant="outline"
                onClick={() => setUnterschriftPadOffen(true)}
              >
                Neue Unterschrift
              </Button>
            </div>
          )}
          {unterschriftPadOffen && (
            <div className="space-y-3">
              {unterschriftSpeichernd ? (
                <div className="animate-pulse text-muted-foreground text-sm">
                  Unterschrift wird gespeichert...
                </div>
              ) : (
                <>
                  <UnterschriftPad onGespeichert={handleUnterschriftGespeichert} />
                  <Button
                    variant="ghost"
                    onClick={() => setUnterschriftPadOffen(false)}
                  >
                    Abbrechen
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Letzte Veranstaltungen */}
      {statistik && statistik.letzteEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Letzte Veranstaltungen</h2>
          <div className="rounded-md border">
            {statistik.letzteEvents.map((event) => {
              const statusIconInfo =
                STATUS_ICON[event.status] || STATUS_ICON.PENDING;
              const StatusIcon = statusIconInfo.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(event.date).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {VERANSTALTUNGSTYP_LABEL[event.type] || event.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={`h-5 w-5 ${statusIconInfo.farbe}`}
                    />
                    <span className={`text-xs ${statusIconInfo.farbe}`}>
                      {statusIconInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {statistik && statistik.letzteEvents.length === 0 && (
        <p className="text-muted-foreground">
          Noch keine Veranstaltungen vorhanden.
        </p>
      )}
    </div>
  );
}
