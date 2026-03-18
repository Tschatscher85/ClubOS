'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

export function EmailVerifizierenInhalt() {
  const [istLadend, setIstLadend] = useState(true);
  const [erfolg, setErfolg] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setFehler('Kein gueltiger Verifizierungs-Link.');
      setIstLadend(false);
      return;
    }

    const verifizieren = async () => {
      try {
        await apiClient.get(
          `/auth/email-verifizieren?token=${encodeURIComponent(token)}`,
        );
        setErfolg(true);
      } catch (error) {
        setFehler(
          error instanceof Error
            ? error.message
            : 'Verifizierung fehlgeschlagen.',
        );
      } finally {
        setIstLadend(false);
      }
    };

    verifizieren();
  }, [token]);

  if (istLadend) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        E-Mail wird verifiziert...
      </div>
    );
  }

  if (erfolg) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-primary/10 p-4 text-sm text-primary">
          Ihre E-Mail-Adresse wurde erfolgreich verifiziert!
        </div>
        <Button className="w-full" onClick={() => router.push('/dashboard')}>
          Zum Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {fehler}
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push('/anmelden')}
      >
        Zur Anmeldung
      </Button>
    </div>
  );
}
