'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserX, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

interface RisikoEintrag {
  score: number;
  ampel: 'gruen' | 'gelb' | 'rot';
}

interface AmpelZaehler {
  gruen: number;
  gelb: number;
  rot: number;
}

export function MitgliederbindungWidget() {
  const benutzer = useBenutzer();
  const [zaehler, setZaehler] = useState<AmpelZaehler | null>(null);
  const [ladend, setLadend] = useState(true);

  const istBerechtigt = benutzer && ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);

  useEffect(() => {
    if (!istBerechtigt) {
      setLadend(false);
      return;
    }

    apiClient
      .get<RisikoEintrag[]>('/mitgliederbindung')
      .then((daten) => {
        const z: AmpelZaehler = { gruen: 0, gelb: 0, rot: 0 };
        for (const eintrag of daten) {
          z[eintrag.ampel]++;
        }
        setZaehler(z);
      })
      .catch(() => {
        // Graceful: Widget nicht anzeigen bei Fehler
      })
      .finally(() => setLadend(false));
  }, [istBerechtigt]);

  if (!istBerechtigt || (!ladend && !zaehler)) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Mitglieder im Fokus
        </CardTitle>
        <UserX className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {ladend ? (
          <div className="space-y-2">
            <div className="h-6 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        ) : zaehler ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {zaehler.rot > 0 && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  {zaehler.rot}
                </span>
              )}
              {zaehler.gelb > 0 && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  {zaehler.gelb}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                {zaehler.gruen}
              </span>
            </div>
            <Link href="/mitgliederbindung">
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                Details ansehen
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
