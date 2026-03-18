'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Shield,
  ArrowLeft,
  UserPlus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  BarChart3,
  Shirt,
  Wallet,
  HeartPulse,
  Plus,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { sportartLabel } from '@/lib/sportarten';

interface MitgliedInfo {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  phone: string | null;
  parentEmail: string | null;
  status: string;
}

interface TeamMitglied {
  id: string;
  memberId: string;
  rolle: string;
  member: MitgliedInfo;
}

interface EventData {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  location: string;
  hallName: string | null;
}

interface TeamDetail {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  trainerId: string;
  events: EventData[];
  teamMembers: TeamMitglied[];
  _count: { events: number; teamMembers: number };
}

interface VerfuegbaresMitglied {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
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

// Sportarten-Labels werden dynamisch geladen

const TYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
};

const REHA_STATUS_CONFIG: Record<string, { label: string; farbe: string; bgFarbe: string }> = {
  VERLETZT: { label: 'Verletzt', farbe: 'text-red-700', bgFarbe: 'bg-red-100 border-red-300' },
  REHA: { label: 'Reha', farbe: 'text-orange-700', bgFarbe: 'bg-orange-100 border-orange-300' },
  BEOBACHTEN: { label: 'Beobachten', farbe: 'text-yellow-700', bgFarbe: 'bg-yellow-100 border-yellow-300' },
  FIT: { label: 'Fit', farbe: 'text-green-700', bgFarbe: 'bg-green-100 border-green-300' },
};

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [ladend, setLadend] = useState(true);
  const [alleMitglieder, setAlleMitglieder] = useState<VerfuegbaresMitglied[]>([]);
  const [gewaehltesMitglied, setGewaehltesMitglied] = useState('');
  const [hinzufuegenLadend, setHinzufuegenLadend] = useState(false);
  const [mitgliederSuche, setMitgliederSuche] = useState('');

  // Verletzungen
  const [verletzungen, setVerletzungen] = useState<VerletzungDaten[]>([]);
  const [verletzungDialogOffen, setVerletzungDialogOffen] = useState(false);
  const [statusDialogOffen, setStatusDialogOffen] = useState(false);
  const [ausgewaehlteVerletzung, setAusgewaehlteVerletzung] = useState<VerletzungDaten | null>(null);
  const [verletzungSpeichernd, setVerletzungSpeichernd] = useState(false);

  // Neue Verletzung Formular
  const [neueVerletzungMemberId, setNeueVerletzungMemberId] = useState('');
  const [neueVerletzungArt, setNeueVerletzungArt] = useState('');
  const [neueVerletzungKoerperteil, setNeueVerletzungKoerperteil] = useState('');
  const [neueVerletzungPause, setNeueVerletzungPause] = useState('');
  const [neueVerletzungNotiz, setNeueVerletzungNotiz] = useState('');

  // Status-Update Formular
  const [statusUpdateStatus, setStatusUpdateStatus] = useState('');
  const [statusUpdateZurueckAm, setStatusUpdateZurueckAm] = useState('');
  const [statusUpdateNotiz, setStatusUpdateNotiz] = useState('');

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<TeamDetail>(`/teams/${teamId}`);
      setTeam(daten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, [teamId]);

  const mitgliederLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<VerfuegbaresMitglied[]>('/mitglieder');
      setAlleMitglieder(daten);
    } catch {
      // Fehler ignorieren
    }
  }, []);

  const verletzungenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<VerletzungDaten[]>(`/verletzungen/team/${teamId}`);
      setVerletzungen(daten);
    } catch {
      // Fehler ignorieren (z.B. keine Berechtigung)
    }
  }, [teamId]);

  useEffect(() => {
    datenLaden();
    mitgliederLaden();
    verletzungenLaden();
  }, [datenLaden, mitgliederLaden, verletzungenLaden]);

  const handleHinzufuegen = async () => {
    if (!gewaehltesMitglied) return;
    setHinzufuegenLadend(true);
    try {
      await apiClient.post(`/teams/${teamId}/mitglieder`, {
        memberId: gewaehltesMitglied,
      });
      setGewaehltesMitglied('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setHinzufuegenLadend(false);
    }
  };

  const handleEntfernen = async (memberId: string) => {
    if (!confirm('Mitglied wirklich aus dem Team entfernen?')) return;
    try {
      await apiClient.delete(`/teams/${teamId}/mitglieder/${memberId}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleVerletzungErfassen = async () => {
    if (!neueVerletzungMemberId || !neueVerletzungArt || !neueVerletzungKoerperteil) return;
    setVerletzungSpeichernd(true);
    try {
      await apiClient.post('/verletzungen', {
        memberId: neueVerletzungMemberId,
        art: neueVerletzungArt,
        koerperteil: neueVerletzungKoerperteil,
        pauseVoraus: neueVerletzungPause ? parseInt(neueVerletzungPause, 10) : undefined,
        notiz: neueVerletzungNotiz || undefined,
      });
      setVerletzungDialogOffen(false);
      setNeueVerletzungMemberId('');
      setNeueVerletzungArt('');
      setNeueVerletzungKoerperteil('');
      setNeueVerletzungPause('');
      setNeueVerletzungNotiz('');
      verletzungenLaden();
    } catch (error) {
      console.error('Fehler beim Erfassen der Verletzung:', error);
    } finally {
      setVerletzungSpeichernd(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!ausgewaehlteVerletzung || !statusUpdateStatus) return;
    setVerletzungSpeichernd(true);
    try {
      await apiClient.patch(`/verletzungen/${ausgewaehlteVerletzung.id}`, {
        status: statusUpdateStatus,
        zurueckAm: statusUpdateZurueckAm || undefined,
        notiz: statusUpdateNotiz || undefined,
      });
      setStatusDialogOffen(false);
      setAusgewaehlteVerletzung(null);
      setStatusUpdateStatus('');
      setStatusUpdateZurueckAm('');
      setStatusUpdateNotiz('');
      verletzungenLaden();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    } finally {
      setVerletzungSpeichernd(false);
    }
  };

  const oeffneStatusDialog = (verletzung: VerletzungDaten) => {
    setAusgewaehlteVerletzung(verletzung);
    setStatusUpdateStatus(verletzung.status);
    setStatusUpdateNotiz('');
    setStatusUpdateZurueckAm('');
    setStatusDialogOffen(true);
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Team wird geladen...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Team nicht gefunden.
      </div>
    );
  }

  const bereitsImTeam = new Set(team.teamMembers.map((tm) => tm.memberId));
  const verfuegbareMitglieder = alleMitglieder
    .filter((m) => !bereitsImTeam.has(m.id))
    .filter((m) => {
      if (!mitgliederSuche.trim()) return true;
      const suchText = mitgliederSuche.toLowerCase();
      return (
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(suchText)
      );
    });

  const aktiveVerletzungen = verletzungen.filter((v) => v.status !== 'FIT');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/teams')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">
                  {sportartLabel(team.sport)}
                </Badge>
                <Badge variant="outline">{team.ageGroup}</Badge>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {team._count.teamMembers} Spieler
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/teams/${teamId}/kasse`)}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Kasse
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/teams/${teamId}/trikots`)}
          >
            <Shirt className="h-4 w-4 mr-2" />
            Trikots
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/teams/${teamId}/anwesenheit`)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Anwesenheit
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/teams/${teamId}/aufstellung`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Aufstellung
          </Button>
        </div>
      </div>

      {/* Verletzungen Widget */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-red-500" />
              Verletzungen
              {aktiveVerletzungen.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {aktiveVerletzungen.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setVerletzungDialogOffen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Verletzung erfassen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aktiveVerletzungen.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine aktiven Verletzungen im Team.
            </p>
          ) : (
            <div className="space-y-2">
              {aktiveVerletzungen.map((v) => {
                const statusConfig = REHA_STATUS_CONFIG[v.status] || REHA_STATUS_CONFIG.VERLETZT;
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-md border px-4 py-3 hover:bg-muted/30 cursor-pointer"
                    onClick={() => oeffneStatusDialog(v)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {v.member.firstName} {v.member.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.art} - {v.koerperteil}
                        {v.pauseVoraus && ` (ca. ${v.pauseVoraus} Tage Pause)`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seit {new Date(v.datum).toLocaleDateString('de-DE')}
                      </p>
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

      {/* Tabs */}
      <Tabs defaultValue="kader">
        <TabsList>
          <TabsTrigger value="kader">
            Kader ({team._count.teamMembers})
          </TabsTrigger>
          <TabsTrigger value="kalender">
            Kalender ({team._count.events})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Kader */}
        <TabsContent value="kader">
          <div className="space-y-4">
            {/* Mitglied hinzufuegen */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={mitgliederSuche}
                    onChange={(e) => setMitgliederSuche(e.target.value)}
                    placeholder="Mitglied suchen..."
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-3">
                  <Select
                    className="flex-1"
                    value={gewaehltesMitglied}
                    onChange={(e) => setGewaehltesMitglied(e.target.value)}
                  >
                    <option value="">Mitglied auswaehlen...</option>
                    {verfuegbareMitglieder.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.memberNumber})
                      </option>
                    ))}
                  </Select>
                  <Button
                    onClick={handleHinzufuegen}
                    disabled={!gewaehltesMitglied || hinzufuegenLadend}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {hinzufuegenLadend ? 'Wird hinzugefuegt...' : 'Hinzufuegen'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Kaderliste */}
            {team.teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Spieler im Kader. Fuegen Sie Mitglieder hinzu.
              </div>
            ) : (
              <div className="space-y-2">
                {team.teamMembers.map((tm) => (
                  <Card key={tm.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">
                          {tm.member.firstName} {tm.member.lastName}
                        </p>
                        <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
                          <span>Nr. {tm.member.memberNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            {tm.rolle}
                          </Badge>
                          {tm.member.phone && <span>{tm.member.phone}</span>}
                          {tm.member.parentEmail && (
                            <span>Eltern: {tm.member.parentEmail}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEntfernen(tm.memberId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Kalender */}
        <TabsContent value="kalender">
          {team.events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Veranstaltungen fuer dieses Team.
            </div>
          ) : (
            <div className="space-y-2">
              {team.events.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => router.push(`/kalender/${event.id}`)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {TYP_LABEL[event.type] || event.type}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDatum(event.date)}, {formatUhrzeit(event.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Verletzung erfassen */}
      <Dialog open={verletzungDialogOffen} onOpenChange={setVerletzungDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verletzung erfassen</DialogTitle>
            <DialogDescription>
              Neue Verletzung fuer ein Teammitglied dokumentieren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="verletzung-mitglied">Mitglied</Label>
              <Select
                id="verletzung-mitglied"
                value={neueVerletzungMemberId}
                onChange={(e) => setNeueVerletzungMemberId(e.target.value)}
              >
                <option value="">Mitglied auswaehlen...</option>
                {team?.teamMembers.map((tm) => (
                  <option key={tm.memberId} value={tm.memberId}>
                    {tm.member.firstName} {tm.member.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verletzung-art">Art der Verletzung</Label>
              <Input
                id="verletzung-art"
                placeholder="z.B. Knoechelverstauchung"
                value={neueVerletzungArt}
                onChange={(e) => setNeueVerletzungArt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verletzung-koerperteil">Koerperteil</Label>
              <Input
                id="verletzung-koerperteil"
                placeholder="z.B. Linkes Knie"
                value={neueVerletzungKoerperteil}
                onChange={(e) => setNeueVerletzungKoerperteil(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verletzung-pause">Geschaetzte Pause (Tage)</Label>
              <Input
                id="verletzung-pause"
                type="number"
                min={0}
                placeholder="z.B. 14"
                value={neueVerletzungPause}
                onChange={(e) => setNeueVerletzungPause(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verletzung-notiz">Notiz (optional)</Label>
              <Textarea
                id="verletzung-notiz"
                placeholder="Zusaetzliche Informationen..."
                value={neueVerletzungNotiz}
                onChange={(e) => setNeueVerletzungNotiz(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Gesundheitsdaten werden nur vereinsintern gespeichert (Art. 9 DSGVO)
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setVerletzungDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleVerletzungErfassen}
                disabled={
                  verletzungSpeichernd ||
                  !neueVerletzungMemberId ||
                  !neueVerletzungArt ||
                  !neueVerletzungKoerperteil
                }
              >
                {verletzungSpeichernd ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Status aktualisieren */}
      <Dialog open={statusDialogOffen} onOpenChange={setStatusDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verletzungsstatus aktualisieren</DialogTitle>
            <DialogDescription>
              {ausgewaehlteVerletzung && (
                <>
                  {ausgewaehlteVerletzung.member.firstName}{' '}
                  {ausgewaehlteVerletzung.member.lastName} -{' '}
                  {ausgewaehlteVerletzung.art} ({ausgewaehlteVerletzung.koerperteil})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="status-update">Status</Label>
              <Select
                id="status-update"
                value={statusUpdateStatus}
                onChange={(e) => setStatusUpdateStatus(e.target.value)}
              >
                <option value="VERLETZT">Verletzt</option>
                <option value="REHA">Reha</option>
                <option value="BEOBACHTEN">Beobachten</option>
                <option value="FIT">Fit</option>
              </Select>
            </div>
            {statusUpdateStatus === 'FIT' && (
              <div className="space-y-2">
                <Label htmlFor="status-zurueck">Zurueck am</Label>
                <Input
                  id="status-zurueck"
                  type="date"
                  value={statusUpdateZurueckAm}
                  onChange={(e) => setStatusUpdateZurueckAm(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="status-notiz">Notiz (optional)</Label>
              <Textarea
                id="status-notiz"
                placeholder="z.B. Arztbericht liegt vor..."
                value={statusUpdateNotiz}
                onChange={(e) => setStatusUpdateNotiz(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStatusDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={verletzungSpeichernd || !statusUpdateStatus}
              >
                {verletzungSpeichernd ? 'Wird gespeichert...' : 'Aktualisieren'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
