'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswortInput } from '@/components/ui/passwort-input';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface RegistrierenAntwort {
  benutzer: {
    id: string;
    email: string;
    rolle: string;
    tenantId: string;
    berechtigungen: string[];
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string;
  };
  accessToken: string;
  refreshToken: string;
}

export function RegistrierenFormular() {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [passwortBestaetigung, setPasswortBestaetigung] = useState('');
  const [vereinsname, setVereinsname] = useState('');
  const [slug, setSlug] = useState('');
  const [empfehlungscode, setEmpfehlungscode] = useState('');
  const [istLadend, setIstLadend] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setEmpfehlungscode(refCode);
    }
  }, [searchParams]);

  const handleVereinsname = (value: string) => {
    setVereinsname(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(null);

    if (passwort !== passwortBestaetigung) {
      setFehler('Die Passwoerter stimmen nicht ueberein.');
      return;
    }

    if (passwort.length < 8) {
      setFehler('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    setIstLadend(true);
    try {
      const antwort = await apiClient.post<RegistrierenAntwort>(
        '/auth/registrieren',
        { email, passwort, vereinsname, slug },
      );

      useAuthStore.setState({
        benutzer: antwort.benutzer,
        tenant: antwort.tenant,
        accessToken: antwort.accessToken,
        refreshToken: antwort.refreshToken,
        istAngemeldet: true,
      });

      // Empfehlungscode einloesen (falls angegeben)
      if (empfehlungscode.trim()) {
        try {
          await apiClient.post('/referral/einloesen', {
            code: empfehlungscode.trim(),
            tenantId: antwort.tenant.id,
          });
        } catch {
          // Fehler beim Einloesen ignorieren — Registrierung war trotzdem erfolgreich
        }
      }

      router.push('/onboarding');
    } catch (error) {
      setFehler(
        error instanceof Error
          ? error.message
          : 'Registrierung fehlgeschlagen.',
      );
    } finally {
      setIstLadend(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vereinsname">Vereinsname</Label>
        <Input
          id="vereinsname"
          type="text"
          placeholder="FC Musterstadt 1920 e.V."
          value={vereinsname}
          onChange={(e) => handleVereinsname(e.target.value)}
          required
          minLength={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Vereins-URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            clubos.de/
          </span>
          <Input
            id="slug"
            type="text"
            placeholder="fcmusterstadt"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }
            required
            minLength={3}
            maxLength={50}
            pattern="^[a-z0-9-]+$"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">E-Mail-Adresse</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="vorstand@fcmusterstadt.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-passwort">Passwort</Label>
        <PasswortInput
          id="reg-passwort"
          placeholder="Mindestens 8 Zeichen"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          zeigeStaerke
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwort-bestaetigung">Passwort bestaetigen</Label>
        <PasswortInput
          id="passwort-bestaetigung"
          placeholder="Passwort wiederholen"
          value={passwortBestaetigung}
          onChange={(e) => setPasswortBestaetigung(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="empfehlungscode">
          Empfehlungscode <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="empfehlungscode"
          type="text"
          placeholder="z.B. FCKUNCHEN2026"
          value={empfehlungscode}
          onChange={(e) => setEmpfehlungscode(e.target.value.toUpperCase())}
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground">
          Haben Sie einen Empfehlungscode? Beide Vereine erhalten 1 Monat gratis.
        </p>
      </div>

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {fehler}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={istLadend}>
        {istLadend ? 'Verein wird registriert...' : 'Verein registrieren'}
      </Button>
    </form>
  );
}
