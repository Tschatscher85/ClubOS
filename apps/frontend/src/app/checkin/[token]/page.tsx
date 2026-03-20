'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

type Zustand = 'ladend' | 'erfolg' | 'fehler' | 'nicht-angemeldet';

interface CheckinErgebnis {
  nachricht: string;
  veranstaltung: string;
  datum: string;
  mitglied?: { firstName: string; lastName: string };
}

export default function CheckinSeite() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [zustand, setZustand] = useState<Zustand>('ladend');
  const [ergebnis, setErgebnis] = useState<CheckinErgebnis | null>(null);
  const [fehlerNachricht, setFehlerNachricht] = useState('');

  useEffect(() => {
    if (!token) return;

    const checkinDurchfuehren = async () => {
      // Access-Token aus localStorage holen (falls eingeloggt)
      let accessToken: string | null = null;
      try {
        const authStorage = localStorage.getItem('vereinbase-auth');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          accessToken = parsed?.state?.accessToken ?? null;
        }
      } catch {
        // Kein Token vorhanden
      }

      if (!accessToken) {
        setZustand('nicht-angemeldet');
        return;
      }

      try {
        const antwort = await fetch(
          `${API_BASE_URL}/veranstaltungen/checkin/${token}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({}),
          },
        );

        if (!antwort.ok) {
          const daten = await antwort.json().catch(() => null);
          const nachricht =
            daten?.message ||
            daten?.nachricht ||
            'Ein Fehler ist aufgetreten. Bitte versuche es spaeter erneut.';
          setFehlerNachricht(nachricht);
          setZustand('fehler');
          return;
        }

        const daten: CheckinErgebnis = await antwort.json();
        setErgebnis(daten);
        setZustand('erfolg');
      } catch {
        setFehlerNachricht(
          'Verbindung fehlgeschlagen. Bitte pruefe deine Internetverbindung.',
        );
        setZustand('fehler');
      }
    };

    checkinDurchfuehren();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-4 py-4">
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-bold text-primary">Vereinbase</h1>
        </div>
      </header>

      {/* Inhalt */}
      <main className="mx-auto max-w-lg px-4 py-8">
        {zustand === 'ladend' && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">
                Check-In wird verarbeitet...
              </p>
            </CardContent>
          </Card>
        )}

        {zustand === 'erfolg' && ergebnis && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-green-700">
                Du bist als anwesend eingetragen!
              </h2>
              {ergebnis.mitglied && (
                <p className="text-muted-foreground mb-1">
                  {ergebnis.mitglied.firstName} {ergebnis.mitglied.lastName}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {ergebnis.veranstaltung}
                {ergebnis.datum && (
                  <>
                    {' — '}
                    {new Date(ergebnis.datum).toLocaleDateString('de-DE', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {zustand === 'nicht-angemeldet' && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold">
                Bitte melde dich an um einzuchecken
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Du musst angemeldet sein, damit wir dich als Mitglied erkennen koennen.
              </p>
              <Button asChild>
                <a href={`/anmelden?redirect=/checkin/${token}`}>
                  Zur Anmeldung
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {zustand === 'fehler' && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-red-600">
                Check-In fehlgeschlagen
              </h2>
              <p className="mb-4 text-muted-foreground">{fehlerNachricht}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Erneut versuchen
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        Bereitgestellt von Vereinbase
      </footer>
    </div>
  );
}
