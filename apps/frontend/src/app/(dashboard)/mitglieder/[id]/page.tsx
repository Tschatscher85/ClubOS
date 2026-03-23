'use client';

import { useEffect, useState, useCallback } from 'react';
import { MitgliedDokumente } from '@/components/mitglieder/mitglied-dokumente';
import { TrainerLizenzenBereich } from '@/components/mitglieder/trainer-lizenzen-bereich';
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
  Pencil,
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
  UsersRound,
  Plus,
  Baby,
  Trash2,
  Search,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { sportartLabel } from '@/lib/sportarten';
import { useBenutzer } from '@/hooks/use-auth';
import { UnterschriftPad } from '@/components/unterschrift/unterschrift-pad';
import { MitgliedFormular } from '@/components/mitglieder/mitglied-formular';

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
  vereinsRollen?: string[];
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
  profilBildUrl: string | null;
  fotoErlaubnis: boolean;
  fahrgemeinschaftErlaubnis?: boolean;
  beitragsklasseId?: string | null;
  beitragBetrag?: number | null;
  beitragIntervall?: string | null;
  userId?: string | null;
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

interface FamilieMitglied {
  id: string;
  memberId: string | null;
  userId: string | null;
  rolle: string;
  member: { id: string; firstName: string; lastName: string; memberNumber: string } | null;
  user: { id: string; email: string; role: string } | null;
}

interface FamilieInfo {
  id: string;
  name: string;
  mitglieder: FamilieMitglied[];
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

  // Bearbeiten-Dialog
  const [bearbeitenOffen, setBearbeitenOffen] = useState(false);

  // Unterschrift
  const [unterschriftPadOffen, setUnterschriftPadOffen] = useState(false);
  const [unterschriftSpeichernd, setUnterschriftSpeichernd] = useState(false);

  // Verletzungen
  const [verletzungen, setVerletzungen] = useState<VerletzungDaten[]>([]);

  // Formular-Einreichungen
  const [formulare, setFormulare] = useState<FormularEinreichung[]>([]);

  // Familie
  const [familien, setFamilien] = useState<FamilieInfo[]>([]);
  const [familieDialogOffen, setFamilieDialogOffen] = useState(false);
  const [verfuegbareFamilien, setVerfuegbareFamilien] = useState<FamilieInfo[]>([]);
  const [ausgewaehlteFamilieId, setAusgewaehlteFamilieId] = useState('');
  const [familieRolle, setFamilieRolle] = useState('KIND');
  const [familieHinzufuegend, setFamilieHinzufuegend] = useState(false);
  // Familie: Mitglied hinzufuegen (Suche)
  const [familieMitgliedDialogOffen, setFamilieMitgliedDialogOffen] = useState(false);
  const [familieMitgliedSuche, setFamilieMitgliedSuche] = useState('');
  const [alleMitglieder, setAlleMitglieder] = useState<Array<{ id: string; firstName: string; lastName: string; memberNumber: string; userId?: string | null }>>([]);
  const [ausgewaehltesMitgliedFamilie, setAusgewaehltesMitgliedFamilie] = useState<string>('');
  const [neueMitgliedRolle, setNeueMitgliedRolle] = useState('KIND');
  const [zielfamilieId, setZielfamilieId] = useState('');
  const [familieMitgliedHinzufuegend, setFamilieMitgliedHinzufuegend] = useState(false);

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

      // Familien laden (Member-bezogen: alle Familien durchsuchen)
      apiClient.get<FamilieInfo[]>('/familien')
        .then((alleFamilien) => {
          const memberFamilien = alleFamilien.filter((f) =>
            f.mitglieder.some((m) => m.memberId === mitgliedId),
          );
          setFamilien(memberFamilien);
          setVerfuegbareFamilien(alleFamilien);
        })
        .catch(() => {
          setFamilien([]);
          setVerfuegbareFamilien([]);
        });

      // Alle Mitglieder laden (fuer Familie-Mitglied-Suche)
      apiClient.get<Array<{ id: string; firstName: string; lastName: string; memberNumber: string; userId?: string | null }>>('/mitglieder')
        .then(setAlleMitglieder)
        .catch(() => setAlleMitglieder([]));

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

