'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, Calendar, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';

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
}

export function UebersichtKarten() {
  const [mitglieder, setMitglieder] = useState<MitgliederStatistik | null>(null);
  const [teams, setTeams] = useState<TeamStatistik | null>(null);
  const [naechstes, setNaechstes] = useState<NaechstesEvent | null | undefined>(undefined);

  useEffect(() => {
    apiClient.get<MitgliederStatistik>('/mitglieder/statistik').then(setMitglieder).catch(() => {});
    apiClient.get<TeamStatistik>('/teams/statistik').then(setTeams).catch(() => {});
    apiClient.get<NaechstesEvent | null>('/veranstaltungen/naechstes').then(setNaechstes).catch(() => setNaechstes(null));
  }, []);

  const eventText = naechstes
    ? new Date(naechstes.date).toLocaleDateString('de-DE', {
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
      titel: 'Teams',
      wert: teams ? String(teams.gesamt) : '---',
      beschreibung: 'Mannschaften',
      icon: Shield,
    },
    {
      titel: 'Naechstes Event',
      wert: eventText,
      beschreibung: naechstes
        ? `${naechstes.title} (${naechstes.team.name})`
        : 'Noch keine geplant',
      icon: Calendar,
    },
    {
      titel: 'Nachrichten',
      wert: '---',
      beschreibung: 'Kommt in Sprint 5',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
