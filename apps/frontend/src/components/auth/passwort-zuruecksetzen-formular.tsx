'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswortInput } from '@/components/ui/passwort-input';
import { apiClient } from '@/lib/api-client';

export function PasswortZuruecksetzenFormular() {
  const [neuesPasswort, setNeuesPasswort] = useState('');
  const [passwortBestaetigung, setPasswortBestaetigung] = useState('');
  const [istLadend, setIstLadend] = useState(false);
  const [erfolg, setErfolg] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(null);

    if (!token) {
      setFehler('Kein gueltiger Reset-Link. Bitte fordern Sie einen neuen an.');
      return;
    }

    if (neuesPasswort !== passwortBestaetigung) {
      setFehler('Die Passwoerter stimmen nicht ueberein.');
      return;
    }

    if (neuesPasswort.length < 8) {
      setFehler('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    setIstLadend(true);
    try {
      await apiClient.post('/auth/passwort-zuruecksetzen', {
        token,
        neuesPasswort,
      });
      setErfolg(true);
    } catch (error) {
      setFehler(
        error instanceof Error
          ? error.message
          : 'Ein Fehler ist aufgetreten.',
      );
    } finally {
      setIstLadend(false);
    }
  };

  if (erfolg) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-primary/10 p-4 text-sm text-primary">
          Ihr Passwort wurde erfolgreich zurueckgesetzt!
        </div>
        <Button className="w-full" onClick={() => router.push('/anmelden')}>
          Zur Anmeldung
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Kein gueltiger Reset-Link. Bitte fordern Sie einen neuen an.
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/passwort-vergessen')}
        >
          Neuen Link anfordern
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="neues-passwort">Neues Passwort</Label>
        <PasswortInput
          id="neues-passwort"
          placeholder="Mindestens 8 Zeichen"
          value={neuesPasswort}
          onChange={(e) => setNeuesPasswort(e.target.value)}
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

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {fehler}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={istLadend}>
        {istLadend ? 'Wird gespeichert...' : 'Neues Passwort setzen'}
      </Button>
    </form>
  );
}
