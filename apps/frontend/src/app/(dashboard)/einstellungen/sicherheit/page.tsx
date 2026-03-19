'use client';

import { useState, useRef } from 'react';
import { Shield, ShieldCheck, ShieldOff, Copy, Printer, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import {
  Settings, Building2, Trophy, CreditCard, Users, Gift, Brain, Mail, Lock, ArrowLeft,
} from 'lucide-react';

interface EinrichtungsAntwort {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export default function SicherheitPage() {
  const { benutzer } = useAuth();

  // Status
  const [twoFaAktiv, setTwoFaAktiv] = useState<boolean | null>(null);
  const [statusGeladen, setStatusGeladen] = useState(false);

  // Einrichtung
  const [schritt, setSchritt] = useState<'start' | 'qr' | 'backup' | 'fertig'>('start');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');
  const codeInputRef = useRef<HTMLInputElement>(null);

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  // 2FA-Status laden
  const statusLaden = async () => {
    if (statusGeladen) return;
    try {
      const profil = await apiClient.get<{ twoFactorEnabled?: boolean }>('/auth/profil');
      setTwoFaAktiv(profil.twoFactorEnabled ?? false);
      setStatusGeladen(true);
    } catch {
      setTwoFaAktiv(false);
      setStatusGeladen(true);
    }
  };

  // Einrichtung wird beim ersten Rendern geladen
  if (!statusGeladen) {
    statusLaden();
  }

  const handleEinrichten = async () => {
    setLadend(true);
    setFehler('');
    try {
      const antwort = await apiClient.post<EinrichtungsAntwort>('/auth/2fa/einrichten', {});
      setQrCode(antwort.qrCode);
      setSecret(antwort.secret);
      setBackupCodes(antwort.backupCodes);
      setSchritt('qr');
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler bei der Einrichtung.');
    } finally {
      setLadend(false);
    }
  };

  const handleBestaetigen = async () => {
    if (code.length !== 6) {
      setFehler('Bitte geben Sie einen 6-stelligen Code ein.');
      return;
    }
    setLadend(true);
    setFehler('');
    try {
      await apiClient.post('/auth/2fa/bestaetigen', { token: code });
      setSchritt('backup');
      setTwoFaAktiv(true);
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Ungueltiger Code.');
    } finally {
      setLadend(false);
    }
  };

  const handleDeaktivieren = async () => {
    if (!confirm('Moechten Sie die 2-Faktor-Authentifizierung wirklich deaktivieren?')) return;
    setLadend(true);
    setFehler('');
    try {
      await apiClient.delete('/auth/2fa');
      setTwoFaAktiv(false);
      setSchritt('start');
      setErfolg('2-Faktor-Authentifizierung wurde deaktiviert.');
      setTimeout(() => setErfolg(''), 5000);
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Deaktivieren.');
    } finally {
      setLadend(false);
    }
  };

  const handleCodeChange = (wert: string) => {
    const nurZiffern = wert.replace(/\D/g, '').slice(0, 6);
    setCode(nurZiffern);
    // Auto-Submit bei 6 Ziffern
    if (nurZiffern.length === 6) {
      setTimeout(() => handleBestaetigen(), 100);
    }
  };

  const handleCodesKopieren = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setErfolg('Backup-Codes in die Zwischenablage kopiert.');
    setTimeout(() => setErfolg(''), 3000);
  };

  const handleCodesDrucken = () => {
    const druckFenster = window.open('', '_blank');
    if (!druckFenster) return;
    druckFenster.document.write(`
      <html>
        <head><title>ClubOS - Backup-Codes</title></head>
        <body style="font-family: monospace; padding: 40px;">
          <h1>ClubOS - 2FA Backup-Codes</h1>
          <p>Bewahren Sie diese Codes sicher auf. Jeder Code kann nur einmal verwendet werden.</p>
          <hr/>
          <div style="font-size: 18px; line-height: 2;">
            ${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('<br/>')}
          </div>
          <hr/>
          <p style="color: gray; font-size: 12px;">Generiert am ${new Date().toLocaleDateString('de-DE')}</p>
        </body>
      </html>
    `);
    druckFenster.document.close();
    druckFenster.print();
  };

  return (
    <div className="space-y-6">
      <Link href="/einstellungen" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Einstellungen
      </Link>
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Sicherheit</h1>
          <p className="text-muted-foreground">2-Faktor-Authentifizierung verwalten</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <Link href="/einstellungen">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">Verein</Badge>
        </Link>
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
          <Link href="/einstellungen/benutzer">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Users className="h-3 w-3 mr-1" />
              Benutzer
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
        <Badge variant="default" className="cursor-default">
          <Lock className="h-3 w-3 mr-1" />
          Sicherheit
        </Badge>
      </div>

      {/* 2FA Status & Einrichtung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2-Faktor-Authentifizierung (TOTP)
          </CardTitle>
          <CardDescription>
            Schuetzen Sie Ihr Konto mit einem zusaetzlichen Sicherheitscode aus einer Authenticator-App
            (z.B. Google Authenticator, Authy, 1Password).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Status-Anzeige */}
          {twoFaAktiv !== null && schritt === 'start' && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Status:</span>
              {twoFaAktiv ? (
                <Badge variant="default" className="bg-green-600">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Aktiviert
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <ShieldOff className="h-3 w-3 mr-1" />
                  Nicht aktiviert
                </Badge>
              )}
            </div>
          )}

          {/* Schritt: Start - 2FA aktivieren oder deaktivieren */}
          {schritt === 'start' && !twoFaAktiv && (
            <Button onClick={handleEinrichten} disabled={ladend}>
              {ladend ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird eingerichtet...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  2FA aktivieren
                </>
              )}
            </Button>
          )}

          {schritt === 'start' && twoFaAktiv && (
            <Button variant="destructive" onClick={handleDeaktivieren} disabled={ladend}>
              {ladend ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird deaktiviert...
                </>
              ) : (
                <>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  2FA deaktivieren
                </>
              )}
            </Button>
          )}

          {/* Schritt: QR-Code anzeigen + Code eingeben */}
          {schritt === 'qr' && (
            <div className="space-y-6">
              <div className="rounded-lg border p-6 space-y-4 max-w-md">
                <h3 className="font-semibold">1. QR-Code scannen</h3>
                <p className="text-sm text-muted-foreground">
                  Scannen Sie den QR-Code mit Ihrer Authenticator-App.
                </p>
                {qrCode && (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="2FA QR-Code" className="w-48 h-48" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Oder geben Sie diesen Code manuell ein:
                  </Label>
                  <code className="block bg-muted p-2 rounded text-sm font-mono break-all select-all">
                    {secret}
                  </code>
                </div>
              </div>

              <div className="rounded-lg border p-6 space-y-4 max-w-md">
                <h3 className="font-semibold">2. Code eingeben</h3>
                <p className="text-sm text-muted-foreground">
                  Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein, um die Einrichtung abzuschliessen.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="totp-code">Verifizierungscode</Label>
                  <Input
                    ref={codeInputRef}
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="text-center text-2xl tracking-widest font-mono max-w-[200px]"
                    autoFocus
                  />
                </div>
                <Button onClick={handleBestaetigen} disabled={ladend || code.length !== 6}>
                  {ladend ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird verifiziert...
                    </>
                  ) : (
                    'Bestaetigen'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Schritt: Backup-Codes anzeigen (einmalig!) */}
          {schritt === 'backup' && (
            <div className="space-y-4 max-w-md">
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-6 space-y-4">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Backup-Codes sichern
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Speichern Sie diese Codes an einem sicheren Ort. Sie koennen jeden Code einmal verwenden,
                  falls Sie keinen Zugriff auf Ihre Authenticator-App haben.
                  Diese Codes werden nur jetzt angezeigt!
                </p>
                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-gray-900 p-4 rounded border">
                  {backupCodes.map((bc, idx) => (
                    <code key={idx} className="text-sm font-mono p-1">
                      {idx + 1}. {bc}
                    </code>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCodesKopieren}>
                    <Copy className="h-4 w-4 mr-1" />
                    Codes kopieren
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCodesDrucken}>
                    <Printer className="h-4 w-4 mr-1" />
                    Codes drucken
                  </Button>
                </div>
              </div>
              <Button onClick={() => { setSchritt('start'); setCode(''); }}>
                Fertig
              </Button>
            </div>
          )}

          {/* Fehler & Erfolg */}
          {fehler && (
            <p className="text-sm text-destructive">{fehler}</p>
          )}
          {erfolg && (
            <p className="text-sm text-green-600">{erfolg}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
