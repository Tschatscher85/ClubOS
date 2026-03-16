'use client';

import { Users, Shield, Calendar, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const KARTEN = [
  {
    titel: 'Mitglieder',
    wert: '---',
    beschreibung: 'Aktive Mitglieder',
    icon: Users,
  },
  {
    titel: 'Teams',
    wert: '---',
    beschreibung: 'Mannschaften',
    icon: Shield,
  },
  {
    titel: 'Naechste Veranstaltung',
    wert: '---',
    beschreibung: 'Noch keine geplant',
    icon: Calendar,
  },
  {
    titel: 'Nachrichten',
    wert: '---',
    beschreibung: 'Ungelesene Nachrichten',
    icon: MessageSquare,
  },
];

export function UebersichtKarten() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {KARTEN.map((karte) => (
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
