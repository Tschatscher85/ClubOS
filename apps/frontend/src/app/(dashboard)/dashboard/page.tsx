'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Shield,
  Calendar,
  FileText,
  Mail,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

// --- Typen ---

interface Statistik {
  gesamt: number;
  aktiv: number;
  ausstehend: number;
  sportartenVerteilung?: Record<string, number>;
}

interface Team {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
}

interface Einreichung {
  id: string;
  templateName?: string;
  memberName?: string;
  vorname?: string;
  nachname?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface Veranstaltung {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  teamName?: string;
}

interface Einladung {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  status: string;
  createdAt: string;
}

// --- Hilfsfunktionen ---

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

const EVENT_TYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
};

const STATUS_BADGE_VARIANTE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  COMPLETED: 'default',
  ABGESCHLOSSEN: 'default',
  PENDING: 'secondary',
  AUSSTEHEND: 'secondary',
  OFFEN: 'secondary',
  REJECTED: 'destructive',
  ABGELEHNT: 'destructive',
  EXPIRED: 'destructive',
  ABGELAUFEN: 'destructive',
  SENT: 'outline',
  GESENDET: 'outline',
  ACCEPTED: 'default',
  ANGENOMMEN: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Abgeschlossen',
  ABGESCHLOSSEN: 'Abgeschlossen',
  PENDING: 'Ausstehend',
  AUSSTEHEND: 'Ausstehend',
  OFFEN: 'Offen',
  REJECTED: 'Abgelehnt',
  ABGELEHNT: 'Abgelehnt',
  EXPIRED: 'Abgelaufen',
  ABGELAUFEN: 'Abgelaufen',
  SENT: 'Gesendet',
  GESENDET: 'Gesendet',
  ACCEPTED: 'Angenommen',
  ANGENOMMEN: 'Angenommen',
  SIGNED: 'Unterschrieben',
  SUBMITTED: 'Eingereicht',
};

function datumFormatieren(datum: string): string {
  try {
    return new Date(datum).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return datum;
  }
}

function datumMitUhrzeitFormatieren(datum: string): string {
  try {
    return new Date(datum).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return datum;
  }
}

function heutigesDatumFormatieren(): string {
  return new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// --- Lade-Skeleton ---

function StatKartenSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListenSkeleton({ zeilen = 3 }: { zeilen?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: zeilen }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

// --- Leerer Zustand ---

function LeerAnzeige({ text }: { text: string }) {
  return (
    <p className="text-sm text-muted-foreground py-4 text-center">{text}</p>
  );
}

// --- Hauptkomponente ---

export default function DashboardPage() {
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [einreichungen, setEinreichungen] = useState<Einreichung[]>([]);
  const [veranstaltungen, setVeranstaltungen] = useState<Veranstaltung[]>([]);
  const [einladungen, setEinladungen] = useState<Einladung[]>([]);
  const [ladend, setLadend] = useState(true);

  const datenLaden = useCallback(async () => {
    try {
      const ergebnisse = await Promise.allSettled([
        apiClient.get<Statistik>('/mitglieder/statistik'),
        apiClient.get<Team[]>('/teams'),
        apiClient.get<Einreichung[]>('/formulare/einreichungen'),
        apiClient.get<Veranstaltung[]>('/veranstaltungen/kommende'),
        apiClient.get<Einladung[]>('/einladungen'),
      ]);

      if (ergebnisse[0].status === 'fulfilled') {
        setStatistik(ergebnisse[0].value);
      }
      if (ergebnisse[1].status === 'fulfilled') {
        setTeams(ergebnisse[1].value);
      }
      if (ergebnisse[2].status === 'fulfilled') {
        setEinreichungen(ergebnisse[2].value);
      }
      if (ergebnisse[3].status === 'fulfilled') {
        setVeranstaltungen(ergebnisse[3].value);
      }
      if (ergebnisse[4].status === 'fulfilled') {
        setEinladungen(ergebnisse[4].value);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  // Sportarten-Verteilung: Maximalwert fuer prozentuale Balkenbreite
  const sportartenVerteilung = statistik?.sportartenVerteilung ?? {};
  const sportartenEintraege = Object.entries(sportartenVerteilung).sort(
    ([, a], [, b]) => b - a,
  );
  const maxSportWert = sportartenEintraege.length > 0
    ? Math.max(...sportartenEintraege.map(([, v]) => v))
    : 0;

  return (
    <div className="space-y-6">
      {/* Willkommens-Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Willkommen im Dashboard
        </h1>
        <p className="text-muted-foreground">{heutigesDatumFormatieren()}</p>
      </div>

      {/* Statistik-Karten */}
      {ladend ? (
        <StatKartenSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gesamt-Mitglieder
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistik?.gesamt ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktive Mitglieder
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistik?.aktiv ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ausstehende Antraege
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {statistik?.ausstehend ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Teams
              </CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {teams.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mittlerer Bereich: Sportarten-Verteilung + Letzte Einreichungen */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sportarten-Verteilung */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Sportarten-Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ladend ? (
              <ListenSkeleton zeilen={4} />
            ) : sportartenEintraege.length === 0 ? (
              <LeerAnzeige text="Keine Sportarten-Daten vorhanden" />
            ) : (
              <div className="space-y-3">
                {sportartenEintraege.map(([sport, anzahl]) => {
                  const prozent = maxSportWert > 0
                    ? Math.round((anzahl / maxSportWert) * 100)
                    : 0;
                  return (
                    <div key={sport} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {SPORTARTEN_LABEL[sport] || sport}
                        </span>
                        <span className="text-muted-foreground">
                          {anzahl} {anzahl === 1 ? 'Mitglied' : 'Mitglieder'}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${prozent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Letzte Einreichungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Letzte Einreichungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ladend ? (
              <ListenSkeleton zeilen={5} />
            ) : einreichungen.length === 0 ? (
              <LeerAnzeige text="Keine Einreichungen vorhanden" />
            ) : (
              <div className="space-y-4">
                {einreichungen.slice(0, 5).map((e) => {
                  const name = e.memberName
                    || (e.vorname && e.nachname ? `${e.vorname} ${e.nachname}` : null)
                    || 'Unbekannt';
                  return (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {e.templateName || 'Formular'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {name} &middot; {datumFormatieren(e.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={STATUS_BADGE_VARIANTE[e.status] || 'outline'}
                        className="shrink-0"
                      >
                        {STATUS_LABEL[e.status] || e.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unterer Bereich: Kommende Events + Letzte Einladungen */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kommende Veranstaltungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Kommende Veranstaltungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ladend ? (
              <ListenSkeleton zeilen={5} />
            ) : veranstaltungen.length === 0 ? (
              <LeerAnzeige text="Keine kommenden Veranstaltungen" />
            ) : (
              <div className="space-y-4">
                {veranstaltungen.slice(0, 5).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {v.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {datumMitUhrzeitFormatieren(v.date)}
                        {v.teamName ? ` \u00b7 ${v.teamName}` : ''}
                        {v.location ? ` \u00b7 ${v.location}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {EVENT_TYP_LABEL[v.type] || v.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Letzte Einladungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Letzte Einladungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ladend ? (
              <ListenSkeleton zeilen={5} />
            ) : einladungen.length === 0 ? (
              <LeerAnzeige text="Keine Einladungen vorhanden" />
            ) : (
              <div className="space-y-4">
                {einladungen.slice(0, 5).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {e.vorname} {e.nachname}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {e.email} &middot; {datumFormatieren(e.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={STATUS_BADGE_VARIANTE[e.status] || 'outline'}
                      className="shrink-0"
                    >
                      {STATUS_LABEL[e.status] || e.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
