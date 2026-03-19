'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Palette, Save, Upload, ImageIcon, Lock, Brain, Eye, EyeOff, Mail, Trash2, Send, Building2, Trophy, CreditCard, Shield, Users, Gift, Layout, Calendar } from 'lucide-react';
import Link from 'next/link';
import { AdressSuche } from '@/components/kalender/adress-suche';
import { altersklassenLaden, altersklassenSpeichern, altersklassenFallback } from '@/lib/altersklassen';
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

const FARBEN = [
  { name: 'Blau', wert: '#1a56db' },
  { name: 'Rot', wert: '#dc2626' },
  { name: 'Gruen', wert: '#16a34a' },
  { name: 'Lila', wert: '#7c3aed' },
  { name: 'Orange', wert: '#ea580c' },
  { name: 'Pink', wert: '#db2777' },
  { name: 'Tuerkis', wert: '#0891b2' },
  { name: 'Schwarz', wert: '#171717' },
];

const PLAN_LABEL: Record<string, string> = {
  STARTER: 'Starter (29 EUR/Monat)',
  PRO: 'Pro (79 EUR/Monat)',
  CLUB: 'Club (149 EUR/Monat)',
  ENTERPRISE: 'Enterprise',
  SELF_HOSTED: 'Self-Hosted',
};