  const handleFamilieHinzufuegen = useCallback(async () => {
    if (!ausgewaehlteFamilieId) return;
    setFamilieHinzufuegend(true);
    try {
      await apiClient.post(`/familien/${ausgewaehlteFamilieId}/mitglied`, {
        memberId: mitgliedId,
        rolle: familieRolle,
      });
      setFamilieDialogOffen(false);
      setAusgewaehlteFamilieId('');
      setFamilieRolle('KIND');
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Hinzufuegen zur Familie:', error);
    } finally {
      setFamilieHinzufuegend(false);
    }
  }, [ausgewaehlteFamilieId, familieRolle, mitgliedId, datenLaden]);

  const handleNeueFamilieErstellen = useCallback(async () => {
    setFamilieHinzufuegend(true);
    try {
      const neueFamilie = await apiClient.post<FamilieInfo>('/familien', {});
      // Mitglied gleich hinzufuegen
      await apiClient.post(`/familien/${neueFamilie.id}/mitglied`, {
        memberId: mitgliedId,
        rolle: familieRolle,
      });
      setFamilieDialogOffen(false);
      setFamilieRolle('KIND');
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    } finally {
      setFamilieHinzufuegend(false);
    }
  }, [mitgliedId, familieRolle, datenLaden]);

  // Mitglied zu bestehender Familie hinzufuegen (Suche-Dialog)
  const handleFamilieMitgliedHinzufuegen = useCallback(async () => {
    if (!ausgewaehltesMitgliedFamilie || !zielfamilieId) return;
    setFamilieMitgliedHinzufuegend(true);
    try {
      await apiClient.post(`/familien/${zielfamilieId}/mitglied`, {
        memberId: ausgewaehltesMitgliedFamilie,
        rolle: neueMitgliedRolle,
      });
      setFamilieMitgliedDialogOffen(false);
      setAusgewaehltesMitgliedFamilie('');
      setFamilieMitgliedSuche('');
      setNeueMitgliedRolle('KIND');
      setZielfamilieId('');
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Hinzufuegen:', error);
    } finally {
      setFamilieMitgliedHinzufuegend(false);
    }
  }, [ausgewaehltesMitgliedFamilie, zielfamilieId, neueMitgliedRolle, datenLaden]);

