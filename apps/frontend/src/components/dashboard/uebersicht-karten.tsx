'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, Calendar, MessageSquare, ClipboardCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

interface MitgliederStatistik {
  gesamt: number;
  aktiv: number;
  ausstehend: number;
}

interface TeamStatistik {
  gesamt: number;
}

interface NaechstesEvent {
  title: string;
  date: string;
  team: { name: string };
  _count?: { attendances: number };
}

interface AnwesenheitsRate {
  gesamt: number;
  zugesagt: number;
}

export function UebersichtKarten() {
  const benutzer = useBenutzer();
  const istTrainer = benutzer?.rolle === 'TRAINER';

  const [mitglieder, setMitglieder] = useState<MitgliederStatistik | null>(null);
  const [teams, setTeams] = useState<TeamStatistik | null>(null);
  const [nächstes, setNaechstes] = useState<NaechstesEvent | null | undefined>(undefined);
  const [ungelesen, setUngelesen] = useState<number | null>(null);
  const [anwesenheit, setAnwesenheit] = useState<AnwesenheitsRate | null>(null);

  useEffect(() => {
    apiClient.get<MitgliederStatistik>('/mitglieder/statistik').then(setMitglieder).catch(() => {});
    const teamEndpoint = istTrainer ? '/teams/meine' : '/teams/statistik';
    apiClient.get<TeamStatistik>(teamEndpoint).then(setTeams).catch(() => {});
    apiClient.get<NaechstesEvent | null>('/veranstaltungen/nächstes').then((data) => {
      setNaechstes(data);
      if (data?._count?.attendances !== undefined) {
        setAnwesenheit({ gesamt: data._count.attendances, zugesagt: 0 });
      }
    }).catch(() => setNaechstes(null));
    apiClient.get<{ ungelesen: number }>('/nachrichten/ungelesen').then((d) => setUngelesen(d.ungelesen)).catch(() => {});
  }, [istTrainer]);

  const eventText = nächstes
    ? new Date(nächstes.date).toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      })
    : '---';

  const karten = [
    {
      titel: 'Mitglieder',
      wert: mitglieder ? String(mitglieder.gesamt) : '---',
      beschreibung: mitglieder
        ? `${mitglieder.aktiv} aktiv, ${mitglieder.ausstehend} ausstehend`
        : 'Wird geladen...',
      icon: Users,
    },
    {
      titel: istTrainer ? 'Meine Teams' : 'Teams',
      wert: teams ? String(teams.gesamt) : '---',
      beschreibung: 'Mannschaften',
      icon: Shield,
    },
    {
      titel: 'Naechstes Event',
      wert: eventText,
      beschreibung: nächstes
        ? `${nächstes.title} (${nächstes.team.name})`
        : 'Noch keine geplant',
      icon: Calendar,
    },
    {
      titel: 'Nachrichten',
      wert: ungelesen !== null ? String(ungelesen) : '---',
      beschreibung: 'Ungelesene Nachrichten',
      icon: MessageSquare,
    },
    ...(nächstes && nächstes._count
      ? [
          {
            titel: 'Anwesenheit',
            wert: String(nächstes._count.attendances),
            beschreibung: `Anmeldungen fuer ${nächstes.title}`,
            icon: ClipboardCheck,
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {karten.map((karte) => (
        <Card key={karte.titel}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {karte.titel}
            </CardTitle>
            <karte.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{karte.wert}</div>
            <p className="text-xs text-muted-foreground">
              {karte.beschreibung}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
