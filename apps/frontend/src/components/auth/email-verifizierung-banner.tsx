'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export function EmailVerifizierungBanner() {
  const { benutzer, emailVerifizierungSenden } = useAuthStore();
  const [gesendet, setGesendet] = useState(false);
  const [istLadend, setIstLadend] = useState(false);

  // Nicht anzeigen wenn verifiziert oder kein Benutzer
  if (!benutzer || benutzer.emailVerifiziert) {
    return null;
  }

  const handleSenden = async () => {
    setIstLadend(true);
    try {
      await emailVerifizierungSenden();
      setGesendet(true);
    } catch {
      // Fehler ignorieren
    } finally {
      setIstLadend(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      <p>
        Ihre E-Mail-Adresse <strong>{benutzer.email}</strong> ist noch nicht
        verifiziert. Bitte pruefen Sie Ihr Postfach.
      </p>
      {gesendet ? (
        <span className="whitespace-nowrap text-xs text-yellow-600">
          E-Mail gesendet
        </span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSenden}
          disabled={istLadend}
          className="whitespace-nowrap border-yellow-400 text-yellow-800 hover:bg-yellow-100"
        >
          {istLadend ? 'Wird gesendet...' : 'Erneut senden'}
        </Button>
      )}
    </div>
  );
}
