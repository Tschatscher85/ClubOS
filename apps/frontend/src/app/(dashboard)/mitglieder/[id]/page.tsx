'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  phone: string | null;
  status: string;
  sport: string[];
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

const STATUS_ICON: Record<string, { icon: typeof CheckCircle2; farbe: string; label: string }> = {
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

function quoteFarbe(quote: number): string {
  if (quote > 75) return 'text-green-600';
  if (quote > 50) return 'text-yellow-600';
  return 'text-red-600';
}

export default function MitgliedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mitgliedId = params.id as string;

  const [mitglied, setMitglied] = useState<Mitglied | null>(null);
  const [statistik, setStatistik] = useState<AnwesenheitsStatistik | null>(null);
  const [ladend, setLadend] = useState(true);

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
    } catch (error) {
      console.error('Fehler beim Laden der Mitglied-Daten:', error);
    } finally {
      setLadend(false);
    }
  }, [mitgliedId]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/mitglieder')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {mitglied.firstName} {mitglied.lastName}
          </h1>
          <p className="text-muted-foreground">
            Mitgliedsnr. {mitglied.memberNumber}
          </p>
        </div>
      </div>

      {/* Statistik-Karten */}
      {statistik && (
        <div className="grid gap-4 grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anwesenheitsquote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${quoteFarbe(statistik.quote)}`}>
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

      {/* Letzte Veranstaltungen */}
      {statistik && statistik.letzteEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Letzte Veranstaltungen</h2>
          <div className="rounded-md border">
            {statistik.letzteEvents.map((event) => {
              const statusInfo = STATUS_ICON[event.status] || STATUS_ICON.PENDING;
              const StatusIcon = statusInfo.icon;
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
                    <StatusIcon className={`h-5 w-5 ${statusInfo.farbe}`} />
                    <span className={`text-xs ${statusInfo.farbe}`}>
                      {statusInfo.label}
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
