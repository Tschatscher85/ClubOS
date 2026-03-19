'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Palette, Save, Upload, ImageIcon, Lock, Brain, Eye, EyeOff, Mail, Trash2, Send, Building2, Trophy, CreditCard, Shield, Users, Gift, Layout, Calendar, MapPin, Plus, ChevronDown, ChevronRight, Pencil, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { AdressSuche } from '@/components/kalender/adress-suche';
import { altersklassenLaden, altersklassenSpeichern, altersklassenFallback } from '@/lib/altersklassen';
import { veranstaltungstypenLaden, veranstaltungstypenSpeichern, veranstaltungstypenFallback } from '@/lib/veranstaltungstypen';
import { sportartenCacheLeeren } from '@/lib/sportarten';
import type { VeranstaltungsTyp } from '@/lib/veranstaltungstypen';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { applyTenantTheme } from '@/lib/theme';
import { API_BASE_URL } from '@/lib/constants';
import {
  getEventFarben,
  setEventFarben,
  STANDARD_FARBEN,
  EVENT_TYP_LABEL,
} from '@/lib/event-farben';
import type { EventFarben } from '@/lib/event-farben';

// ==================== Konstanten ====================

const FARBEN = [
  { name: 'Blau', wert: '#1a56db' },
  { name: 'Rot', wert: '#dc2626' },
  { name: 'Grün', wert: '#16a34a' },
  { name: 'Lila', wert: '#7c3aed' },
  { name: 'Orange', wert: '#ea580c' },
  { name: 'Pink', wert: '#db2777' },
  { name: 'Türkis', wert: '#0891b2' },
  { name: 'Schwarz', wert: '#171717' },
];

const PLAN_LABEL: Record<string, string> = {
  STARTER: 'Starter (29 EUR/Monat)',
  PRO: 'Pro (79 EUR/Monat)',
  CLUB: 'Club (149 EUR/Monat)',
  ENTERPRISE: 'Enterprise',
  SELF_HOSTED: 'Self-Hosted',
};

// ==================== Abschnitts-Trenner ====================

function Abschnitt({ titel, beschreibung, kinder }: { titel: string; beschreibung: string; kinder: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-3">
        <h2 className="text-lg font-semibold">{titel}</h2>
        <p className="text-sm text-muted-foreground mt-1">{beschreibung}</p>
      </div>
      {kinder}
    </div>
  );
}

// ==================== Einklappbare Karte ====================

function KlappCard({ id, titel, icon: Icon, beschreibung, kinder }: {
  id: string;
  titel: string;
  icon: React.ElementType;
  beschreibung: string;
  kinder: React.ReactNode;
}) {
  const storageKey = `einstellungen_offen_${id}`;
  const [offen, setOffen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const gespeichert = localStorage.getItem(storageKey);
    return gespeichert === null ? true : gespeichert === '1';
  });

  const toggle = () => {
    const neu = !offen;
    setOffen(neu);
    localStorage.setItem(storageKey, neu ? '1' : '0');
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer select-none" onClick={toggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle>{titel}</CardTitle>
          </div>
          {offen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
        </div>
        <CardDescription>{beschreibung}</CardDescription>
      </CardHeader>
      {offen && <CardContent className="space-y-4">{kinder}</CardContent>}
    </Card>
  );
}

// ==================== Hauptseite ====================

