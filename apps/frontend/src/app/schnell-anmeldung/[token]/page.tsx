'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type AntwortStatus = 'YES' | 'NO' | 'MAYBE';

type Zustand =
  | 'auswahl'
  | 'grund-eingabe'
  | 'wird-gesendet'
  | 'erfolg'
  | 'fehler';

export default function SchnellAnmeldungSeite() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [zustand, setZustand] = useState<Zustand>('auswahl');
  const [grund, setGrund] = useState('');
  const [grundFehler, setGrundFehler] = useState('');
  const [fehlerNachricht, setFehlerNachricht] = useState('');

  const antwortSenden = async (status: AntwortStatus, absageGrund?: string) => {
    setZustand('wird-gesendet');

    try {
      const body: { token: string; status: AntwortStatus; grund?: string } = {
        token,
        status,
      };

      if (absageGrund) {
        body.grund = absageGrund;
      }

      const antwort = await fetch(
        `${API_BASE_URL}/veranstaltungen/schnell-anmeldung`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (!antwort.ok) {
        const daten = await antwort.json().catch(() => null);
        const nachricht =
          daten?.message ||
          (antwort.status === 410
            ? 'Dieser Link ist abgelaufen.'
            : antwort.status === 409
              ? 'Sie haben bereits geantwortet.'
              : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es spaeter erneut.');
        setFehlerNachricht(nachricht);
        setZustand('fehler');
        return;
      }

      setZustand('erfolg');
    } catch {
      setFehlerNachricht(
        'Verbindung fehlgeschlagen. Bitte pruefen Sie Ihre Internetverbindung.',
      );
      setZustand('fehler');
    }
  };

  const absageBestaetigen = () => {
    if (grund.trim().length < 3) {
      setGrundFehler('Bitte geben Sie einen Grund an (mind. 3 Zeichen).');
      return;
    }
    setGrundFehler('');
    antwortSenden('NO', grund.trim());
  };

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
        {zustand === 'auswahl' && (
          <Card>
            <CardHeader>
              <CardTitle>Schnell-Anmeldung</CardTitle>
              <CardDescription>
                Bitte geben Sie Ihre Rueckmeldung zur Veranstaltung ab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Button
                  className="h-14 w-full bg-green-600 text-lg text-white hover:bg-green-700"
                  onClick={() => antwortSenden('YES')}
                >
                  Zusagen
                </Button>
                <Button
                  className="h-14 w-full bg-red-600 text-lg text-white hover:bg-red-700"
                  onClick={() => setZustand('grund-eingabe')}
                >
                  Absagen
                </Button>
                <Button
                  className="h-14 w-full bg-yellow-500 text-lg text-white hover:bg-yellow-600"
                  onClick={() => antwortSenden('MAYBE')}
                >
                  Vielleicht
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {zustand === 'grund-eingabe' && (
          <Card>
            <CardHeader>
              <CardTitle>Absage-Grund</CardTitle>
              <CardDescription>
                Bitte geben Sie einen Grund für Ihre Absage an.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <Textarea
                    placeholder="Grund für die Absage..."
                    value={grund}
                    onChange={(e) => {
                      setGrund(e.target.value);
                      if (e.target.value.trim().length >= 3) {
                        setGrundFehler('');
                      }
                    }}
                    rows={3}
                  />
                  {grundFehler && (
                    <p className="mt-1 text-sm text-red-600">{grundFehler}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setGrund('');
                      setGrundFehler('');
                      setZustand('auswahl');
                    }}
                  >
                    Zurueck
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    onClick={absageBestaetigen}
                  >
                    Absage senden
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {zustand === 'wird-gesendet' && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">
                Ihre Antwort wird gesendet...
              </p>
            </CardContent>
          </Card>
        )}

        {zustand === 'erfolg' && (
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
              <h2 className="mb-2 text-xl font-semibold">Vielen Dank!</h2>
              <p className="text-muted-foreground">
                Ihre Antwort wurde gespeichert.
              </p>
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
                Fehler
              </h2>
              <p className="mb-4 text-muted-foreground">{fehlerNachricht}</p>
              <Button
                variant="outline"
                onClick={() => setZustand('auswahl')}
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
