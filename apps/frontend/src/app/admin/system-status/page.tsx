'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Server,
  Database,
  HardDrive,
  Users,
  Building2,
  Calendar,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SystemStatusDaten {
  postgresql: {
    status: string;
    groesse?: number;
    groesseFormatiert?: string;
    fehler?: string;
  };
  redis: {
    status: string;
  };
  queues: Array<{
    name: string;
    waiting?: number;
    active?: number;
    completed?: number;
    failed?: number;
    delayed?: number;
    status?: string;
  }>;
  server: {
    uptime: number;
    uptimeFormatiert: string;
    speicher: {
      rss: string;
      heapUsed: string;
      heapTotal: string;
      rssBytes: number;
      heapUsedBytes: number;
      heapTotalBytes: number;
    };
    nodeVersion: string;
  };
  statistiken: {
    tenants: number;
    users: number;
    events: number;
    members: number;
  };
}

function StatusPunkt({ status }: { status: string }) {
  const istOk = status === 'ok';
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${
        istOk ? 'bg-green-500' : 'bg-red-500'
      }`}
      title={istOk ? 'OK' : 'Fehler'}
    />
  );
}

export default function SystemStatusSeite() {
  const router = useRouter();
  const benutzer = useBenutzer();
  const { accessToken, profilLaden } = useAuthStore();
  const [bereit, setBereit] = useState(false);
  const [laden, setLaden] = useState(true);
  const [daten, setDaten] = useState<SystemStatusDaten | null>(null);
  const [letzteAktualisierung, setLetzteAktualisierung] = useState<Date | null>(null);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/anmelden');
      return;
    }
    profilLaden().finally(() => setBereit(true));
  }, [accessToken, router, profilLaden]);

  const datenLaden = useCallback(async () => {
    try {
      const ergebnis = await apiClient.get<SystemStatusDaten>('/admin/system-status');
      setDaten(ergebnis);
      setLetzteAktualisierung(new Date());
    } catch (err) {
      console.error('System-Status laden fehlgeschlagen:', err);
    } finally {
      setLaden(false);
    }
  }, []);

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

  // Auto-Refresh alle 30 Sekunden
  useEffect(() => {
    if (!bereit || !benutzer || benutzer.rolle !== 'SUPERADMIN') return;
    const interval = setInterval(datenLaden, 30000);
    return () => clearInterval(interval);
  }, [bereit, benutzer, datenLaden]);

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
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-600" />
              <div>
                <h1 className="text-xl font-bold">System-Status</h1>
                <p className="text-sm text-muted-foreground">
                  Server, Datenbank, Queues ueberwachen
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {letzteAktualisierung && (
              <span className="text-xs text-muted-foreground">
                Aktualisiert: {letzteAktualisierung.toLocaleTimeString('de-DE')}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={datenLaden}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Aktualisieren
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {laden ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Status wird geladen...</div>
          </div>
        ) : daten ? (
          <>
            {/* Dienste */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* PostgreSQL */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    PostgreSQL
                    <StatusPunkt status={daten.postgresql.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {daten.postgresql.status === 'ok' ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Verbunden</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">DB-Groesse</span>
                        <span className="font-medium">{daten.postgresql.groesseFormatiert}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      Fehler: {daten.postgresql.fehler || 'Verbindung fehlgeschlagen'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Redis */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-red-600" />
                    Redis
                    <StatusPunkt status={daten.redis.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant="secondary"
                      className={
                        daten.redis.status === 'ok'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {daten.redis.status === 'ok' ? 'Verbunden' : 'Nicht erreichbar'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Server */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4 text-green-600" />
                    Server
                    <StatusPunkt status="ok" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="font-medium">{daten.server.uptimeFormatiert}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Speicher (RSS)</span>
                      <span className="font-medium">{daten.server.speicher.rss}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Heap</span>
                      <span className="font-medium">
                        {daten.server.speicher.heapUsed} / {daten.server.speicher.heapTotal}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Node.js</span>
                      <span className="font-medium">{daten.server.nodeVersion}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* BullMQ Queues */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-orange-600" />
                  BullMQ Queues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {daten.queues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Queue-Daten verfuegbar</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-2 font-medium">Queue</th>
                          <th className="text-center p-2 font-medium">Wartend</th>
                          <th className="text-center p-2 font-medium">Aktiv</th>
                          <th className="text-center p-2 font-medium">Abgeschlossen</th>
                          <th className="text-center p-2 font-medium">Fehlgeschlagen</th>
                          <th className="text-center p-2 font-medium">Verzoegert</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {daten.queues.map((q) => (
                          <tr key={q.name} className="hover:bg-muted/30">
                            <td className="p-2 font-medium capitalize">{q.name}</td>
                            {q.status === 'fehler' ? (
                              <td colSpan={5} className="p-2 text-center text-red-600 text-xs">
                                Nicht erreichbar
                              </td>
                            ) : (
                              <>
                                <td className="p-2 text-center">
                                  {q.waiting ?? 0}
                                </td>
                                <td className="p-2 text-center">
                                  {q.active ?? 0}
                                </td>
                                <td className="p-2 text-center text-green-600">
                                  {q.completed ?? 0}
                                </td>
                                <td className="p-2 text-center">
                                  {(q.failed ?? 0) > 0 ? (
                                    <span className="text-red-600 font-medium">{q.failed}</span>
                                  ) : (
                                    '0'
                                  )}
                                </td>
                                <td className="p-2 text-center">{q.delayed ?? 0}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistiken */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Plattform-Statistiken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Building2 className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{daten.statistiken.tenants}</p>
                      <p className="text-xs text-muted-foreground">Vereine</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <Users className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{daten.statistiken.users}</p>
                      <p className="text-xs text-muted-foreground">Benutzer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <UserCheck className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{daten.statistiken.members}</p>
                      <p className="text-xs text-muted-foreground">Mitglieder</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-orange-100 p-2">
                      <Calendar className="h-5 w-5 text-orange-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{daten.statistiken.events}</p>
                      <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
              Automatische Aktualisierung alle 30 Sekunden
            </p>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            System-Status konnte nicht geladen werden.
          </div>
        )}
      </main>
    </div>
  );
}
