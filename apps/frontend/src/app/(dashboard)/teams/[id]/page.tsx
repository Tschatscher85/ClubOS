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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';

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

const SPORT_LABEL: Record<string, string> = {
  FUSSBALL: 'Fussball',
  HANDBALL: 'Handball',
  BASKETBALL: 'Basketball',
  FOOTBALL: 'Football',
  TENNIS: 'Tennis',
  TURNEN: 'Turnen',
  SCHWIMMEN: 'Schwimmen',
  LEICHTATHLETIK: 'Leichtathletik',
  SONSTIGES: 'Sonstiges',
};

const TYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
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

  useEffect(() => {
    datenLaden();
    mitgliederLaden();
  }, [datenLaden, mitgliederLaden]);

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
                  {SPORT_LABEL[team.sport] || team.sport}
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
        </div>
      </div>

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
    </div>
  );
}
