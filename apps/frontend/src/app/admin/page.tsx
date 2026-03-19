'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Shield,
  Calendar,
  Ban,
  CheckCircle,
  LogIn,
  Download,
  AlertTriangle,
  Clock,
  BarChart3,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { API_BASE_URL } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Verein {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  istAktiv: boolean;
  gesperrtAm: string | null;
  gesperrtGrund: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  email: string | null;
  ort: string | null;
  mitgliederAnzahl: number;
  benutzerAnzahl: number;
  teamsAnzahl: number;
  eventsAnzahl: number;
  status: 'aktiv' | 'trial' | 'gesperrt' | 'ueberfaellig';
}

interface Statistiken {
  vereineGesamt: number;
  vereineAktiv: number;
  vereineGesperrt: number;
  mitgliederGesamt: number;
  benutzerGesamt: number;
  teamsGesamt: number;
  eventsGesamt: number;
  planVerteilung: { plan: string; anzahl: number }[];
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter (29€)',
  PRO: 'Pro (79€)',
  CLUB: 'Club (149€)',
  ENTERPRISE: 'Enterprise',
  SELF_HOSTED: 'Self-Hosted',
};

const STATUS_CONFIG: Record<string, { label: string; farbe: string; icon: typeof CheckCircle }> = {
  aktiv: { label: 'Aktiv', farbe: 'bg-green-100 text-green-800', icon: CheckCircle },
  trial: { label: 'Trial', farbe: 'bg-yellow-100 text-yellow-800', icon: Clock },
  gesperrt: { label: 'Gesperrt', farbe: 'bg-red-100 text-red-800', icon: Ban },
  ueberfaellig: { label: 'Überfällig', farbe: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
};

export default function AdminDashboard() {
  const router = useRouter();
  const benutzer = useBenutzer();
  const [vereine, setVereine] = useState<Verein[]>([]);
  const [statistiken, setStatistiken] = useState<Statistiken | null>(null);
  const [laden, setLaden] = useState(true);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');

  // Sperr-Dialog
  const [sperrDialog, setSperrDialog] = useState<{ id: string; name: string } | null>(null);
  const [sperrGrund, setSperrGrund] = useState('');

  // Plan-Dialog
  const [planDialog, setPlanDialog] = useState<{ id: string; name: string; plan: string } | null>(null);
  const [neuerPlan, setNeuerPlan] = useState('');

  const laden_daten = useCallback(async () => {
    try {
      const [v, s] = await Promise.all([
        apiClient.get<Verein[]>('/admin/vereine'),
        apiClient.get<Statistiken>('/admin/statistiken'),
      ]);
      setVereine(v);
      setStatistiken(s);
    } catch (err) {
      console.error('Admin-Daten laden fehlgeschlagen:', err);
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    if (benutzer && benutzer.rolle !== 'SUPERADMIN') {
      router.push('/dashboard');
      return;
    }
    laden_daten();
  }, [benutzer, router, laden_daten]);

  const vereinSperren = async () => {
    if (!sperrDialog) return;
    try {
      await apiClient.put(`/admin/vereine/${sperrDialog.id}/sperren`, { grund: sperrGrund });
      setSperrDialog(null);
      setSperrGrund('');
      laden_daten();
    } catch (err) {
      console.error('Sperren fehlgeschlagen:', err);
    }
  };

  const vereinEntsperren = async (id: string) => {
    try {
      await apiClient.put(`/admin/vereine/${id}/entsperren`, {});
      laden_daten();
    } catch (err) {
      console.error('Entsperren fehlgeschlagen:', err);
    }
  };

  const planAendern = async () => {
    if (!planDialog || !neuerPlan) return;
    try {
      await apiClient.put(`/admin/vereine/${planDialog.id}/plan`, { plan: neuerPlan });
      setPlanDialog(null);
      setNeuerPlan('');
      laden_daten();
    } catch (err) {
      console.error('Plan aendern fehlgeschlagen:', err);
    }
  };

  const impersonate = async (id: string) => {
    try {
      const result = await apiClient.post<{
        accessToken: string;
        benutzer: { id: string; email: string; rolle: string };
        tenant: { id: string; name: string; slug: string; logo: string | null; primaryColor: string };
      }>(`/admin/vereine/${id}/impersonate`, {});

      // Token + Tenant im localStorage speichern und Seite neu laden
      localStorage.setItem('impersonation_token', result.accessToken);
      localStorage.setItem('impersonation_tenant', JSON.stringify(result.tenant));
      localStorage.setItem('impersonation_user', JSON.stringify(result.benutzer));

      // Neues Fenster oeffnen mit Impersonation
      window.open(`/dashboard?impersonate=${result.accessToken}`, '_blank');
    } catch (err) {
      console.error('Impersonation fehlgeschlagen:', err);
    }
  };

  const vereinExport = async (id: string, name: string) => {
    try {
      const daten = await apiClient.get<Record<string, unknown>>(`/admin/vereine/${id}/export`);
      const blob = new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.toLowerCase().replace(/\s+/g, '-')}_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export fehlgeschlagen:', err);
    }
  };

  // Filtern
  const gefilterteVereine = vereine.filter((v) => {
    const sucheTrifft =
      !suchbegriff ||
      v.name.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      v.slug.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      (v.ort && v.ort.toLowerCase().includes(suchbegriff.toLowerCase()));

    const statusTrifft = statusFilter === 'alle' || v.status === statusFilter;

    return sucheTrifft && statusTrifft;
  });

  if (benutzer && benutzer.rolle !== 'SUPERADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">ClubOS Admin</h1>
              <p className="text-sm text-muted-foreground">Plattform-Verwaltung</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {benutzer?.email}
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistik-Karten */}
        {statistiken && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Building2 className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{statistiken.vereineGesamt}</p>
                    <p className="text-xs text-muted-foreground">Vereine</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Users className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{statistiken.mitgliederGesamt}</p>
                    <p className="text-xs text-muted-foreground">Mitglieder</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Shield className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{statistiken.teamsGesamt}</p>
                    <p className="text-xs text-muted-foreground">Teams</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Calendar className="h-5 w-5 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{statistiken.eventsGesamt}</p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plan-Verteilung */}
        {statistiken && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Plan-Verteilung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {statistiken.planVerteilung.map((p) => (
                  <div key={p.plan} className="flex items-center gap-2">
                    <Badge variant="secondary">{PLAN_LABELS[p.plan] || p.plan}</Badge>
                    <span className="text-sm font-medium">{p.anzahl}x</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Verein suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {['alle', 'aktiv', 'trial', 'ueberfaellig', 'gesperrt'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'alle' ? 'Alle' : s === 'ueberfaellig' ? 'Überfällig' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Vereine-Tabelle */}
        <Card>
          <CardContent className="p-0">
            {laden ? (
              <div className="p-8 text-center text-muted-foreground">Laden...</div>
            ) : gefilterteVereine.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Keine Vereine gefunden.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Verein</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Plan</th>
                      <th className="text-center p-3 font-medium">Mitglieder</th>
                      <th className="text-center p-3 font-medium">Teams</th>
                      <th className="text-left p-3 font-medium">Registriert</th>
                      <th className="text-right p-3 font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {gefilterteVereine.map((verein) => {
                      const statusInfo = STATUS_CONFIG[verein.status] || STATUS_CONFIG.aktiv;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={verein.id} className="hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {verein.logo && (
                                  <AvatarImage src={`${API_BASE_URL}${verein.logo}`} alt={verein.name} />
                                )}
                                <AvatarFallback className="text-xs">
                                  {verein.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{verein.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {verein.slug}{verein.ort ? ` · ${verein.ort}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={`${statusInfo.farbe} gap-1`} variant="secondary">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            {verein.gesperrtGrund && (
                              <p className="text-xs text-red-600 mt-1">{verein.gesperrtGrund}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setPlanDialog({ id: verein.id, name: verein.name, plan: verein.plan });
                                setNeuerPlan(verein.plan);
                              }}
                              className="text-sm hover:underline"
                            >
                              {PLAN_LABELS[verein.plan] || verein.plan}
                            </button>
                          </td>
                          <td className="p-3 text-center">{verein.mitgliederAnzahl}</td>
                          <td className="p-3 text-center">{verein.teamsAnzahl}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {new Date(verein.createdAt).toLocaleDateString('de-DE')}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Als Verein einloggen"
                                onClick={() => impersonate(verein.id)}
                              >
                                <LogIn className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Daten exportieren"
                                onClick={() => vereinExport(verein.id, verein.name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {verein.istAktiv ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  title="Verein sperren"
                                  onClick={() => setSperrDialog({ id: verein.id, name: verein.name })}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  title="Verein entsperren"
                                  onClick={() => vereinEntsperren(verein.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
      </main>

      {/* Sperr-Dialog */}
      <Dialog open={!!sperrDialog} onOpenChange={() => setSperrDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verein sperren: {sperrDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Grund der Sperrung</Label>
              <Input
                value={sperrGrund}
                onChange={(e) => setSperrGrund(e.target.value)}
                placeholder="z.B. Zahlung ausstehend, Missbrauch, ..."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Der Verein kann sich weiterhin einloggen, sieht aber nur eine Sperrseite.
              Billing-Routen bleiben erreichbar.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSperrDialog(null)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={vereinSperren}>
              Sperren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan-Dialog */}
      <Dialog open={!!planDialog} onOpenChange={() => setPlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan ändern: {planDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Neuer Plan</Label>
              <select
                value={neuerPlan}
                onChange={(e) => setNeuerPlan(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="STARTER">Starter (29€/Monat)</option>
                <option value="PRO">Pro (79€/Monat)</option>
                <option value="CLUB">Club (149€/Monat)</option>
                <option value="ENTERPRISE">Enterprise</option>
                <option value="SELF_HOSTED">Self-Hosted</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(null)}>
              Abbrechen
            </Button>
            <Button onClick={planAendern}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
