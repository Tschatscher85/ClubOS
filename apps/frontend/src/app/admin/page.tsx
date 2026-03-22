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
  Brain,
  Eye,
  EyeOff,
  Save,
  FileText,
  Activity,
  Server,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
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
import { Select } from '@/components/ui/select';

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
  kiFreigeschaltet: boolean;
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
  const { accessToken, profilLaden } = useAuthStore();
  const [vereine, setVereine] = useState<Verein[]>([]);
  const [statistiken, setStatistiken] = useState<Statistiken | null>(null);
  const [laden, setLaden] = useState(true);
  const [bereit, setBereit] = useState(false);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');

  // Sperr-Dialog
  const [sperrDialog, setSperrDialog] = useState<{ id: string; name: string } | null>(null);
  const [sperrGrund, setSperrGrund] = useState('');

  // Loesch-Dialog
  const [loeschDialog, setLoeschDialog] = useState<{ id: string; name: string } | null>(null);
  const [loeschBestaetigung, setLoeschBestaetigung] = useState('');

  // Plan-Dialog
  const [planDialog, setPlanDialog] = useState<{ id: string; name: string; plan: string } | null>(null);
  const [neuerPlan, setNeuerPlan] = useState('');

  // Plattform KI-Einstellungen
  const [kiAnthropicKey, setKiAnthropicKey] = useState('');
  const [kiOpenaiKey, setKiOpenaiKey] = useState('');
  const [kiStandardProvider, setKiStandardProvider] = useState('anthropic');
  const [kiZeigeAnthropicKey, setKiZeigeAnthropicKey] = useState(false);
  const [kiZeigeOpenaiKey, setKiZeigeOpenaiKey] = useState(false);
  const [kiLadend, setKiLadend] = useState(false);
  const [kiErfolg, setKiErfolg] = useState('');
  const [kiOffen, setKiOffen] = useState(false);

  // Plattform E-Mail-Einstellungen
  const [emailSmtpHost, setEmailSmtpHost] = useState('');
  const [emailSmtpPort, setEmailSmtpPort] = useState('587');
  const [emailSmtpUser, setEmailSmtpUser] = useState('');
  const [emailSmtpPass, setEmailSmtpPass] = useState('');
  const [emailSmtpFrom, setEmailSmtpFrom] = useState('');
  const [emailSmtpFromName, setEmailSmtpFromName] = useState('Vereinbase');
  const [emailImapHost, setEmailImapHost] = useState('');
  const [emailImapPort, setEmailImapPort] = useState('993');
  const [emailImapUser, setEmailImapUser] = useState('');
  const [emailImapPass, setEmailImapPass] = useState('');
  const [emailLadend, setEmailLadend] = useState(false);
  const [emailErfolg, setEmailErfolg] = useState('');
  const [emailFehler, setEmailFehler] = useState('');
  const [emailOffen, setEmailOffen] = useState(false);
  const [testMailAdresse, setTestMailAdresse] = useState('');
  const [testMailErgebnis, setTestMailErgebnis] = useState('');

  // Auth initialisieren (diese Seite liegt ausserhalb des Dashboard-Layouts)
  useEffect(() => {
    if (!accessToken) {
      router.replace('/anmelden');
      return;
    }
    profilLaden().finally(() => setBereit(true));
  }, [accessToken, router, profilLaden]);

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

  const kiEinstellungenLaden = useCallback(async () => {
    try {
      const data = await apiClient.get<{
        anthropicApiKey: string | null;
        openaiApiKey: string | null;
        standardProvider: string;
        hatAnthropicKey: boolean;
        hatOpenaiKey: boolean;
      }>('/admin/ki-einstellungen');
      setKiAnthropicKey(data.anthropicApiKey || '');
      setKiOpenaiKey(data.openaiApiKey || '');
      setKiStandardProvider(data.standardProvider || 'anthropic');
    } catch {
      // Noch keine Konfiguration vorhanden
    }
  }, []);

  const kiEinstellungenSpeichern = async () => {
    setKiLadend(true);
    try {
      await apiClient.put('/admin/ki-einstellungen', {
        anthropicApiKey: kiAnthropicKey,
        openaiApiKey: kiOpenaiKey,
        standardProvider: kiStandardProvider,
      });
      setKiErfolg('KI-Einstellungen gespeichert!');
      setTimeout(() => setKiErfolg(''), 3000);
      kiEinstellungenLaden();
    } catch (err) {
      console.error('KI-Einstellungen speichern fehlgeschlagen:', err);
    } finally {
      setKiLadend(false);
    }
  };

  const emailEinstellungenLaden = useCallback(async () => {
    try {
      const data = await apiClient.get<Record<string, unknown>>('/admin/email-einstellungen');
      setEmailSmtpHost((data.smtpHost as string) || '');
      setEmailSmtpPort(String(data.smtpPort || 587));
      setEmailSmtpUser((data.smtpUser as string) || '');
      setEmailSmtpPass((data.smtpPass as string) || '');
      setEmailSmtpFrom((data.smtpFrom as string) || '');
      setEmailSmtpFromName((data.smtpFromName as string) || 'Vereinbase');
      setEmailImapHost((data.imapHost as string) || '');
      setEmailImapPort(String(data.imapPort || 993));
      setEmailImapUser((data.imapUser as string) || '');
      setEmailImapPass((data.imapPass as string) || '');
    } catch { /* Noch keine Konfiguration */ }
  }, []);

  const emailEinstellungenSpeichern = async () => {
    setEmailLadend(true);
    setEmailFehler('');
    try {
      await apiClient.put('/admin/email-einstellungen', {
        smtpHost: emailSmtpHost, smtpPort: parseInt(emailSmtpPort, 10),
        smtpUser: emailSmtpUser, smtpPass: emailSmtpPass,
        smtpFrom: emailSmtpFrom, smtpFromName: emailSmtpFromName,
        imapHost: emailImapHost, imapPort: parseInt(emailImapPort, 10),
        imapUser: emailImapUser, imapPass: emailImapPass,
      });
      setEmailErfolg('E-Mail-Einstellungen gespeichert!');
      setTimeout(() => setEmailErfolg(''), 3000);
    } catch (err) {
      setEmailFehler(err instanceof Error ? err.message : 'Fehler beim Speichern.');
    } finally {
      setEmailLadend(false);
    }
  };

  const testMailSenden = async () => {
    if (!testMailAdresse) return;
    setTestMailErgebnis('Wird gesendet...');
    try {
      const result = await apiClient.post<{ erfolg: boolean; nachricht?: string; fehler?: string }>('/admin/email-test', {
        empfaenger: testMailAdresse,
      });
      setTestMailErgebnis(result.erfolg ? result.nachricht || 'Gesendet!' : result.fehler || 'Fehler');
    } catch (err) {
      setTestMailErgebnis(err instanceof Error ? err.message : 'Fehler');
    }
  };

  useEffect(() => {
    if (!bereit) return;
    if (benutzer && benutzer.rolle !== 'SUPERADMIN') {
      router.push('/dashboard');
      return;
    }
    if (benutzer) {
      laden_daten();
      kiEinstellungenLaden();
      emailEinstellungenLaden();
    }
  }, [bereit, benutzer, router, laden_daten, kiEinstellungenLaden, emailEinstellungenLaden]);

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

  const vereinLoeschen = async () => {
    if (!loeschDialog || loeschBestaetigung !== loeschDialog.name) return;
    try {
      await apiClient.delete(`/vereine/${loeschDialog.id}`);
      setLoeschDialog(null);
      setLoeschBestaetigung('');
      laden_daten();
    } catch (err) {
      console.error('Loeschen fehlgeschlagen:', err);
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
      console.error('Plan ändern fehlgeschlagen:', err);
    }
  };

  const kiToggle = async (id: string, freigeschaltet: boolean) => {
    try {
      await apiClient.put(`/admin/vereine/${id}/ki`, { freigeschaltet });
      setVereine((prev) =>
        prev.map((v) => (v.id === id ? { ...v, kiFreigeschaltet: freigeschaltet } : v)),
      );
    } catch (err) {
      console.error('KI-Toggle fehlgeschlagen:', err);
    }
  };

  const impersonate = async (id: string) => {
    try {
      const result = await apiClient.post<{
        accessToken: string;
        benutzer: { id: string; email: string; rolle: string };
        tenant: { id: string; name: string; slug: string; logo: string | null; primaryColor: string };
      }>(`/admin/vereine/${id}/impersonate`, {});

      // Aktuellen Admin-Token sichern fuer "Zurueck zum Admin"
      const aktuellerStore = localStorage.getItem('vereinbase-auth');
      if (aktuellerStore) {
        localStorage.setItem('vereinbase-auth-admin-backup', aktuellerStore);
      }

      // Auth-Store mit Vereins-Token ueberschreiben
      const storeData = {
        state: {
          benutzer: {
            id: result.benutzer.id,
            email: result.benutzer.email,
            rolle: result.benutzer.rolle,
            berechtigungen: [],
            vereinsRollen: [],
          },
          tenant: result.tenant,
          accessToken: result.accessToken,
          refreshToken: null,
          istAngemeldet: true,
        },
        version: 0,
      };
      localStorage.setItem('vereinbase-auth', JSON.stringify(storeData));

      // Seite komplett neu laden damit Store frisch geladen wird
      window.location.href = '/dashboard';
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

  if (!bereit || !benutzer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (benutzer.rolle !== 'SUPERADMIN') {
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
              <h1 className="text-xl font-bold">Vereinbase Admin</h1>
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

        {/* Vertraege & NDAs */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => router.push('/admin/vertraege')}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 p-2">
                  <FileText className="h-5 w-5 text-indigo-700" />
                </div>
                <div>
                  <p className="font-medium">Vertraege & NDAs</p>
                  <p className="text-xs text-muted-foreground">
                    Vertraege erstellen, versenden und Unterschriften verwalten
                  </p>
                </div>
              </div>
              <Badge variant="outline">Öffnen</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Audit-Log */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => router.push('/admin/audit-log')}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <Activity className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium">Audit-Log</p>
                  <p className="text-xs text-muted-foreground">
                    Alle Admin-Aktionen protokolliert
                  </p>
                </div>
              </div>
              <Badge variant="outline">Öffnen</Badge>
            </div>
          </CardContent>
        </Card>

        {/* System-Status */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => router.push('/admin/system-status')}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Server className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="font-medium">System-Status</p>
                  <p className="text-xs text-muted-foreground">
                    Server, Datenbank, Queues überwachen
                  </p>
                </div>
              </div>
              <Badge variant="outline">Öffnen</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Plattform KI-Einstellungen */}
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setKiOffen(!kiOffen)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-purple-600" />
                Plattform KI-Einstellungen
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {kiAnthropicKey && !kiAnthropicKey.startsWith('****') ? '' : kiAnthropicKey ? 'Anthropic ✓' : ''}
                {kiAnthropicKey && kiOpenaiKey ? ' + ' : ''}
                {kiOpenaiKey && !kiOpenaiKey.startsWith('****') ? '' : kiOpenaiKey ? 'OpenAI ✓' : ''}
                {!kiAnthropicKey && !kiOpenaiKey ? 'Nicht konfiguriert' : ''}
              </Badge>
            </div>
          </CardHeader>
          {kiOffen && (
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ihre API-Keys werden für alle Vereine genutzt, bei denen Sie KI freigeschaltet haben.
                Vereine können optional einen eigenen Key hinterlegen (überschreibt Ihren Key).
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Anthropic API Key (Claude)</Label>
                  <div className="relative">
                    <Input
                      type={kiZeigeAnthropicKey ? 'text' : 'password'}
                      value={kiAnthropicKey}
                      onChange={(e) => setKiAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setKiZeigeAnthropicKey(!kiZeigeAnthropicKey)}
                    >
                      {kiZeigeAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">OpenAI API Key (GPT)</Label>
                  <div className="relative">
                    <Input
                      type={kiZeigeOpenaiKey ? 'text' : 'password'}
                      value={kiOpenaiKey}
                      onChange={(e) => setKiOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setKiZeigeOpenaiKey(!kiZeigeOpenaiKey)}
                    >
                      {kiZeigeOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Standard-Provider</Label>
                <select
                  value={kiStandardProvider}
                  onChange={(e) => setKiStandardProvider(e.target.value)}
                  className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="anthropic">Anthropic (Claude) - empfohlen</option>
                  <option value="openai">OpenAI (GPT)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Wird verwendet wenn der Verein keinen eigenen Provider gewählt hat.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={kiEinstellungenSpeichern} disabled={kiLadend} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {kiLadend ? 'Speichern...' : 'Speichern'}
                </Button>
                {kiErfolg && <span className="text-sm text-green-600">{kiErfolg}</span>}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Plattform E-Mail-Einstellungen */}
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setEmailOffen(!emailOffen)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                E-Mail-Einstellungen (SMTP / IMAP)
              </CardTitle>
              <Badge variant={emailSmtpHost ? 'default' : 'destructive'}>
                {emailSmtpHost ? 'Konfiguriert' : 'Nicht eingerichtet'}
              </Badge>
            </div>
          </CardHeader>
          {emailOffen && (
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Globale E-Mail-Einstellungen fuer die Plattform. Einladungen, Passwort-Reset und Erinnerungen werden hierueber versendet.
              </p>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">SMTP (Ausgehende Mails)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">SMTP-Server</Label>
                    <Input value={emailSmtpHost} onChange={(e) => setEmailSmtpHost(e.target.value)}
                      placeholder="smtp.dein-provider.de" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Port</Label>
                    <Input value={emailSmtpPort} onChange={(e) => setEmailSmtpPort(e.target.value)}
                      placeholder="587" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Benutzername</Label>
                    <Input value={emailSmtpUser} onChange={(e) => setEmailSmtpUser(e.target.value)}
                      placeholder="info@vereinbase.de" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Passwort</Label>
                    <Input type="password" value={emailSmtpPass} onChange={(e) => setEmailSmtpPass(e.target.value)}
                      placeholder="****" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Absender-E-Mail</Label>
                    <Input value={emailSmtpFrom} onChange={(e) => setEmailSmtpFrom(e.target.value)}
                      placeholder="info@vereinbase.de" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Absender-Name</Label>
                    <Input value={emailSmtpFromName} onChange={(e) => setEmailSmtpFromName(e.target.value)}
                      placeholder="Vereinbase" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">IMAP (Eingehende Mails)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">IMAP-Server</Label>
                    <Input value={emailImapHost} onChange={(e) => setEmailImapHost(e.target.value)}
                      placeholder="imap.dein-provider.de" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Port</Label>
                    <Input value={emailImapPort} onChange={(e) => setEmailImapPort(e.target.value)}
                      placeholder="993" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Benutzername</Label>
                    <Input value={emailImapUser} onChange={(e) => setEmailImapUser(e.target.value)}
                      placeholder="info@vereinbase.de" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Passwort</Label>
                    <Input type="password" value={emailImapPass} onChange={(e) => setEmailImapPass(e.target.value)}
                      placeholder="****" />
                  </div>
                </div>
              </div>

              {emailFehler && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{emailFehler}</div>
              )}
              {emailErfolg && (
                <div className="rounded-md bg-green-100 p-3 text-sm text-green-700">{emailErfolg}</div>
              )}

              <div className="flex items-center gap-3">
                <Button onClick={emailEinstellungenSpeichern} disabled={emailLadend}>
                  <Save className="h-4 w-4 mr-2" />
                  {emailLadend ? 'Speichern...' : 'Speichern'}
                </Button>

                <div className="flex items-center gap-2 ml-auto">
                  <Input value={testMailAdresse} onChange={(e) => setTestMailAdresse(e.target.value)}
                    placeholder="test@beispiel.de" className="w-48" />
                  <Button variant="outline" onClick={testMailSenden} disabled={!testMailAdresse}>
                    Test-Mail senden
                  </Button>
                </div>
              </div>
              {testMailErgebnis && (
                <p className="text-sm text-muted-foreground">{testMailErgebnis}</p>
              )}
            </CardContent>
          )}
        </Card>

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
                      <th className="text-center p-3 font-medium">KI</th>
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
                          <td className="p-3 text-center">
                            <button
                              onClick={() => kiToggle(verein.id, !verein.kiFreigeschaltet)}
                              title={verein.kiFreigeschaltet ? 'KI deaktivieren' : 'KI freischalten'}
                            >
                              <Badge
                                variant={verein.kiFreigeschaltet ? 'default' : 'outline'}
                                className={`cursor-pointer text-xs ${verein.kiFreigeschaltet ? 'bg-purple-600 hover:bg-purple-700' : 'text-muted-foreground hover:bg-muted'}`}
                              >
                                {verein.kiFreigeschaltet ? 'KI aktiv' : 'KI aus'}
                              </Badge>
                            </button>
                          </td>
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
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                title="Verein loeschen"
                                onClick={() => setLoeschDialog({ id: verein.id, name: verein.name })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

      {/* Loesch-Dialog */}
      <Dialog open={!!loeschDialog} onOpenChange={() => { setLoeschDialog(null); setLoeschBestaetigung(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verein endgueltig loeschen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-destructive font-medium">
              Achtung: Diese Aktion kann nicht rueckgaengig gemacht werden! Alle Daten des Vereins
              (Mitglieder, Teams, Events, Formulare, etc.) werden unwiderruflich geloescht.
            </p>
            <div>
              <Label>
                Geben Sie <span className="font-bold">{loeschDialog?.name}</span> ein, um zu bestaetigen:
              </Label>
              <Input
                value={loeschBestaetigung}
                onChange={(e) => setLoeschBestaetigung(e.target.value)}
                placeholder={loeschDialog?.name}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLoeschDialog(null); setLoeschBestaetigung(''); }}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={vereinLoeschen}
              disabled={loeschBestaetigung !== loeschDialog?.name}
            >
              Endgueltig loeschen
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