export default function EinstellungenPage() {
  const { benutzer, tenant, profilLaden } = useAuth();
  const [name, setName] = useState(tenant?.name || '');
  const [farbe, setFarbe] = useState(tenant?.primaryColor || '#1a56db');
  const [customFarbe, setCustomFarbe] = useState('');
  const [ladend, setLadend] = useState(false);
  const [logoLadend, setLogoLadend] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [fehler, setFehler] = useState('');
  const [aktiveTab, setAktiveTab] = useState<'verein' | 'sportbetrieb' | 'konto' | 'verwaltung'>('verein');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // KI-Einstellungen
  const [kiProvider, setKiProvider] = useState('');
  const [kiApiKey, setKiApiKey] = useState('');
  const [kiModell, setKiModell] = useState('');
  const [kiAnzeigen, setKiAnzeigen] = useState(false);
  const [kiLadend, setKiLadend] = useState(false);
  const [kiErfolg, setKiErfolg] = useState('');
  const [kiFehler, setKiFehler] = useState('');
  const [kiGeladen, setKiGeladen] = useState(false);

  // E-Mail-Einstellungen
  const [emailSmtpHost, setEmailSmtpHost] = useState('');
  const [emailSmtpPort, setEmailSmtpPort] = useState('587');
  const [emailSmtpUser, setEmailSmtpUser] = useState('');
  const [emailSmtpPass, setEmailSmtpPass] = useState('');
  const [emailSmtpPassAnzeigen, setEmailSmtpPassAnzeigen] = useState(false);
  const [emailAbsenderEmail, setEmailAbsenderEmail] = useState('');
  const [emailAbsenderName, setEmailAbsenderName] = useState('');
  const [emailSignatur, setEmailSignatur] = useState('');
  const [emailIstAktiv, setEmailIstAktiv] = useState(false);
  const [emailLadend, setEmailLadend] = useState(false);
  const [emailLoeschend, setEmailLoeschend] = useState(false);
  const [emailTestLadend, setEmailTestLadend] = useState(false);
  const [emailErfolg, setEmailErfolg] = useState('');
  const [emailFehler, setEmailFehler] = useState('');
  const [emailGeladen, setEmailGeladen] = useState(false);

  // Passwort ändern
  const [altesPasswort, setAltesPasswort] = useState('');
  const [neuesPasswort, setNeuesPasswort] = useState('');
  const [passwortBestaetigung, setPasswortBestaetigung] = useState('');
  const [pwLadend, setPwLadend] = useState(false);
  const [pwErfolg, setPwErfolg] = useState('');
  const [pwFehler, setPwFehler] = useState('');

  // Kalender-Farben
  const [eventFarben, setEventFarbenState] = useState<EventFarben>(STANDARD_FARBEN);
  const [eventFarbenGespeichert, setEventFarbenGespeichert] = useState(false);

  useEffect(() => {
    setEventFarbenState(getEventFarben());
  }, []);

  const handleEventFarbeAendern = (typ: keyof EventFarben, farbe: string) => {
    const neu = { ...eventFarben, [typ]: farbe };
    setEventFarbenState(neu);
  };

  const handleEventFarbenSpeichern = () => {
    setEventFarben(eventFarben);
    setEventFarbenGespeichert(true);
    setTimeout(() => setEventFarbenGespeichert(false), 3000);
  };

  const handleEventFarbenZuruecksetzen = () => {
    setEventFarbenState(STANDARD_FARBEN);
    setEventFarben(STANDARD_FARBEN);
  };

  const handlePasswortAendern = async () => {
    setPwFehler('');
    setPwErfolg('');

    if (neuesPasswort.length < 8) {
      setPwFehler('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (neuesPasswort !== passwortBestaetigung) {
      setPwFehler('Die Passwörter stimmen nicht überein.');
      return;
    }

    setPwLadend(true);

    try {
      await apiClient.put('/auth/passwort', {
        altesPasswort,
        neuesPasswort,
      });
      setPwErfolg('Passwort wurde erfolgreich geändert.');
      setAltesPasswort('');
      setNeuesPasswort('');
      setPasswortBestaetigung('');
      setTimeout(() => setPwErfolg(''), 5000);
    } catch (error) {
      setPwFehler(
        error instanceof Error ? error.message : 'Fehler beim Ändern des Passworts.',
      );
    } finally {
      setPwLadend(false);
    }
  };

  const handleKiLaden = async () => {
    if (kiGeladen) return;
    try {
      const daten = await apiClient.get<{
        kiProvider: string;
        kiApiKey: string | null;
        kiModell: string | null;
      }>('/vereine/ki-einstellungen');
      setKiProvider(daten.kiProvider || 'anthropic');
      setKiApiKey(daten.kiApiKey || '');
      setKiModell(daten.kiModell || '');
      setKiGeladen(true);
    } catch {
      // Endpoint existiert ggf. noch nicht
    }
  };

  const handleKiSpeichern = async () => {
    setKiLadend(true);
    setKiFehler('');
    setKiErfolg('');
    try {
      await apiClient.put('/vereine/ki-einstellungen', {
        kiProvider,
        kiApiKey: kiApiKey || undefined,
        kiModell: kiModell || undefined,
      });
      setKiErfolg('KI-Einstellungen gespeichert.');
      setTimeout(() => setKiErfolg(''), 5000);
    } catch (error) {
      setKiFehler(
        error instanceof Error ? error.message : 'Fehler beim Speichern.',
      );
    } finally {
      setKiLadend(false);
    }
  };

  // E-Mail-Einstellungen laden
  const istAdminOderTrainer =
    benutzer?.rolle === 'ADMIN' ||
    benutzer?.rolle === 'SUPERADMIN' ||
    benutzer?.rolle === 'TRAINER';

  useEffect(() => {
    if (!istAdminOderTrainer || emailGeladen) return;
    const emailEinstellungenLaden = async () => {
      try {
        const daten = await apiClient.get<{
          smtpHost: string;
          smtpPort: number;
          smtpUser: string;
          smtpPass: string;
          absenderEmail: string;
          absenderName: string;
          signatur: string;
          istAktiv: boolean;
        }>('/email-einstellungen');
        setEmailSmtpHost(daten.smtpHost || '');
        setEmailSmtpPort(String(daten.smtpPort || 587));
        setEmailSmtpUser(daten.smtpUser || '');
        setEmailSmtpPass(daten.smtpPass || '');
        setEmailAbsenderEmail(daten.absenderEmail || '');
        setEmailAbsenderName(daten.absenderName || '');
        setEmailSignatur(daten.signatur || '');
        setEmailIstAktiv(daten.istAktiv ?? false);
        setEmailGeladen(true);
      } catch {
        setEmailGeladen(true);
      }
    };
    emailEinstellungenLaden();
  }, [istAdminOderTrainer, emailGeladen]);

  const handleEmailSpeichern = async () => {
    setEmailLadend(true);
    setEmailFehler('');
    setEmailErfolg('');
    try {
      await apiClient.put('/email-einstellungen', {
        smtpHost: emailSmtpHost,
        smtpPort: Number(emailSmtpPort),
        smtpUser: emailSmtpUser,
        smtpPass: emailSmtpPass || undefined,
        absenderEmail: emailAbsenderEmail,
        absenderName: emailAbsenderName,
        signatur: emailSignatur,
        istAktiv: emailIstAktiv,
      });
      setEmailErfolg('E-Mail-Einstellungen gespeichert.');
      setTimeout(() => setEmailErfolg(''), 5000);
    } catch (error) {
      setEmailFehler(
        error instanceof Error ? error.message : 'Fehler beim Speichern der E-Mail-Einstellungen.',
      );
    } finally {
      setEmailLadend(false);
    }
  };

  const handleEmailLoeschen = async () => {
    if (!confirm('E-Mail-Einstellungen wirklich löschen?')) return;
    setEmailLoeschend(true);
    setEmailFehler('');
    setEmailErfolg('');
    try {
      await apiClient.delete('/email-einstellungen');
      setEmailSmtpHost('');
      setEmailSmtpPort('587');
      setEmailSmtpUser('');
      setEmailSmtpPass('');
      setEmailAbsenderEmail('');
      setEmailAbsenderName('');
      setEmailSignatur('');
      setEmailIstAktiv(false);
      setEmailErfolg('E-Mail-Einstellungen gelöscht.');
      setTimeout(() => setEmailErfolg(''), 5000);
    } catch (error) {
      setEmailFehler(
        error instanceof Error ? error.message : 'Fehler beim Löschen.',
      );
    } finally {
      setEmailLoeschend(false);
    }
  };

  const handleEmailTesten = async () => {
    setEmailTestLadend(true);
    setEmailFehler('');
    setEmailErfolg('');
    try {
      await apiClient.post('/email-einstellungen/testen', {});
      setEmailErfolg('Test-E-Mail wurde gesendet. Bitte prüfen Sie Ihr Postfach.');
      setTimeout(() => setEmailErfolg(''), 5000);
    } catch (error) {
      setEmailFehler(
        error instanceof Error ? error.message : 'Test-E-Mail konnte nicht gesendet werden.',
      );
    } finally {
      setEmailTestLadend(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei || !tenant) return;

    setLogoLadend(true);
    setFehler('');

    try {
      const formData = new FormData();
      formData.append('logo', datei);

      const res = await fetch(`${API_BASE_URL}/vereine/${tenant.id}/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.nachricht || 'Upload fehlgeschlagen.');
      }

      await profilLaden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Logo-Upload fehlgeschlagen.');
    } finally {
      setLogoLadend(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleFarbeWaehlen = (neueFarbe: string) => {
    setFarbe(neueFarbe);
    applyTenantTheme(neueFarbe);
  };

  const handleSpeichern = async () => {
    setLadend(true);
    setFehler('');
    setGespeichert(false);

    try {
      await apiClient.put(`/vereine/${tenant?.id}`, {
        name,
        primaryColor: farbe,
      });
      applyTenantTheme(farbe);
      await profilLaden();
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 3000);
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    } finally {
      setLadend(false);
    }
  };

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  const TABS = [
    { id: 'verein' as const, label: 'Vereinsprofil', icon: Building2, nurAdmin: false },
    { id: 'sportbetrieb' as const, label: 'Sportbetrieb', icon: Trophy, nurAdmin: true },
    { id: 'konto' as const, label: 'Mein Konto', icon: Lock, nurAdmin: false },
    { id: 'verwaltung' as const, label: 'Verwaltung', icon: Settings, nurAdmin: true },
  ];

  return (
    <div className="max-w-4xl">
      {/* Kopfzeile */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Einstellungen</h1>
          <p className="text-muted-foreground">
            Passen Sie Ihren Verein, Teams und Ihr Konto an.
          </p>
        </div>
      </div>

      {/* Tab-Leiste */}
      <div className="border-b mb-6">
        <div className="flex gap-1">
          {TABS.filter((t) => !t.nurAdmin || istAdmin).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAktiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  aktiveTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ TAB: Vereinsprofil ============ */}
      {aktiveTab === 'verein' && (
        <div className="space-y-6">
          {/* Vereinsname + Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Vereinsname & Logo</CardTitle>
              <CardDescription>
                Der Name und das Logo erscheinen überall in ClubOS - im Menü, in E-Mails und auf der Vereinshomepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Vereinsname</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!istAdmin}
                  placeholder="z.B. TSV Musterstadt 1920 e.V."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vereins-URL</Label>
                  <Input value={tenant?.slug || ''} disabled />
                  <p className="text-xs text-muted-foreground">
                    Wird automatisch aus dem Namen erstellt.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Aktueller Tarif</Label>
                  <div className="h-10 flex items-center">
                    <Badge variant="secondary">
                      {PLAN_LABEL[(tenant as unknown as Record<string, string>)?.plan] || 'Starter'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Vereinslogo</Label>
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    {tenant?.logo && (
                      <AvatarImage src={`${API_BASE_URL}${tenant.logo}`} alt={tenant.name} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {tenant?.name
                        ? tenant.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                        : 'CO'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={!istAdmin}
                    />
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={!istAdmin || logoLadend}
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoLadend ? 'Wird hochgeladen...' : 'Logo hochladen'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG oder WebP. Empfohlen: quadratisch, mind. 200x200 Pixel.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vereinsfarbe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Vereinsfarbe
              </CardTitle>
              <CardDescription>
                Alle Buttons, Links und Hervorhebungen in ClubOS passen sich automatisch an Ihre Vereinsfarbe an.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {FARBEN.map((f) => (
                  <button
                    key={f.wert}
                    onClick={() => handleFarbeWaehlen(f.wert)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      farbe === f.wert
                        ? 'border-foreground scale-110 shadow-lg'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: f.wert }}
                    title={f.name}
                    disabled={!istAdmin}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Label>Eigene Farbe:</Label>
                <Input
                  type="color"
                  value={farbe}
                  onChange={(e) => handleFarbeWaehlen(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                  disabled={!istAdmin}
                />
                <Input
                  value={farbe}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      handleFarbeWaehlen(e.target.value);
                    }
                    setCustomFarbe(e.target.value);
                  }}
                  placeholder="#1a56db"
                  className="w-32"
                  disabled={!istAdmin}
                />
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">Vorschau:</p>
                <div className="flex gap-3 items-center">
                  <Button>Primär-Button</Button>
                  <button
                    className="inline-flex items-center justify-center rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ borderColor: farbe, color: farbe }}
                  >
                    Outline-Button
                  </button>
                  <Badge>Badge</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Speichern */}
          {istAdmin && (
            <div className="flex items-center gap-3">
              <Button onClick={handleSpeichern} disabled={ladend}>
                <Save className="h-4 w-4 mr-2" />
                {ladend ? 'Speichern...' : 'Vereinsdaten speichern'}
              </Button>
              {gespeichert && <span className="text-sm text-green-600">Gespeichert!</span>}
              {fehler && <span className="text-sm text-destructive">{fehler}</span>}
            </div>
          )}

          {/* Weitere Einstellungen als Links */}
          {istAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Weitere Vereinseinstellungen</CardTitle>
                <CardDescription>
                  Vertiefen Sie die Konfiguration Ihres Vereins.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/einstellungen/vereinsdaten" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Vereinsdaten</p>
                      <p className="text-xs text-muted-foreground">Adresse, Kontakt, Impressum</p>
                    </div>
                  </Link>
                  <Link href="/einstellungen/homepage" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
                    <Layout className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Vereinshomepage</p>
                      <p className="text-xs text-muted-foreground">Öffentliche Webseite gestalten</p>
                    </div>
                  </Link>
                  <Link href="/einstellungen/abonnement" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Abonnement</p>
                      <p className="text-xs text-muted-foreground">Tarif & Abrechnung</p>
                    </div>
                  </Link>
                  <Link href="/einstellungen/empfehlen" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
                    <Gift className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Empfehlen</p>
                      <p className="text-xs text-muted-foreground">Gratismonate für Empfehlungen</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============ TAB: Sportbetrieb ============ */}
      {aktiveTab === 'sportbetrieb' && istAdmin && (
        <div className="space-y-4">
          <SportartenCard />
          <AltersklassenCard />
          <VeranstaltungstypenCard />
          <SportstaettenCard />

          {/* Kalender-Farben */}
          <KlappCard
            id="kalender-farben"
            titel="Kalender-Farben"
            icon={Palette}
            beschreibung="In welcher Farbe werden die Veranstaltungsarten im Kalender angezeigt?"
            kinder={
              <>
                {(Object.keys(EVENT_TYP_LABEL) as Array<keyof EventFarben>).map((typ) => (
                  <div key={typ} className="flex items-center gap-4">
                    <Input
                      type="color"
                      value={eventFarben[typ]}
                      onChange={(e) => handleEventFarbeAendern(typ, e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer shrink-0"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{EVENT_TYP_LABEL[typ]}</span>
                    </div>
                    <Badge className="text-white text-xs" style={{ backgroundColor: eventFarben[typ] }}>
                      {EVENT_TYP_LABEL[typ]}
                    </Badge>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" onClick={handleEventFarbenSpeichern}>
                    <Save className="h-4 w-4 mr-2" />
                    Farben speichern
                  </Button>
                  <Button variant="ghost" onClick={handleEventFarbenZuruecksetzen}>
                    Zurücksetzen
                  </Button>
                  {eventFarbenGespeichert && <span className="text-sm text-green-600">Gespeichert!</span>}
                </div>
              </>
            }
          />
        </div>
      )}

      {/* ============ TAB: Mein Konto ============ */}
      {aktiveTab === 'konto' && (
        <div className="space-y-6">
          {/* Kontoinformationen */}
          <Card>
            <CardHeader>
              <CardTitle>Kontoinformationen</CardTitle>
              <CardDescription>Ihre Anmeldedaten und Rolle im Verein.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-Mail-Adresse</Label>
                  <Input value={benutzer?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Mit dieser Adresse melden Sie sich an.</p>
                </div>
                <div className="space-y-2">
                  <Label>Ihre Rolle</Label>
                  <Input value={benutzer?.rolle || ''} disabled />
                  <p className="text-xs text-muted-foreground">Die Rolle bestimmt, was Sie sehen und tun können.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passwort */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Passwort ändern
              </CardTitle>
              <CardDescription>
                Das neue Passwort muss mindestens 8 Zeichen lang sein.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Aktuelles Passwort</Label>
                <Input type="password" value={altesPasswort} onChange={(e) => setAltesPasswort(e.target.value)} placeholder="Ihr aktuelles Passwort" />
              </div>
              <div className="space-y-2">
                <Label>Neues Passwort</Label>
                <Input type="password" value={neuesPasswort} onChange={(e) => setNeuesPasswort(e.target.value)} placeholder="Mindestens 8 Zeichen" />
              </div>
              <div className="space-y-2">
                <Label>Neues Passwort wiederholen</Label>
                <Input type="password" value={passwortBestaetigung} onChange={(e) => setPasswortBestaetigung(e.target.value)} placeholder="Nochmal eingeben" />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handlePasswortAendern} disabled={pwLadend || !altesPasswort || !neuesPasswort || !passwortBestaetigung} variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  {pwLadend ? 'Wird geändert...' : 'Passwort ändern'}
                </Button>
                {pwErfolg && <span className="text-sm text-green-600">{pwErfolg}</span>}
                {pwFehler && <span className="text-sm text-destructive">{pwFehler}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Links zu weiteren Konto-Seiten */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/einstellungen/sicherheit" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sicherheit</p>
                <p className="text-xs text-muted-foreground">2FA, Sitzungen verwalten</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ============ TAB: Verwaltung ============ */}
      {aktiveTab === 'verwaltung' && istAdmin && (
        <div className="space-y-6">
          {/* Schnelllinks zu Unterseiten */}
          <Card>
            <CardHeader>
              <CardTitle>Mitglieder & Finanzen</CardTitle>
              <CardDescription>
                Beiträge, Rollen und Berechtigungen für Ihre Vereinsmitglieder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/einstellungen/beitraege" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Beiträge</p>
                    <p className="text-xs text-muted-foreground">Mitgliedsbeiträge & Intervalle</p>
                  </div>
                </Link>
                <Link href="/einstellungen/rollen" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Rollen & Berechtigungen</p>
                    <p className="text-xs text-muted-foreground">Wer darf was im Verein?</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* KI-Einstellungen */}
          <Card onClick={handleKiLaden}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                KI-Einstellungen
              </CardTitle>
              <CardDescription>
                Für automatische Antworten, Formularerkennung und Trainingspläne.
                Leer lassen = Standard-Einstellung des Servers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>KI-Anbieter</Label>
                <Select
                  value={kiProvider}
                  onChange={(e) => {
                    setKiProvider(e.target.value);
                    if (e.target.value === 'anthropic' && !kiModell) setKiModell('claude-sonnet-4-20250514');
                    else if (e.target.value === 'openai' && !kiModell) setKiModell('gpt-4o');
                  }}
                >
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI (GPT)</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>API-Schlüssel</Label>
                <div className="flex gap-2">
                  <Input
                    type={kiAnzeigen ? 'text' : 'password'}
                    value={kiApiKey}
                    onChange={(e) => setKiApiKey(e.target.value)}
                    placeholder={kiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => setKiAnzeigen(!kiAnzeigen)}>
                    {kiAnzeigen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leer lassen = Server-Standard. Nur nötig mit eigenem API-Zugang.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Modell</Label>
                <Select value={kiModell} onChange={(e) => setKiModell(e.target.value)}>
                  {kiProvider === 'anthropic' ? (
                    <>
                      <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (empfohlen)</option>
                      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (schneller, günstiger)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o">GPT-4o (empfohlen)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (schneller, günstiger)</option>
                      <option value="gpt-4.1">GPT-4.1</option>
                    </>
                  )}
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleKiSpeichern} disabled={kiLadend}>
                  <Save className="h-4 w-4 mr-2" />
                  {kiLadend ? 'Wird gespeichert...' : 'KI-Einstellungen speichern'}
                </Button>
                {kiErfolg && <span className="text-sm text-green-600">{kiErfolg}</span>}
                {kiFehler && <span className="text-sm text-destructive">{kiFehler}</span>}
              </div>
            </CardContent>
          </Card>

          {/* E-Mail-Einstellungen */}
          {istAdminOderTrainer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  E-Mail-Versand (SMTP)
                </CardTitle>
                <CardDescription>
                  Eigenen E-Mail-Server einrichten, damit Mails von Ihrer Adresse kommen.
                  Ohne Einrichtung werden E-Mails über den ClubOS-Server versendet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={emailIstAktiv} onChange={(e) => setEmailIstAktiv(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                  <Label>Eigenen E-Mail-Server verwenden</Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>SMTP-Server</Label>
                    <Input value={emailSmtpHost} onChange={(e) => setEmailSmtpHost(e.target.value)} placeholder="z.B. smtp.ionos.de" />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input type="number" value={emailSmtpPort} onChange={(e) => setEmailSmtpPort(e.target.value)} placeholder="587" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Benutzername</Label>
                    <Input value={emailSmtpUser} onChange={(e) => setEmailSmtpUser(e.target.value)} placeholder="info@meinverein.de" />
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort</Label>
                    <div className="flex gap-2">
                      <Input
                        type={emailSmtpPassAnzeigen ? 'text' : 'password'}
                        value={emailSmtpPass}
                        onChange={(e) => setEmailSmtpPass(e.target.value)}
                        placeholder="SMTP-Passwort"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => setEmailSmtpPassAnzeigen(!emailSmtpPassAnzeigen)}>
                        {emailSmtpPassAnzeigen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Absender E-Mail</Label>
                    <Input type="email" value={emailAbsenderEmail} onChange={(e) => setEmailAbsenderEmail(e.target.value)} placeholder="info@meinverein.de" />
                  </div>
                  <div className="space-y-2">
                    <Label>Absender Name</Label>
                    <Input value={emailAbsenderName} onChange={(e) => setEmailAbsenderName(e.target.value)} placeholder="z.B. TSV Musterstadt" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-Mail-Signatur</Label>
                  <Textarea value={emailSignatur} onChange={(e) => setEmailSignatur(e.target.value)} placeholder="Mit sportlichen Grüßen&#10;Ihr Vereinsname" rows={3} />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={handleEmailSpeichern} disabled={emailLadend}>
                    <Save className="h-4 w-4 mr-2" />
                    {emailLadend ? 'Wird gespeichert...' : 'Speichern'}
                  </Button>
                  <Button variant="outline" onClick={handleEmailTesten} disabled={emailTestLadend || !emailSmtpHost}>
                    <Send className="h-4 w-4 mr-2" />
                    {emailTestLadend ? 'Wird gesendet...' : 'Test-E-Mail'}
                  </Button>
                  <Button variant="destructive" onClick={handleEmailLoeschen} disabled={emailLoeschend}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {emailLoeschend ? 'Wird gelöscht...' : 'Löschen'}
                  </Button>
                </div>
                {emailErfolg && <p className="text-sm text-green-600">{emailErfolg}</p>}
                {emailFehler && <p className="text-sm text-destructive">{emailFehler}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Sportstaetten-Verwaltung ====================

interface Sportstätte {
  id: string;
  name: string;
  adresse: string | null;
  kapazitaet: number | null;
  untergruende: string[];
}

const UNTERGRUND_OPTIONEN = [
  'Halle', 'Rasen', 'Kunstrasen', 'Asche', 'Hartplatz',
  'Tartanbahn', 'Schwimmbad', 'Sonstiges',
];

function SportstaettenCard() {
  const [sportstaetten, setSportstaetten] = useState<Sportstätte[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formOffen, setFormOffen] = useState(false);
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formAdresse, setFormAdresse] = useState('');
  const [formKapazitaet, setFormKapazitaet] = useState('');
  const [formUntergruende, setFormUntergruende] = useState<string[]>([]);
  const [speichernd, setSpeichernd] = useState(false);
  const [neuerUntergrund, setNeuerUntergrund] = useState('');

  const laden = async () => {
    try {
      const daten = await apiClient.get<Sportstätte[]>('/hallen');
      setSportstaetten(daten.map((s) => ({ ...s, untergruende: s.untergruende ?? [] })));
    } catch {
      console.error('Fehler beim Laden der Sportstätten');
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => {
    laden();
  }, []);

  const handleNeu = () => {
    setBearbeitenId(null);
    setFormName('');
    setFormAdresse('');
    setFormKapazitaet('');
    setFormUntergruende([]);
    setFormOffen(true);
  };

  const handleBearbeiten = (s: Sportstätte) => {
    setBearbeitenId(s.id);
    setFormName(s.name);
    setFormAdresse(s.adresse || '');
    setFormKapazitaet(s.kapazitaet ? String(s.kapazitaet) : '');
    setFormUntergruende(Array.isArray(s.untergruende) ? [...s.untergruende] : []);
    setFormOffen(true);
  };

  const handleUntergrundToggle = (ug: string) => {
    const wert = ug.toUpperCase();
    setFormUntergruende((prev) =>
      prev.includes(wert) ? prev.filter((u) => u !== wert) : [...prev, wert],
    );
  };

  const handleUntergrundHinzufuegen = () => {
    const trimmed = neuerUntergrund.trim();
    if (!trimmed) return;
    const wert = trimmed.toUpperCase();
    if (!formUntergruende.includes(wert)) {
      setFormUntergruende((prev) => [...prev, wert]);
    }
    setNeuerUntergrund('');
  };

  // Alle Untergründe: vordefinierte + bereits gespeicherte eigene
  const alleUntergruende = [...UNTERGRUND_OPTIONEN];
  formUntergruende.forEach((ug) => {
    if (!alleUntergruende.find((o) => o.toUpperCase() === ug)) {
      alleUntergruende.push(ug.charAt(0).toUpperCase() + ug.slice(1).toLowerCase());
    }
  });

  const handleSpeichern = async () => {
    if (!formName) return;
    setSpeichernd(true);
    try {
      const daten = {
        name: formName,
        adresse: formAdresse || undefined,
        kapazitaet: formKapazitaet ? parseInt(formKapazitaet) : undefined,
        untergruende: formUntergruende,
      };
      if (bearbeitenId) {
        await apiClient.put(`/hallen/${bearbeitenId}`, daten);
      } else {
        await apiClient.post('/hallen', daten);
      }
      setFormOffen(false);
      laden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setSpeichernd(false);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Sportstätte wirklich löschen? Bestehende Veranstaltungen bleiben erhalten.')) return;
    try {
      await apiClient.delete(`/hallen/${id}`);
      laden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  return (
    <KlappCard
      id="sportstaetten"
      titel="Sportstätten & Hallen"
      icon={MapPin}
      beschreibung="Hallen und Sportplätze hinterlegen. Bei Veranstaltungen wählen Sie dann einfach aus der Liste."
      kinder={
        ladend ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : (
          <>
            {sportstaetten.length === 0 && !formOffen && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Noch keine Sportstätten hinterlegt.
                </p>
                <Button variant="outline" onClick={handleNeu} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Erste Sportstätte hinzufügen
                </Button>
              </div>
            )}

            {/* Liste */}
            {sportstaetten.length > 0 && (
              <div className="space-y-2">
                {sportstaetten.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      {s.adresse && (
                        <p className="text-xs text-muted-foreground">{s.adresse}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {s.kapazitaet && s.kapazitaet > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {s.kapazitaet} Personen
                          </Badge>
                        )}
                        {s.untergruende && s.untergruende.length > 0 && s.untergruende.map((ug) => (
                          <Badge key={ug} variant="secondary" className="text-xs">
                            {UNTERGRUND_OPTIONEN.find((o) => o.toUpperCase() === ug) || ug}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBearbeiten(s)}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleLoeschen(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formular */}
            {formOffen && (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <p className="text-sm font-medium">
                  {bearbeitenId ? 'Sportstätte bearbeiten' : 'Neue Sportstätte'}
                </p>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="z.B. Ankenhalle, Sportplatz am Bach"
                  />
                  <p className="text-xs text-muted-foreground">
                    Der Name, unter dem die Sportstätte in der Auswahl erscheint.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <AdressSuche
                    value={formAdresse}
                    onChange={setFormAdresse}
                    placeholder="Adresse suchen (z.B. Jahnhalle, Kuchen)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tippen Sie die Adresse ein - Vorschläge erscheinen automatisch.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Kapazität (optional)</Label>
                  <Input
                    type="number"
                    value={formKapazitaet}
                    onChange={(e) => setFormKapazitaet(e.target.value)}
                    placeholder="z.B. 200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Wie viele Personen passen in die Halle oder auf den Platz?
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Untergründe</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Wählen Sie alle Bodenarten aus, die an dieser Sportstätte verfügbar sind.
                    Bei Veranstaltungen wird der Untergrund dann automatisch vorgeschlagen.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alleUntergruende.map((ug) => (
                      <button
                        key={ug}
                        type="button"
                        onClick={() => handleUntergrundToggle(ug)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          formUntergruende.includes(ug.toUpperCase())
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent border-border'
                        }`}
                      >
                        {ug}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={neuerUntergrund}
                      onChange={(e) => setNeuerUntergrund(e.target.value)}
                      placeholder="Eigenen Untergrund hinzufügen..."
                      className="max-w-[250px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUntergrundHinzufuegen();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUntergrundHinzufuegen}
                      disabled={!neuerUntergrund.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSpeichern} disabled={!formName || speichernd} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {speichernd ? 'Speichern...' : bearbeitenId ? 'Aktualisieren' : 'Hinzufügen'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setFormOffen(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            {sportstaetten.length > 0 && !formOffen && (
              <Button variant="outline" onClick={handleNeu}>
                <Plus className="h-4 w-4 mr-2" />
                Weitere Sportstätte hinzufügen
              </Button>
            )}
          </>
        )
      }
    />
  );
}

// ==================== Altersklassen-Verwaltung ====================

const STANDARD_ALTERSKLASSEN = [
  'Bambini', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12',
  'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19',
  'Senioren', 'AH',
];

function AltersklassenCard() {
  const [altersklassen, setAltersklassen] = useState<string[]>([]);
  const [ladend, setLadend] = useState(true);
  const [neueKlasse, setNeueKlasse] = useState('');
  const [gespeichert, setGespeichert] = useState(false);

  useEffect(() => {
    altersklassenLaden().then((daten) => {
      setAltersklassen(daten);
      setLadend(false);
    });
  }, []);

  const standardSet = new Set(STANDARD_ALTERSKLASSEN);
  const aktiveSet = new Set(altersklassen);
  const eigeneKlassen = altersklassen.filter((k) => !standardSet.has(k));

  const speichernUndMelden = async (neueKlassen: string[]) => {
    try {
      await altersklassenSpeichern(neueKlassen);
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 3000);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleToggle = async (klasse: string) => {
    let neueKlassen: string[];
    if (aktiveSet.has(klasse)) {
      neueKlassen = altersklassen.filter((k) => k !== klasse);
    } else {
      // Einfügen an der richtigen Position (Standard-Reihenfolge beibehalten)
      neueKlassen = [...altersklassen, klasse].sort((a, b) => {
        const idxA = STANDARD_ALTERSKLASSEN.indexOf(a);
        const idxB = STANDARD_ALTERSKLASSEN.indexOf(b);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
    setAltersklassen(neueKlassen);
    await speichernUndMelden(neueKlassen);
  };

  const handleHinzufuegen = async () => {
    if (!neueKlasse.trim() || altersklassen.includes(neueKlasse.trim())) return;
    const neueKlassen = [...altersklassen, neueKlasse.trim()];
    setAltersklassen(neueKlassen);
    setNeueKlasse('');
    await speichernUndMelden(neueKlassen);
  };

  const handleEntfernen = async (klasse: string) => {
    const neueKlassen = altersklassen.filter((k) => k !== klasse);
    setAltersklassen(neueKlassen);
    await speichernUndMelden(neueKlassen);
  };

  return (
    <KlappCard
      id="altersklassen"
      titel="Altersklassen"
      icon={Users}
      beschreibung="Welche Altersklassen stehen bei der Team-Erstellung zur Auswahl? Klicken Sie zum Ein-/Ausschalten."
      kinder={
        ladend ? <p className="text-sm text-muted-foreground">Laden...</p> : (
          <>
            <div>
              <Label className="text-sm font-medium mb-2 block">Standard-Klassen</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Klicken Sie auf eine Klasse, um sie für Ihren Verein ein- oder auszuschalten.
              </p>
              <div className="flex flex-wrap gap-2">
                {STANDARD_ALTERSKLASSEN.map((klasse) => (
                  <button
                    key={klasse}
                    type="button"
                    onClick={() => handleToggle(klasse)}
                    className={`text-sm py-1.5 px-3 rounded-full border transition-colors ${
                      aktiveSet.has(klasse)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {klasse}
                  </button>
                ))}
              </div>
            </div>

            {/* Eigene Klassen */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Eigene Klassen</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Brauchen Sie eine Klasse, die nicht in der Liste ist? Erstellen Sie hier Ihre eigene (z.B. Damen, Herren 2, U21).
              </p>
              {eigeneKlassen.length > 0 && (
                <div className="space-y-2 mb-4">
                  {eigeneKlassen.map((klasse) => (
                    <div
                      key={klasse}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
                    >
                      <span className="flex-1 text-sm">{klasse}</span>
                      <button
                        type="button"
                        onClick={() => handleEntfernen(klasse)}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={neueKlasse}
                  onChange={(e) => setNeueKlasse(e.target.value)}
                  placeholder="z.B. U21, Damen, Herren 2..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleHinzufuegen()}
                />
                <Button variant="outline" size="sm" onClick={handleHinzufuegen} disabled={!neueKlasse.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </div>

            {gespeichert && (
              <span className="text-sm text-green-600">Gespeichert!</span>
            )}
          </>
        )
      }
    />
  );
}

// ==================== Veranstaltungstypen-Verwaltung ====================

const VORDEFINIERTE_VERANSTALTUNGSTYPEN: VeranstaltungsTyp[] = [
  { wert: 'TRAINING', label: 'Training' },
  { wert: 'MATCH', label: 'Spiel' },
  { wert: 'TOURNAMENT', label: 'Turnier' },
  { wert: 'EVENT', label: 'Veranstaltung (Fest, Jubilaeum etc.)' },
  { wert: 'VOLUNTEER', label: 'Helfereinsatz (Aufbau, Abbau etc.)' },
  { wert: 'TRIP', label: 'Ausflug' },
  { wert: 'MEETING', label: 'Besprechung' },
];

function VeranstaltungstypenCard() {
  const [typen, setTypen] = useState<VeranstaltungsTyp[]>([]);
  const [ladend, setLadend] = useState(true);
  const [neuesLabel, setNeuesLabel] = useState('');
  const [gespeichert, setGespeichert] = useState(false);
  const [bearbeitenWert, setBearbeitenWert] = useState<string | null>(null);
  const [bearbeitenLabel, setBearbeitenLabel] = useState('');

  useEffect(() => {
    veranstaltungstypenLaden().then((daten) => {
      setTypen(daten);
      setLadend(false);
    });
  }, []);

  // Vordefinierte: Welche sind aktiv?
  const vordefinierteWerte = new Set(VORDEFINIERTE_VERANSTALTUNGSTYPEN.map((v) => v.wert));
  const aktiveWerte = new Set(typen.map((t) => t.wert));
  const eigeneTypen = typen.filter((t) => !vordefinierteWerte.has(t.wert));

  const speichernUndMelden = async (neueTypen: VeranstaltungsTyp[]) => {
    try {
      await veranstaltungstypenSpeichern(neueTypen);
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 3000);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleVordefinierteToggle = async (typ: VeranstaltungsTyp) => {
    let neueTypen: VeranstaltungsTyp[];
    if (aktiveWerte.has(typ.wert)) {
      neueTypen = typen.filter((t) => t.wert !== typ.wert);
    } else {
      const reihenfolge = VORDEFINIERTE_VERANSTALTUNGSTYPEN.map((v) => v.wert);
      neueTypen = [...typen, typ].sort((a, b) => {
        const idxA = reihenfolge.indexOf(a.wert);
        const idxB = reihenfolge.indexOf(b.wert);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
    setTypen(neueTypen);
    await speichernUndMelden(neueTypen);
  };

  const handleHinzufuegen = async () => {
    if (!neuesLabel.trim()) return;
    const wert = 'CUSTOM_' + neuesLabel.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    if (typen.find((t) => t.wert === wert)) return;
    const neueTypen = [...typen, { wert, label: neuesLabel.trim() }];
    setTypen(neueTypen);
    setNeuesLabel('');
    await speichernUndMelden(neueTypen);
  };

  const handleEntfernen = async (wert: string) => {
    const neueTypen = typen.filter((t) => t.wert !== wert);
    setTypen(neueTypen);
    await speichernUndMelden(neueTypen);
  };

  const handleLabelSpeichern = async () => {
    if (!bearbeitenWert || !bearbeitenLabel.trim()) return;
    const neueTypen = typen.map((t) =>
      t.wert === bearbeitenWert ? { ...t, label: bearbeitenLabel.trim() } : t,
    );
    setTypen(neueTypen);
    setBearbeitenWert(null);
    await speichernUndMelden(neueTypen);
  };

  return (
    <KlappCard
      id="veranstaltungstypen"
      titel="Veranstaltungstypen"
      icon={Calendar}
      beschreibung="Welche Arten von Veranstaltungen gibt es in Ihrem Verein? Klicken Sie zum Ein-/Ausschalten."
      kinder={
        ladend ? <p className="text-sm text-muted-foreground">Laden...</p> : (
          <>
            <div>
              <Label className="text-sm font-medium mb-2 block">Standard-Typen</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Klicken Sie auf einen Typ, um ihn für Ihren Verein ein- oder auszuschalten.
              </p>
              <div className="flex flex-wrap gap-2">
                {VORDEFINIERTE_VERANSTALTUNGSTYPEN.map((typ) => (
                  <button
                    key={typ.wert}
                    type="button"
                    onClick={() => handleVordefinierteToggle(typ)}
                    className={`text-sm py-1.5 px-3 rounded-full border transition-colors ${
                      aktiveWerte.has(typ.wert)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {typ.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Eigene Typen */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Eigene Typen</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Brauchen Sie einen Typ, der nicht in der Liste ist? Erstellen Sie hier Ihren eigenen.
              </p>
              {eigeneTypen.length > 0 && (
                <div className="space-y-2 mb-4">
                  {eigeneTypen.map((typ) => (
                    <div
                      key={typ.wert}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
                    >
                      {bearbeitenWert === typ.wert ? (
                        <>
                          <Input
                            value={bearbeitenLabel}
                            onChange={(e) => setBearbeitenLabel(e.target.value)}
                            className="flex-1 h-8"
                            onKeyDown={(e) => e.key === 'Enter' && handleLabelSpeichern()}
                            autoFocus
                          />
                          <Button size="sm" variant="outline" onClick={handleLabelSpeichern}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setBearbeitenWert(null)}>
                            Abbrechen
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm">{typ.label}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setBearbeitenWert(typ.wert);
                              setBearbeitenLabel(typ.label);
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEntfernen(typ.wert)}
                            className="text-xs text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={neuesLabel}
                  onChange={(e) => setNeuesLabel(e.target.value)}
                  placeholder="z.B. Vereinsfest, Generalversammlung..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleHinzufuegen()}
                />
                <Button variant="outline" size="sm" onClick={handleHinzufuegen} disabled={!neuesLabel.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </div>

            {gespeichert && (
              <span className="text-sm text-green-600">Gespeichert!</span>
            )}
          </>
        )
      }
    />
  );
}

// ==================== Sportarten-Verwaltung ====================

interface Sportart {
  id: string;
  name: string;
  beschreibung: string;
  icon: string;
  istVordefiniert: boolean;
}

const VORAUSWAHL_SPORTARTEN = [
  { name: 'Badminton', icon: '🏸' }, { name: 'Volleyball', icon: '🏐' },
  { name: 'Tischtennis', icon: '🏓' }, { name: 'Eishockey', icon: '🏒' },
  { name: 'Rugby', icon: '🏉' }, { name: 'Baseball', icon: '⚾' },
  { name: 'Golf', icon: '⛳' }, { name: 'Boxen', icon: '🥊' },
  { name: 'Judo', icon: '🥋' }, { name: 'Reiten', icon: '🏇' },
  { name: 'Rudern', icon: '🚣' }, { name: 'Klettern', icon: '🧗' },
  { name: 'Tanzen', icon: '💃' }, { name: 'Yoga', icon: '🧘' },
  { name: 'Fechten', icon: '🤺' }, { name: 'Segeln', icon: '⛵' },
];

function SportartenCard() {
  const [sportarten, setSportarten] = useState<Sportart[]>([]);
  const [ladend, setLadend] = useState(true);
  const [vordefinierteAlle, setVordefinierteAlle] = useState<{ id: string; name: string; istAktiv: boolean }[]>([]);
  const [neuerName, setNeuerName] = useState('');
  const [neuesIcon, setNeuesIcon] = useState('');
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');
  const [vorauswahlOffen, setVorauswahlOffen] = useState(false);

  const laden = async () => {
    try {
      const [result, vordefResult] = await Promise.all([
        apiClient.get<Sportart[]>('/sportarten'),
        apiClient.get<{ id: string; name: string; istAktiv: boolean }[]>('/sportarten/alle-vordefinierten').catch(() => []),
      ]);
      setSportarten(result);
      setVordefinierteAlle(vordefResult);
    } catch {
      setFehler('Fehler beim Laden.');
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => { laden(); }, []);

  const handleVordefinierteToggle = async (sportId: string) => {
    const neueAktive = vordefinierteAlle
      .map((s) => s.id === sportId ? { ...s, istAktiv: !s.istAktiv } : s)
      .filter((s) => s.istAktiv)
      .map((s) => s.id);
    try {
      await apiClient.put('/sportarten/aktive', { sportarten: neueAktive });
      sportartenCacheLeeren();
      await laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler.');
    }
  };

  const handleSportartHinzufuegen = async (name: string, icon: string) => {
    if (!name.trim()) return;
    setFehler('');
    try {
      await apiClient.post('/sportarten/custom', { name, icon, beschreibung: '' });
      sportartenCacheLeeren();
      setNeuerName('');
      setNeuesIcon('');
      setErfolg(`"${name}" hinzugefügt.`);
      setTimeout(() => setErfolg(''), 3000);
      await laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler.');
    }
  };

  const handleSportartLoeschen = async (id: string) => {
    if (!confirm('Sportart wirklich löschen?')) return;
    try {
      await apiClient.delete(`/sportarten/custom/${id}`);
      sportartenCacheLeeren();
      await laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler.');
    }
  };

  const eigene = sportarten.filter((s) => !s.istVordefiniert && s.name.trim());
  const vorhandeneNamen = new Set(sportarten.map((s) => s.name.toLowerCase()));
  const verfuegbareVorauswahl = VORAUSWAHL_SPORTARTEN.filter((v) => !vorhandeneNamen.has(v.name.toLowerCase()));

  return (
    <KlappCard
      id="sportarten"
      titel="Sportarten"
      icon={Trophy}
      beschreibung="Welche Sportarten bietet Ihr Verein an? Klicken Sie zum Ein-/Ausschalten."
      kinder={
        ladend ? <p className="text-sm text-muted-foreground">Laden...</p> : (
          <>
            {fehler && <p className="text-sm text-destructive">{fehler}</p>}
            {erfolg && <p className="text-sm text-green-600">{erfolg}</p>}

            <div>
              <Label className="text-sm font-medium mb-2 block">Standard-Sportarten</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Klicken Sie auf eine Sportart, um sie für Ihren Verein ein- oder auszuschalten.
              </p>
              <div className="flex flex-wrap gap-2">
                {vordefinierteAlle.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleVordefinierteToggle(s.id)}
                    className={`text-sm py-1.5 px-3 rounded-full border transition-colors ${
                      s.istAktiv
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Eigene Sportarten</Label>
              {eigene.length > 0 && (
                <div className="space-y-2 mb-4">
                  {eigene.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                      {s.icon && <span>{s.icon}</span>}
                      <span className="flex-1 text-sm">{s.name}</span>
                      <button type="button" onClick={() => handleSportartLoeschen(s.id)} className="text-xs text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={neuesIcon} onChange={(e) => setNeuesIcon(e.target.value)} placeholder="🏸" className="w-16" />
                <Input
                  value={neuerName}
                  onChange={(e) => setNeuerName(e.target.value)}
                  placeholder="z.B. Badminton"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSportartHinzufuegen(neuerName, neuesIcon)}
                />
                <Button variant="outline" size="sm" onClick={() => handleSportartHinzufuegen(neuerName, neuesIcon)} disabled={!neuerName.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </div>

            {verfuegbareVorauswahl.length > 0 && (
              <div>
                <button onClick={() => setVorauswahlOffen(!vorauswahlOffen)} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Zap className="h-4 w-4" />
                  {vorauswahlOffen ? 'Vorauswahl verbergen' : 'Weitere Sportarten schnell hinzufügen'}
                </button>
                {vorauswahlOffen && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {verfuegbareVorauswahl.map((v) => (
                      <button
                        key={v.name}
                        onClick={() => handleSportartHinzufuegen(v.name, v.icon)}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-primary/10 hover:border-primary transition-colors"
                      >
                        <span>{v.icon}</span> <span>{v.name}</span> <Plus className="h-3 w-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )
      }
    />
  );
}
