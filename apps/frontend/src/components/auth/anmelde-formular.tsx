'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswortInput } from '@/components/ui/passwort-input';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';

export function AnmeldeFormular() {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [zweiCode, setZweiCode] = useState('');
  const [istBackupModus, setIstBackupModus] = useState(false);
  const {
    anmelden,
    zweiFaktorVerifizieren,
    zweiFaktorAbbrechen,
    istLadend,
    fehler,
    benoetigtZweiFaktor,
    istAngemeldet,
  } = useAuth();
  const router = useRouter();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-Focus auf Code-Input wenn 2FA angezeigt wird
  useEffect(() => {
    if (benoetigtZweiFaktor && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [benoetigtZweiFaktor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await anmelden(email, passwort);
      // Nach erfolgreichem Login direkt zum Dashboard navigieren
      // (anmelden() setzt istAngemeldet synchron im Store)
      // Pruefen ob 2FA benoetigt wird - dann NICHT weiterleiten
      const store = useAuthStore.getState();
      if (!store.benoetigtZweiFaktor && store.istAngemeldet) {
        router.push('/dashboard');
      }
    } catch {
      // Fehler wird im Store gesetzt
    }
  };

  // Redirect zum Dashboard wenn bereits angemeldet (z.B. bei Seitenreload)
  useEffect(() => {
    if (istAngemeldet) {
      router.push('/dashboard');
    }
  }, [istAngemeldet, router]);

  const handleZweiCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zweiCode) return;
    try {
      await zweiFaktorVerifizieren(zweiCode);
      // Nach erfolgreicher 2FA direkt weiterleiten
      router.push('/dashboard');
    } catch {
      // Fehler wird im Store gesetzt
    }
  };

  const handleCodeChange = (wert: string) => {
    if (istBackupModus) {
      // Backup-Codes: 8 Hex-Zeichen erlauben
      setZweiCode(wert.slice(0, 8));
    } else {
      // TOTP: Nur Ziffern, max 6
      const nurZiffern = wert.replace(/\D/g, '').slice(0, 6);
      setZweiCode(nurZiffern);
      // Auto-Submit bei 6 Ziffern
      if (nurZiffern.length === 6) {
        setTimeout(async () => {
          try {
            await zweiFaktorVerifizieren(nurZiffern);
            router.push('/dashboard');
          } catch {
            // Fehler im Store
          }
        }, 100);
      }
    }
  };

  const handleZurueck = () => {
    zweiFaktorAbbrechen();
    setZweiCode('');
    setIstBackupModus(false);
  };

  // 2FA-Dialog
  if (benoetigtZweiFaktor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">2-Faktor-Authentifizierung</h2>
            <p className="text-sm text-muted-foreground">
              {istBackupModus
                ? 'Geben Sie einen Ihrer Backup-Codes ein.'
                : 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleZweiCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zwei-code">
              {istBackupModus ? 'Backup-Code' : 'Verifizierungscode'}
            </Label>
            {istBackupModus ? (
              <Input
                ref={codeInputRef}
                id="zwei-code"
                type="text"
                placeholder="a1b2c3d4"
                value={zweiCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="font-mono"
                autoFocus
              />
            ) : (
              <Input
                ref={codeInputRef}
                id="zwei-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={zweiCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            )}
          </div>

          {fehler && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {fehler}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={istLadend || !zweiCode}>
            {istLadend ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird verifiziert...
              </>
            ) : (
              'Verifizieren'
            )}
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleZurueck}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Zurueck zur Anmeldung
            </button>
            <button
              type="button"
              onClick={() => {
                setIstBackupModus(!istBackupModus);
                setZweiCode('');
              }}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              {istBackupModus ? 'Authenticator-Code verwenden' : 'Backup-Code verwenden'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Normales Anmeldeformular
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input
          id="email"
          type="email"
          placeholder="vorstand@fckunchen.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="passwort">Passwort</Label>
          <Link
            href="/passwort-vergessen"
            className="text-xs text-muted-foreground hover:text-primary underline"
          >
            Passwort vergessen?
          </Link>
        </div>
        <PasswortInput
          id="passwort"
          placeholder="Passwort eingeben"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {fehler}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={istLadend}>
        {istLadend ? 'Wird angemeldet...' : 'Anmelden'}
      </Button>
    </form>
  );
}
