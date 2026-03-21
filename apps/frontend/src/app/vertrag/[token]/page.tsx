'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/constants';

interface VertragDaten {
  vertrag: {
    id: string;
    titel: string;
    inhalt: string;
    version: number;
  };
  name: string;
  email: string;
  bereitsUnterschrieben: boolean;
  unterschriebenAm: string | null;
}

export default function VertragUnterschreibenPage() {
  const params = useParams();
  const token = params.token as string;

  const [laden, setLaden] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [daten, setDaten] = useState<VertragDaten | null>(null);

  // Formular-State
  const [gelesen, setGelesen] = useState(false);
  const [unterschrift, setUnterschrift] = useState('');
  const [absenden, setAbsenden] = useState(false);
  const [erfolg, setErfolg] = useState(false);

  useEffect(() => {
    if (!token) return;

    const vertragLaden = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vertrag/unterschreiben/${token}`);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Vertrag konnte nicht geladen werden');
        }
        const result = await response.json();
        setDaten(result);
      } catch (err) {
        setFehler(
          err instanceof Error
            ? err.message
            : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es spaeter erneut.',
        );
      } finally {
        setLaden(false);
      }
    };

    vertragLaden();
  }, [token]);

  const vertragUnterschreiben = async () => {
    if (!unterschrift.trim() || !gelesen) return;
    setAbsenden(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vertrag/unterschreiben/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unterschrift: unterschrift.trim() }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Unterschrift fehlgeschlagen');
      }
      setErfolg(true);
    } catch (err) {
      setFehler(
        err instanceof Error
          ? err.message
          : 'Ein Fehler ist aufgetreten.',
      );
    } finally {
      setAbsenden(false);
    }
  };

  // Laden
  if (laden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Vertrag wird geladen...
        </div>
      </div>
    );
  }

  // Fehler
  if (fehler && !daten) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <h2 className="text-lg font-semibold mb-2">Vertrag nicht gefunden</h2>
            <p className="text-sm text-muted-foreground">{fehler}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!daten) return null;

  // Bereits unterschrieben
  if (daten.bereitsUnterschrieben && !erfolg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-lg font-semibold mb-2">Bereits unterschrieben</h2>
            <p className="text-sm text-muted-foreground">
              Dieser Vertrag wurde bereits am{' '}
              {daten.unterschriebenAm
                ? new Date(daten.unterschriebenAm).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'einem frueheren Zeitpunkt'}{' '}
              unterschrieben.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erfolg nach Unterschrift
  if (erfolg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2">Vielen Dank!</h2>
            <p className="text-muted-foreground">
              Der Vertrag wurde erfolgreich unterschrieben. Sie koennen dieses Fenster jetzt
              schliessen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vertrag anzeigen + Unterschrift
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            Vertrag zur Unterschrift
          </div>
          <h1 className="text-xl font-bold">{daten.vertrag.titel}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fuer: {daten.name} ({daten.email})
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Vertragsinhalt */}
        <Card>
          <CardContent className="pt-6">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: daten.vertrag.inhalt }}
            />
          </CardContent>
        </Card>

        {/* Fehler */}
        {fehler && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {fehler}
          </div>
        )}

        {/* Unterschrift-Bereich */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <h3 className="font-semibold text-lg">Digitale Unterschrift</h3>

            {/* Checkbox: Gelesen */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={gelesen}
                onChange={(e) => setGelesen(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">
                Ich habe den Vertrag vollstaendig gelesen und stimme den Bedingungen zu.
              </span>
            </label>

            {/* Name (vorausgefuellt) */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={daten.name} disabled className="bg-muted/50" />
            </div>

            {/* Unterschrift */}
            <div className="space-y-2">
              <Label>Digitale Unterschrift: Ihr vollstaendiger Name</Label>
              <Input
                value={unterschrift}
                onChange={(e) => setUnterschrift(e.target.value)}
                placeholder={daten.name}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Geben Sie Ihren vollstaendigen Namen als digitale Unterschrift ein.
              </p>
            </div>

            {/* Absenden */}
            <Button
              size="lg"
              className="w-full text-base"
              disabled={!gelesen || !unterschrift.trim() || absenden}
              onClick={vertragUnterschreiben}
            >
              {absenden ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Wird unterschrieben...
                </>
              ) : (
                'Verbindlich unterschreiben'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Mit dem Klick auf &quot;Verbindlich unterschreiben&quot; erklaeren Sie sich
              rechtsverbindlich mit den oben genannten Vertragsbedingungen einverstanden.
              Ihre IP-Adresse und der Zeitpunkt werden protokolliert.
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card px-6 py-4 mt-8">
        <div className="max-w-3xl mx-auto text-center text-xs text-muted-foreground">
          Vereinbase &middot; Digitale Vertragsverwaltung
        </div>
      </footer>
    </div>
  );
}
