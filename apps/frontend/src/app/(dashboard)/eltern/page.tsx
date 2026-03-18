'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, CalendarDays, MapPin, Building2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBenutzer } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';

interface Kind {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  status: string;
  sport: string[];
  teamMembers: Array<{
    id: string;
    teamId: string;
    team?: { id: string; name: string; sport: string; ageGroup: string };
  }>;
}

interface Team {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  abteilung?: { id: string; name: string; sport: string } | null;
}

interface Abteilung {
  id: string;
  name: string;
  sport: string;
  teams: Array<{ id: string; name: string; ageGroup: string }>;
}

interface Veranstaltung {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  team: { name: string };
}

const SPORTARTEN_LABEL: Record<string, string> = {
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

const VERANSTALTUNGSTYP_LABEL: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  TRAINING: { text: 'Training', variant: 'default' },
  MATCH: { text: 'Spiel', variant: 'destructive' },
  TOURNAMENT: { text: 'Turnier', variant: 'secondary' },
  TRIP: { text: 'Ausflug', variant: 'outline' },
  MEETING: { text: 'Besprechung', variant: 'outline' },
};

export default function ElternPortalPage() {
  const benutzer = useBenutzer();
  const router = useRouter();
  const [kinder, setKinder] = useState<Kind[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [abteilungen, setAbteilungen] = useState<Abteilung[]>([]);
  const [veranstaltungen, setVeranstaltungen] = useState<Veranstaltung[]>([]);
  const [ladend, setLadend] = useState(true);

  const datenLaden = useCallback(async () => {
    try {
      const [kinderDaten, teamsDaten, abteilungenDaten] = await Promise.all([
        apiClient.get<Kind[]>('/mitglieder/meine-kinder'),
        apiClient.get<Team[]>('/mitglieder/meine-kinder/teams'),
        apiClient.get<Abteilung[]>('/mitglieder/meine-kinder/abteilungen'),
      ]);
      setKinder(kinderDaten);
      setTeams(teamsDaten);
      setAbteilungen(abteilungenDaten);

      // Veranstaltungen laden (optional, falls API existiert)
      try {
        const veranstaltungenDaten = await apiClient.get<Veranstaltung[]>('/veranstaltungen/meine-kinder');
        setVeranstaltungen(veranstaltungenDaten);
      } catch {
        // Endpoint existiert ggf. noch nicht
      }
    } catch (error) {
      console.error('Fehler beim Laden der Eltern-Daten:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    if (benutzer?.rolle === 'PARENT') {
      datenLaden();
    } else {
      setLadend(false);
    }
  }, [benutzer, datenLaden]);

  if (benutzer && benutzer.rolle !== 'PARENT') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-lg">
            Das Eltern-Portal ist nur fuer Eltern sichtbar.
          </p>
        </div>
      </div>
    );
  }

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Eltern-Portal wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Heart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Eltern-Portal</h1>
          <p className="text-muted-foreground">
            Alles rund um Ihre Kinder im Verein
          </p>
        </div>
      </div>

      {/* Meine Kinder */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Meine Kinder</h2>
        {kinder.length === 0 ? (
          <p className="text-muted-foreground">
            Keine Kinder zugeordnet. Bitte wenden Sie sich an den Verein.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kinder.map((kind) => (
              <Card key={kind.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {kind.firstName} {kind.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Mitgliedsnr. {kind.memberNumber}
                  </p>
                  {kind.sport.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {kind.sport.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {SPORTARTEN_LABEL[s] || s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {kind.teamMembers.length > 0 && (
                    <div className="space-y-1">
                      {kind.teamMembers.map((tm) => (
                        <div
                          key={tm.id}
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <Shield className="h-3 w-3" />
                          {tm.team?.name || 'Team'} ({tm.team?.ageGroup || ''})
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Abteilungen */}
      {abteilungen.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Abteilungen</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {abteilungen.map((abt) => (
              <Card key={abt.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{abt.name}</CardTitle>
                    <Badge variant="secondary" className="ml-auto">
                      {SPORTARTEN_LABEL[abt.sport] || abt.sport}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {abt.teams.length > 0 && (
                    <div className="space-y-1">
                      {abt.teams.map((team) => (
                        <div
                          key={team.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          {team.name} ({team.ageGroup})
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Teams meiner Kinder */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Teams meiner Kinder</h2>
        {teams.length === 0 ? (
          <p className="text-muted-foreground">
            Noch keinen Teams zugeordnet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <Badge key={team.id} variant="secondary" className="text-sm py-1 px-3">
                {team.name} ({team.ageGroup})
                {team.abteilung && (
                  <span className="ml-1 text-muted-foreground">
                    — {team.abteilung.name}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Kommende Veranstaltungen */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Kommende Veranstaltungen</h2>
        {veranstaltungen.length === 0 ? (
          <p className="text-muted-foreground">
            Keine kommenden Veranstaltungen.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {veranstaltungen.map((event) => {
              const typInfo = VERANSTALTUNGSTYP_LABEL[event.type] || {
                text: event.type,
                variant: 'outline' as const,
              };
              return (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/kalender/${event.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{event.title}</CardTitle>
                      <Badge variant={typInfo.variant}>{typInfo.text}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString('de-DE', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Team: {event.team.name}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