export default function EinstellungenPage() {
  const { benutzer, tenant, profilLaden } = useAuth();
  const [name, setName] = useState(tenant?.name || '');
  const [farbe, setFarbe] = useState(tenant?.primaryColor || '#1a56db');
  const [customFarbe, setCustomFarbe] = useState('');
  const [ladend, setLadend] = useState(false);
  const [logoLadend, setLogoLadend] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [fehler, setFehler] = useState('');
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

  // Passwort aendern
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
      setPwFehler('Die Passwoerter stimmen nicht ueberein.');
      return;
    }

    setPwLadend(true);

    try {
      await apiClient.put('/auth/passwort', {
        altesPasswort,
        neuesPasswort,
      });
      setPwErfolg('Passwort wurde erfolgreich geaendert.');
      setAltesPasswort('');
      setNeuesPasswort('');
      setPasswortBestaetigung('');
      setTimeout(() => setPwErfolg(''), 5000);
    } catch (error) {
      setPwFehler(
        error instanceof Error ? error.message : 'Fehler beim Aendern des Passworts.',
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
        // Keine Einstellungen vorhanden
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
    if (!confirm('E-Mail-Einstellungen wirklich loeschen?')) return;
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
      setEmailErfolg('E-Mail-Einstellungen geloescht.');
      setTimeout(() => setEmailErfolg(''), 5000);
    } catch (error) {
      setEmailFehler(
        error instanceof Error ? error.message : 'Fehler beim Loeschen.',
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
      setEmailErfolg('Test-E-Mail wurde gesendet. Bitte pruefen Sie Ihr Postfach.');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Einstellungen</h1>
          <p className="text-muted-foreground">Vereinseinstellungen verwalten</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <Badge variant="default" className="cursor-default">Verein</Badge>
        {istAdmin && (
          <Link href="/einstellungen/vereinsdaten">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Building2 className="h-3 w-3 mr-1" />
              Vereinsdaten
            </Badge>
          </Link>
        )}
        {istAdmin && (
          <Link href="/einstellungen/sportarten">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Trophy className="h-3 w-3 mr-1" />
              Sportarten
            </Badge>
          </Link>
        )}
        {istAdmin && (
          <Link href="/einstellungen/beitraege">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <CreditCard className="h-3 w-3 mr-1" />
              Beitraege
            </Badge>
          </Link>
        )}
        {istAdmin && (
          <Link href="/einstellungen/rollen">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Shield className="h-3 w-3 mr-1" />
              Rollen
            </Badge>
          </Link>
        )}
        {istAdmin && (
          <Link href="/einstellungen/empfehlen">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Gift className="h-3 w-3 mr-1" />
              Empfehlen
            </Badge>
          </Link>
        )}
        {istAdmin && (
          <Link href="/einstellungen/abonnement">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <CreditCard className="h-3 w-3 mr-1" />
              Abonnement
            </Badge>
          </Link>
        )}
        {istAdmin && (
          <Link href="/einstellungen/homepage">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Layout className="h-3 w-3 mr-1" />
              Homepage
            </Badge>
          </Link>
        )}
        {istAdmin && (
          <a href="#kalender-farben">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Calendar className="h-3 w-3 mr-1" />
              Kalender-Farben
            </Badge>
          </a>
        )}
        <a href="#ki-einstellungen">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Brain className="h-3 w-3 mr-1" />
            KI
          </Badge>
        </a>
        <Link href="/einstellungen/sicherheit">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Lock className="h-3 w-3 mr-1" />
            Sicherheit
          </Badge>
        </Link>
        {istAdminOderTrainer && (
          <a href="#email-einstellungen">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Mail className="h-3 w-3 mr-1" />
              E-Mail
            </Badge>
          </a>
        )}
      </div>

      {/* Vereinsdaten */}
      <Card>
        <CardHeader>
          <CardTitle>Vereinsdaten</CardTitle>
          <CardDescription>Name und Grundeinstellungen des Vereins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Vereinsname</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!istAdmin}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={tenant?.slug || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Tarif</Label>
              <div className="h-10 flex items-center">
                <Badge variant="secondary">
                  {PLAN_LABEL[(tenant as unknown as Record<string, string>)?.plan] || 'Starter'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vereinslogo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Vereinslogo
          </CardTitle>
          <CardDescription>
            Logo hochladen (PNG, JPG, SVG oder WebP, max. 2 MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              {tenant?.logo && (
                <AvatarImage
                  src={`${API_BASE_URL}${tenant.logo}`}
                  alt={tenant.name}
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {tenant?.name
                  ? tenant.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
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
              >
                <Upload className="h-4 w-4 mr-2" />
                {logoLadend ? 'Wird hochgeladen...' : 'Logo hochladen'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Empfohlen: Quadratisch, mind. 200x200 Pixel
              </p>
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
            Waehlen Sie die Primaerfarbe Ihres Vereins. Alle Buttons, Links und Akzente passen sich automatisch an.
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
            <div className="flex gap-3">
              <Button>Primaer-Button</Button>
              <Button variant="outline">Outline-Button</Button>
              <Badge>Badge</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kalender-Farben */}
      {istAdmin && (
        <Card id="kalender-farben">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kalender-Farben
            </CardTitle>
            <CardDescription>
              Farben fuer die verschiedenen Event-Typen im Kalender anpassen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Badge
                  className="text-white text-xs"
                  style={{ backgroundColor: eventFarben[typ] }}
                >
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
                Zuruecksetzen
              </Button>
              {eventFarbenGespeichert && (
                <span className="text-sm text-green-600">Gespeichert!</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benutzerinfo */}
      <Card>
        <CardHeader>
          <CardTitle>Mein Konto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input value={benutzer?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Input value={benutzer?.rolle || ''} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KI-Einstellungen */}
      {istAdmin && (
        <Card id="ki-einstellungen">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              KI-Einstellungen
            </CardTitle>
            <CardDescription>
              Waehlen Sie den KI-Anbieter fuer FAQ-Antworten und PDF-Erkennung.
              Unterstuetzt werden Anthropic (Claude) und OpenAI (GPT).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" onClick={handleKiLaden}>
            <div className="space-y-2">
              <Label>KI-Anbieter</Label>
              <Select
                value={kiProvider}
                onChange={(e) => {
                  setKiProvider(e.target.value);
                  if (e.target.value === 'anthropic' && !kiModell) {
                    setKiModell('claude-sonnet-4-20250514');
                  } else if (e.target.value === 'openai' && !kiModell) {
                    setKiModell('gpt-4o');
                  }
                }}
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API-Key</Label>
              <div className="flex gap-2">
                <Input
                  type={kiAnzeigen ? 'text' : 'password'}
                  value={kiApiKey}
                  onChange={(e) => setKiApiKey(e.target.value)}
                  placeholder={
                    kiProvider === 'openai'
                      ? 'sk-...'
                      : 'sk-ant-...'
                  }
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setKiAnzeigen(!kiAnzeigen)}
                >
                  {kiAnzeigen ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leer lassen um den globalen API-Key aus der Server-Konfiguration zu verwenden
              </p>
            </div>

            <div className="space-y-2">
              <Label>Modell</Label>
              <Select
                value={kiModell}
                onChange={(e) => setKiModell(e.target.value)}
              >
                {kiProvider === 'anthropic' ? (
                  <>
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (schneller, guenstiger)</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (schneller, guenstiger)</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                  </>
                )}
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleKiSpeichern}
                disabled={kiLadend}
              >
                <Brain className="h-4 w-4 mr-2" />
                {kiLadend ? 'Wird gespeichert...' : 'KI-Einstellungen speichern'}
              </Button>
              {kiErfolg && (
                <span className="text-sm text-green-600">{kiErfolg}</span>
              )}
              {kiFehler && (
                <span className="text-sm text-destructive">{kiFehler}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* E-Mail-Einstellungen */}
      {istAdminOderTrainer && (
        <Card id="email-einstellungen">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Einstellungen
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie Ihren persoenlichen SMTP-Server fuer den E-Mail-Versand aus ClubOS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Aktivierung */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailIstAktiv}
                  onChange={(e) => setEmailIstAktiv(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
              <Label>Persoenlichen E-Mail-Versand aktivieren</Label>
            </div>

            {/* SMTP Host + Port */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>SMTP-Host</Label>
                <Input
                  value={emailSmtpHost}
                  onChange={(e) => setEmailSmtpHost(e.target.value)}
                  placeholder="smtp.beispiel.de"
                />
              </div>
              <div className="space-y-2">
                <Label>SMTP-Port</Label>
                <Input
                  type="number"
                  value={emailSmtpPort}
                  onChange={(e) => setEmailSmtpPort(e.target.value)}
                  placeholder="587"
                />
              </div>
            </div>

            {/* SMTP Zugangsdaten */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP-Benutzername</Label>
                <Input
                  value={emailSmtpUser}
                  onChange={(e) => setEmailSmtpUser(e.target.value)}
                  placeholder="benutzer@beispiel.de"
                />
              </div>
              <div className="space-y-2">
                <Label>SMTP-Passwort</Label>
                <div className="flex gap-2">
                  <Input
                    type={emailSmtpPassAnzeigen ? 'text' : 'password'}
                    value={emailSmtpPass}
                    onChange={(e) => setEmailSmtpPass(e.target.value)}
                    placeholder="Passwort"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEmailSmtpPassAnzeigen(!emailSmtpPassAnzeigen)}
                  >
                    {emailSmtpPassAnzeigen ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Absender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Absender-E-Mail</Label>
                <Input
                  type="email"
                  value={emailAbsenderEmail}
                  onChange={(e) => setEmailAbsenderEmail(e.target.value)}
                  placeholder="info@meinverein.de"
                />
              </div>
              <div className="space-y-2">
                <Label>Absender-Name</Label>
                <Input
                  value={emailAbsenderName}
                  onChange={(e) => setEmailAbsenderName(e.target.value)}
                  placeholder="FC Mein Verein"
                />
              </div>
            </div>

            {/* Signatur */}
            <div className="space-y-2">
              <Label>E-Mail-Signatur (HTML)</Label>
              <Textarea
                value={emailSignatur}
                onChange={(e) => setEmailSignatur(e.target.value)}
                placeholder="<p>Mit sportlichen Gruessen<br/>Ihr Vereinsname</p>"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                HTML-Formatierung wird unterstuetzt. Die Signatur wird automatisch an jede E-Mail angehaengt.
              </p>
            </div>

            {/* Aktionen */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleEmailSpeichern}
                disabled={emailLadend}
              >
                <Save className="h-4 w-4 mr-2" />
                {emailLadend ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
              <Button
                variant="outline"
                onClick={handleEmailTesten}
                disabled={emailTestLadend || !emailSmtpHost}
              >
                <Send className="h-4 w-4 mr-2" />
                {emailTestLadend ? 'Wird gesendet...' : 'Test-E-Mail senden'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleEmailLoeschen}
                disabled={emailLoeschend}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {emailLoeschend ? 'Wird geloescht...' : 'Einstellungen loeschen'}
              </Button>
            </div>

            {emailErfolg && (
              <p className="text-sm text-green-600">{emailErfolg}</p>
            )}
            {emailFehler && (
              <p className="text-sm text-destructive">{emailFehler}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sportstaetten / Hallen / Plaetze */}
      {istAdmin && <SportstaettenCard />}

      {/* Altersklassen */}
      {istAdmin && <AltersklassenCard />}

      {/* Passwort aendern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Passwort aendern
          </CardTitle>
          <CardDescription>
            Aendern Sie Ihr persoenliches Passwort. Das neue Passwort muss mindestens 8 Zeichen lang sein.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Aktuelles Passwort</Label>
            <Input
              type="password"
              value={altesPasswort}
              onChange={(e) => setAltesPasswort(e.target.value)}
              placeholder="Aktuelles Passwort eingeben"
            />
          </div>
          <div className="space-y-2">
            <Label>Neues Passwort</Label>
            <Input
              type="password"
              value={neuesPasswort}
              onChange={(e) => setNeuesPasswort(e.target.value)}
              placeholder="Neues Passwort eingeben (min. 8 Zeichen)"
            />
          </div>
          <div className="space-y-2">
            <Label>Neues Passwort bestaetigen</Label>
            <Input
              type="password"
              value={passwortBestaetigung}
              onChange={(e) => setPasswortBestaetigung(e.target.value)}
              placeholder="Neues Passwort wiederholen"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePasswortAendern}
              disabled={pwLadend || !altesPasswort || !neuesPasswort || !passwortBestaetigung}
              variant="outline"
            >
              <Lock className="h-4 w-4 mr-2" />
              {pwLadend ? 'Wird geaendert...' : 'Passwort aendern'}
            </Button>
            {pwErfolg && (
              <span className="text-sm text-green-600">{pwErfolg}</span>
            )}
            {pwFehler && (
              <span className="text-sm text-destructive">{pwFehler}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Speichern */}
      {istAdmin && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSpeichern} disabled={ladend}>
            <Save className="h-4 w-4 mr-2" />
            {ladend ? 'Speichern...' : 'Einstellungen speichern'}
          </Button>
          {gespeichert && (
            <span className="text-sm text-green-600">Gespeichert!</span>
          )}
          {fehler && (
            <span className="text-sm text-destructive">{fehler}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Sportstaetten-Verwaltung ====================

interface Sportstaette {
  id: string;
  name: string;
  adresse: string | null;
  kapazitaet: number | null;
}

function SportstaettenCard() {
  const [sportstaetten, setSportstaetten] = useState<Sportstaette[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formOffen, setFormOffen] = useState(false);
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formAdresse, setFormAdresse] = useState('');
  const [formKapazitaet, setFormKapazitaet] = useState('');
  const [speichern, setSpeichern] = useState(false);

  const laden = async () => {
    try {
      const daten = await apiClient.get<Sportstaette[]>('/hallen');
      setSportstaetten(daten);
    } catch {
      console.error('Fehler beim Laden der Sportstaetten');
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
    setFormOffen(true);
  };

  const handleBearbeiten = (s: Sportstaette) => {
    setBearbeitenId(s.id);
    setFormName(s.name);
    setFormAdresse(s.adresse || '');
    setFormKapazitaet(s.kapazitaet ? String(s.kapazitaet) : '');
    setFormOffen(true);
  };

  const handleSpeichern = async () => {
    if (!formName) return;
    setSpeichern(true);
    try {
      const daten = {
        name: formName,
        adresse: formAdresse || undefined,
        kapazitaet: formKapazitaet ? parseInt(formKapazitaet) : undefined,
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
      setSpeichern(false);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Sportstaette wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/hallen/${id}`);
      laden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Sportstaetten & Hallen
        </CardTitle>
        <CardDescription>
          Hinterlegen Sie die Hallen und Sportplaetze Ihres Vereins einmalig.
          Diese koennen dann bei jeder Veranstaltung direkt ausgewaehlt werden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ladend ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : (
          <>
            {sportstaetten.length === 0 && !formOffen && (
              <p className="text-sm text-muted-foreground">
                Noch keine Sportstaetten hinterlegt.
              </p>
            )}

            {/* Liste */}
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
                    {s.kapazitaet && (
                      <p className="text-xs text-muted-foreground">
                        Kapazitaet: {s.kapazitaet} Personen
                      </p>
                    )}
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

            {/* Formular */}
            {formOffen && (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="z.B. Ankenhalle, Sportplatz am Bach"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <AdressSuche
                    value={formAdresse}
                    onChange={setFormAdresse}
                    placeholder="Adresse suchen (z.B. Jahnhalle, Kuchen)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kapazitaet (Personen)</Label>
                  <Input
                    type="number"
                    value={formKapazitaet}
                    onChange={(e) => setFormKapazitaet(e.target.value)}
                    placeholder="z.B. 200"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSpeichern} disabled={!formName || speichern} size="sm">
                    {speichern ? 'Speichern...' : bearbeitenId ? 'Aktualisieren' : 'Hinzufuegen'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setFormOffen(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            {!formOffen && (
              <Button variant="outline" onClick={handleNeu}>
                <Building2 className="h-4 w-4 mr-2" />
                Neue Sportstaette hinzufuegen
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Altersklassen-Verwaltung ====================

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

  const handleHinzufuegen = () => {
    if (!neueKlasse.trim() || altersklassen.includes(neueKlasse.trim())) return;
    setAltersklassen([...altersklassen, neueKlasse.trim()]);
    setNeueKlasse('');
  };

  const handleEntfernen = (index: number) => {
    setAltersklassen(altersklassen.filter((_, i) => i !== index));
  };

  const handleVerschieben = (index: number, richtung: number) => {
    const neu = [...altersklassen];
    const ziel = index + richtung;
    if (ziel < 0 || ziel >= neu.length) return;
    [neu[index], neu[ziel]] = [neu[ziel], neu[index]];
    setAltersklassen(neu);
  };

  const handleSpeichern = async () => {
    try {
      await altersklassenSpeichern(altersklassen);
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 3000);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleZuruecksetzen = () => {
    setAltersklassen(altersklassenFallback());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Altersklassen
        </CardTitle>
        <CardDescription>
          Konfigurieren Sie die Altersklassen die bei der Team-Erstellung zur Auswahl stehen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ladend ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {altersklassen.map((klasse, index) => (
                <div
                  key={`${klasse}-${index}`}
                  className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1"
                >
                  <span className="text-sm font-medium">{klasse}</span>
                  <button
                    onClick={() => handleEntfernen(index)}
                    className="text-xs text-destructive hover:text-destructive/80 ml-1"
                    title="Entfernen"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={neueKlasse}
                onChange={(e) => setNeueKlasse(e.target.value)}
                placeholder="z.B. U21, Damen, Herren 2..."
                className="max-w-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleHinzufuegen()}
              />
              <Button variant="outline" size="sm" onClick={handleHinzufuegen} disabled={!neueKlasse.trim()}>
                Hinzufuegen
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleSpeichern}>
                <Save className="h-4 w-4 mr-2" />
                Altersklassen speichern
              </Button>
              <Button variant="ghost" onClick={handleZuruecksetzen}>
                Zuruecksetzen
              </Button>
              {gespeichert && (
                <span className="text-sm text-green-600">Gespeichert!</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