  // Mitglied aus Familie entfernen
  const handleFamilieMitgliedEntfernen = useCallback(async (familieId: string, familieMitgliedId: string) => {
    if (!confirm('Familienmitglied wirklich entfernen?')) return;
    try {
      await apiClient.delete(`/familien/${familieId}/mitglied/${familieMitgliedId}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Entfernen:', error);
    }
  }, [datenLaden]);

  // Gefilterte Mitglieder fuer die Suche
  const gefilterteMitgliederFuerFamilie = alleMitglieder.filter((m) => {
    if (!familieMitgliedSuche) return false;
    const suchtext = familieMitgliedSuche.toLowerCase();
    const vollerName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return vollerName.includes(suchtext) || m.memberNumber.toLowerCase().includes(suchtext);
  });

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
      {/* Header mit Profilbild */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/mitglieder')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Profilbild */}
        <div className="relative group shrink-0">
          <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center border-2 border-border">
            {mitglied.profilBildUrl ? (
              <img
                src={`${API_BASE_URL}${mitglied.profilBildUrl}`}
                alt={`${mitglied.firstName} ${mitglied.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">
                {mitglied.firstName.charAt(0)}{mitglied.lastName.charAt(0)}
              </span>
            )}
          </div>
          {istTrainerOderAdmin && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const datei = e.target.files?.[0];
                  if (!datei) return;
                  // Fotoerlaubnis pruefen bei Minderjaehrigen
                  if (mitglied.birthDate) {
                    const geb = new Date(mitglied.birthDate);
                    const heute = new Date();
                    const alter = heute.getFullYear() - geb.getFullYear();
                    if (alter < 18 && !mitglied.fotoErlaubnis) {
                      alert('Fotoerlaubnis der Eltern fehlt. Bitte zuerst im Mitglied-Formular die Fotoerlaubnis aktivieren.');
                      return;
                    }
                  }
                  const formData = new FormData();
                  formData.append('bild', datei);
                  try {
                    const storeJson = localStorage.getItem('auth-storage');
                    const token = storeJson ? JSON.parse(storeJson).state?.accessToken : null;
                    const res = await fetch(`${API_BASE_URL}/mitglieder/${mitgliedId}/profilbild`, {
                      method: 'POST',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                      body: formData,
                    });
                    if (res.ok) datenLaden();
                  } catch { /* Ignore */ }
                }}
              />
            </label>
          )}
        </div>

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
        <div className="flex gap-2">
          {istTrainerOderAdmin && (
            <Button
              variant="outline"
              onClick={() => setBearbeitenOffen(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          )}
          {/* Entwicklung nur fuer Spieler/Jugendspieler oder Kinder ohne User-Account */}
          {istTrainerOderAdmin &&
            (mitglied.user?.vereinsRollen?.some(r => r === 'Spieler' || r === 'Jugendspieler') ||
             (!mitglied.user && mitglied.parentEmail)) && (
            <Button
              variant="outline"
              onClick={() => router.push(`/mitglieder/${mitgliedId}/entwicklung`)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Entwicklung
            </Button>
          )}
        </div>
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

      {/* Familie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Familie
            </div>
            {istTrainerOderAdmin && (
              <div className="flex gap-2">
                {familien.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setZielfamilieId(familien[0].id);
                      setFamilieMitgliedDialogOffen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Mitglied hinzufuegen
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFamilieDialogOffen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {familien.length > 0 ? 'Andere Familie' : 'Familie zuordnen'}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {familien.length > 0 ? (
            <div className="space-y-4">
              {familien.map((familie) => {
                const eltern = familie.mitglieder.filter((m) =>
                  ['MUTTER', 'VATER', 'ERZIEHUNGSBERECHTIGTER'].includes(m.rolle),
                );
                const partner = familie.mitglieder.filter((m) => m.rolle === 'PARTNER');
                const kinder = familie.mitglieder.filter((m) => m.rolle === 'KIND');

                const rolleLabel = (rolle: string) => {
                  switch (rolle) {
                    case 'KIND': return 'Kind';
                    case 'MUTTER': return 'Mutter';
                    case 'VATER': return 'Vater';
                    case 'ERZIEHUNGSBERECHTIGTER': return 'Erziehungsber.';
                    case 'PARTNER': return 'Partner/in';
                    default: return rolle;
                  }
                };

                const rolleIcon = (rolle: string) => {
                  switch (rolle) {
                    case 'KIND': return <Baby className="h-4 w-4 text-blue-500" />;
                    case 'PARTNER': return <Heart className="h-4 w-4 text-pink-500" />;
                    default: return <User className="h-4 w-4 text-purple-500" />;
                  }
                };

                const mitgliedZeile = (fm: FamilieMitglied) => (
                  <div
                    key={fm.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {rolleIcon(fm.rolle)}
                      <span className="text-sm">
                        {fm.member
                          ? `${fm.member.firstName} ${fm.member.lastName}`
                          : fm.user
                            ? fm.user.email
                            : 'Unbekannt'}
                      </span>
                      {fm.memberId === mitgliedId && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          aktuell
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rolleLabel(fm.rolle)}
                      </Badge>
                      {istTrainerOderAdmin && fm.memberId !== mitgliedId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleFamilieMitgliedEntfernen(familie.id, fm.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={familie.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{familie.name}</p>
                      {istTrainerOderAdmin && familien.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setZielfamilieId(familie.id);
                            setFamilieMitgliedDialogOffen(true);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Hinzufuegen
                        </Button>
                      )}
                    </div>

                    {/* Eltern */}
                    {eltern.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Eltern</p>
                        {eltern.map(mitgliedZeile)}
                      </div>
                    )}

                    {/* Partner */}
                    {partner.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Partner</p>
                        {partner.map(mitgliedZeile)}
                      </div>
                    )}

                    {/* Kinder */}
                    {kinder.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kinder</p>
                        {kinder.map(mitgliedZeile)}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/familien`)}
                      className="text-xs"
                    >
                      Zur Familienansicht
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Noch keiner Familie zugeordnet.
              </p>
              {istTrainerOderAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFamilieDialogOffen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Familie erstellen
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Zur Familie hinzufuegen / zuordnen */}
      <Dialog open={familieDialogOffen} onOpenChange={setFamilieDialogOffen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Zur Familie zuordnen</DialogTitle>
            <DialogDescription>
              Ordnen Sie dieses Mitglied einer bestehenden Familie zu oder erstellen Sie eine neue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rolle in der Familie</Label>
              <select
                value={familieRolle}
                onChange={(e) => setFamilieRolle(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="KIND">Kind</option>
                <option value="MUTTER">Mutter</option>
                <option value="VATER">Vater</option>
                <option value="ERZIEHUNGSBERECHTIGTER">Erziehungsberechtigter</option>
                <option value="PARTNER">Partner/in</option>
              </select>
            </div>
            {verfuegbareFamilien.length > 0 && (
              <div className="space-y-2">
                <Label>Bestehende Familie auswaehlen</Label>
                <select
                  value={ausgewaehlteFamilieId}
                  onChange={(e) => setAusgewaehlteFamilieId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Familie waehlen...</option>
                  {verfuegbareFamilien.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.mitglieder.length} Mitglieder)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={handleNeueFamilieErstellen}
                disabled={familieHinzufuegend}
              >
                <Plus className="h-4 w-4 mr-1" />
                Neue Familie erstellen
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFamilieDialogOffen(false)}
                >
                  Abbrechen
                </Button>
                {verfuegbareFamilien.length > 0 && (
                  <Button
                    onClick={handleFamilieHinzufuegen}
                    disabled={!ausgewaehlteFamilieId || familieHinzufuegend}
                  >
                    {familieHinzufuegend ? 'Wird zugeordnet...' : 'Zuordnen'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Familienmitglied suchen und hinzufuegen */}
      <Dialog open={familieMitgliedDialogOffen} onOpenChange={setFamilieMitgliedDialogOffen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Familienmitglied hinzufuegen</DialogTitle>
            <DialogDescription>
              Suchen Sie ein bestehendes Mitglied und fuegen Sie es zur Familie hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rolle des neuen Familienmitglieds</Label>
              <select
                value={neueMitgliedRolle}
                onChange={(e) => setNeueMitgliedRolle(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="KIND">Kind</option>
                <option value="MUTTER">Mutter</option>
                <option value="VATER">Vater</option>
                <option value="ERZIEHUNGSBERECHTIGTER">Erziehungsberechtigter</option>
                <option value="PARTNER">Partner/in</option>
              </select>
            </div>

            {familien.length > 1 && (
              <div className="space-y-2">
                <Label>Zu welcher Familie?</Label>
                <select
                  value={zielfamilieId}
                  onChange={(e) => setZielfamilieId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {familien.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Mitglied suchen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name oder Mitgliedsnummer..."
                  value={familieMitgliedSuche}
                  onChange={(e) => {
                    setFamilieMitgliedSuche(e.target.value);
                    setAusgewaehltesMitgliedFamilie('');
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {familieMitgliedSuche && (
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {gefilterteMitgliederFuerFamilie.length > 0 ? (
                  gefilterteMitgliederFuerFamilie.slice(0, 10).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setAusgewaehltesMitgliedFamilie(m.id);
                        setFamilieMitgliedSuche(`${m.firstName} ${m.lastName}`);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between border-b last:border-b-0 ${
                        ausgewaehltesMitgliedFamilie === m.id ? 'bg-muted' : ''
                      }`}
                    >
                      <span>{m.firstName} {m.lastName}</span>
                      <span className="text-xs text-muted-foreground">#{m.memberNumber}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Kein Mitglied gefunden.
                  </p>
                )}
              </div>
            )}

            {ausgewaehltesMitgliedFamilie && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {alleMitglieder.find((m) => m.id === ausgewaehltesMitgliedFamilie)
                    ? `${alleMitglieder.find((m) => m.id === ausgewaehltesMitgliedFamilie)!.firstName} ${alleMitglieder.find((m) => m.id === ausgewaehltesMitgliedFamilie)!.lastName}`
                    : 'Ausgewaehlt'}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  wird als {neueMitgliedRolle === 'KIND' ? 'Kind' : neueMitgliedRolle === 'MUTTER' ? 'Mutter' : neueMitgliedRolle === 'VATER' ? 'Vater' : neueMitgliedRolle === 'ERZIEHUNGSBERECHTIGTER' ? 'Erziehungsber.' : 'Partner/in'} hinzugefuegt
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFamilieMitgliedDialogOffen(false);
                  setFamilieMitgliedSuche('');
                  setAusgewaehltesMitgliedFamilie('');
                  setNeueMitgliedRolle('KIND');
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleFamilieMitgliedHinzufuegen}
                disabled={!ausgewaehltesMitgliedFamilie || familieMitgliedHinzufuegend}
              >
                {familieMitgliedHinzufuegend ? 'Wird hinzugefuegt...' : 'Hinzufuegen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                      onClick={async () => {
                        try {
                          const authState = JSON.parse(localStorage.getItem('vereinbase-auth') || '{}');
                          const token = authState?.state?.accessToken;
                          const headers: Record<string, string> = {};
                          if (token) headers['Authorization'] = `Bearer ${token}`;

                          // Versuche ausgefuelltes Original-PDF
                          const pdfRes = await fetch(`/api/formulare/einreichungen/${f.id}/ausgefuellt-pdf`, { headers });
                          if (pdfRes.ok && pdfRes.headers.get('content-type')?.includes('pdf')) {
                            const blob = await pdfRes.blob();
                            const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                            const a = document.createElement('a');
                            a.href = url;
                            a.target = '_blank';
                            a.rel = 'noopener';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 5000);
                            return;
                          }

                          // Fallback: HTML-Export
                          const res = await fetch(`/api/formulare/einreichungen/${f.id}/export`, { headers });
                          if (!res.ok) throw new Error('Export fehlgeschlagen');
                          const html = await res.text();
                          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 5000);
                        } catch (error) {
                          alert('Fehler beim Oeffnen des Formulars. Bitte laden Sie die Vorlage neu hoch.');
                          console.error('PDF-Export Fehler:', error);
                        }
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

      {/* Mitglied-Dokumente (Scans, Papieranträge) */}
      <MitgliedDokumente
        memberId={mitglied.id}
        mitgliedName={`${mitglied.firstName} ${mitglied.lastName}`}
      />

      {/* Trainer-Lizenzen (nur wenn Trainer-Rolle in einem Team) */}
      {mitglied.teamMembers?.some((tm) =>
        ['TRAINER', 'CO_TRAINER', 'TORWART_TRAINER'].includes(tm.rolle),
      ) && mitglied.user && (
        <TrainerLizenzenBereich userId={mitglied.user.id} mitgliedName={`${mitglied.firstName} ${mitglied.lastName}`} />
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
              Erstellt einen Login-Zugang für dieses Mitglied. Ein temporaeres
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

      {/* Bearbeiten-Dialog */}
      {mitglied && (
        <MitgliedFormular
          offen={bearbeitenOffen}
          onSchliessen={() => setBearbeitenOffen(false)}
          onGespeichert={datenLaden}
          mitglied={{
            id: mitglied.id,
            firstName: mitglied.firstName,
            lastName: mitglied.lastName,
            email: mitglied.email,
            memberNumber: mitglied.memberNumber,
            birthDate: mitglied.birthDate,
            phone: mitglied.phone,
            address: mitglied.address,
            sport: mitglied.sport,
            parentEmail: mitglied.parentEmail,
            status: mitglied.status,
            joinDate: mitglied.joinDate,
            beitragsklasseId: mitglied.beitragsklasseId,
            beitragBetrag: mitglied.beitragBetrag,
            beitragIntervall: mitglied.beitragIntervall,
            userId: mitglied.userId,
            fotoErlaubnis: mitglied.fotoErlaubnis,
            fahrgemeinschaftErlaubnis: mitglied.fahrgemeinschaftErlaubnis,
          }}
        />
      )}
    </div>
  );
}
