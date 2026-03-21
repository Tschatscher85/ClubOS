'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface AuditEintrag {
  id: string;
  aktion: string;
  details: string | null;
  userId: string;
  userEmail: string;
  tenantId: string | null;
  tenantName: string | null;
  ipAdresse: string | null;
  erstelltAm: string;
}

interface AuditAntwort {
  eintraege: AuditEintrag[];
  gesamt: number;
  seite: number;
  proSeite: number;
  seiten: number;
}

const AKTION_CONFIG: Record<string, { label: string; farbe: string }> = {
  VEREIN_GESPERRT: { label: 'Gesperrt', farbe: 'bg-red-100 text-red-800' },
  VEREIN_ENTSPERRT: { label: 'Entsperrt', farbe: 'bg-green-100 text-green-800' },
  PLAN_GEAENDERT: { label: 'Plan', farbe: 'bg-blue-100 text-blue-800' },
  IMPERSONATION: { label: 'Impersonation', farbe: 'bg-orange-100 text-orange-800' },
  KI_TOGGLE: { label: 'KI Toggle', farbe: 'bg-purple-100 text-purple-800' },
  KI_EINSTELLUNGEN: { label: 'KI Einstellungen', farbe: 'bg-purple-100 text-purple-800' },
};

const AKTION_OPTIONEN = [
  { value: '', label: 'Alle Aktionen' },
  { value: 'VEREIN_GESPERRT', label: 'Verein gesperrt' },
  { value: 'VEREIN_ENTSPERRT', label: 'Verein entsperrt' },
  { value: 'PLAN_GEAENDERT', label: 'Plan geaendert' },
  { value: 'IMPERSONATION', label: 'Impersonation' },
  { value: 'KI_TOGGLE', label: 'KI Toggle' },
  { value: 'KI_EINSTELLUNGEN', label: 'KI Einstellungen' },
];

export default function AuditLogSeite() {
  const router = useRouter();
  const benutzer = useBenutzer();
  const { accessToken, profilLaden } = useAuthStore();
  const [bereit, setBereit] = useState(false);
  const [laden, setLaden] = useState(true);
  const [daten, setDaten] = useState<AuditAntwort | null>(null);

  // Filter
  const [seite, setSeite] = useState(1);
  const [aktionFilter, setAktionFilter] = useState('');
  const [vonDatum, setVonDatum] = useState('');
  const [bisDatum, setBisDatum] = useState('');

  useEffect(() => {
    if (!accessToken) {
      router.replace('/anmelden');
      return;
    }
    profilLaden().finally(() => setBereit(true));
  }, [accessToken, router, profilLaden]);

  const datenLaden = useCallback(async () => {
    setLaden(true);
    try {
      const params = new URLSearchParams();
      params.set('seite', seite.toString());
      if (aktionFilter) params.set('aktion', aktionFilter);
      if (vonDatum) params.set('von', vonDatum);
      if (bisDatum) params.set('bis', bisDatum);

      const ergebnis = await apiClient.get<AuditAntwort>(
        `/admin/audit-log?${params.toString()}`,
      );
      setDaten(ergebnis);
    } catch (err) {
      console.error('Audit-Log laden fehlgeschlagen:', err);
    } finally {
      setLaden(false);
    }
  }, [seite, aktionFilter, vonDatum, bisDatum]);

  useEffect(() => {
    if (!bereit) return;
    if (benutzer && benutzer.rolle !== 'SUPERADMIN') {
      router.push('/dashboard');
      return;
    }
    if (benutzer) {
      datenLaden();
    }
  }, [bereit, benutzer, router, datenLaden]);

  const detailsFormatieren = (details: string | null): string => {
    if (!details) return '';
    try {
      const obj = JSON.parse(details);
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    } catch {
      return details;
    }
  };

  if (!bereit || !benutzer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (benutzer.rolle !== 'SUPERADMIN') return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold">Audit-Log</h1>
              <p className="text-sm text-muted-foreground">Alle Admin-Aktionen protokolliert</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filter */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Aktion</label>
                <select
                  value={aktionFilter}
                  onChange={(e) => { setAktionFilter(e.target.value); setSeite(1); }}
                  className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {AKTION_OPTIONEN.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Von</label>
                <Input
                  type="date"
                  value={vonDatum}
                  onChange={(e) => { setVonDatum(e.target.value); setSeite(1); }}
                  className="h-9 w-[160px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Bis</label>
                <Input
                  type="date"
                  value={bisDatum}
                  onChange={(e) => { setBisDatum(e.target.value); setSeite(1); }}
                  className="h-9 w-[160px]"
                />
              </div>
              {(aktionFilter || vonDatum || bisDatum) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAktionFilter('');
                    setVonDatum('');
                    setBisDatum('');
                    setSeite(1);
                  }}
                >
                  Filter zuruecksetzen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabelle */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {daten ? `${daten.gesamt} Eintraege` : 'Laden...'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {laden ? (
              <div className="p-8 text-center text-muted-foreground">Laden...</div>
            ) : !daten || daten.eintraege.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Keine Audit-Log-Eintraege gefunden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Zeitpunkt</th>
                      <th className="text-left p-3 font-medium">Aktion</th>
                      <th className="text-left p-3 font-medium">Benutzer</th>
                      <th className="text-left p-3 font-medium">Verein</th>
                      <th className="text-left p-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {daten.eintraege.map((eintrag) => {
                      const config = AKTION_CONFIG[eintrag.aktion] || {
                        label: eintrag.aktion,
                        farbe: 'bg-gray-100 text-gray-800',
                      };
                      return (
                        <tr key={eintrag.id} className="hover:bg-muted/30">
                          <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(eintrag.erstelltAm).toLocaleString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3">
                            <Badge className={config.farbe} variant="secondary">
                              {config.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs">{eintrag.userEmail}</td>
                          <td className="p-3 text-xs">
                            {eintrag.tenantName || (
                              <span className="text-muted-foreground">Plattform</span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground max-w-[300px] truncate">
                            {detailsFormatieren(eintrag.details)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {daten && daten.seiten > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={seite <= 1}
              onClick={() => setSeite((s) => Math.max(1, s - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Seite {seite} von {daten.seiten}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={seite >= daten.seiten}
              onClick={() => setSeite((s) => s + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
