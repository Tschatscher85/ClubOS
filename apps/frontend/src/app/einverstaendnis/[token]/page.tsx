'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, FileCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/lib/constants';

interface EinverstaendnisInfo {
  titel: string;
  inhalt: string;
  event: {
    title: string;
    date: string;
    location: string;
  };
}

interface MitgliedInfo {
  id: string;
  firstName: string;
  lastName: string;
  parentEmail: string | null;
}

interface TokenDaten {
  einverstaendnis: EinverstaendnisInfo;
  mitglied: MitgliedInfo;
  bereitsBeantwortet: boolean;
  bestehendeAntwort: {
    zugestimmt: boolean;
    elternName: string;
  } | null;
}

export default function EinverstaendnisTokenPage() {
  const params = useParams();
  const token = params.token as string;

  const [daten, setDaten] = useState<TokenDaten | null>(null);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');
  const [elternName, setElternName] = useState('');
  const [zugestimmt, setZugestimmt] = useState<boolean | null>(null);
  const [absendeLadend, setAbsendeLadend] = useState(false);
  const [erfolg, setErfolg] = useState(false);

  useEffect(() => {
    async function laden() {
      try {
        const response = await fetch(`${API_BASE_URL}/einverstaendnis/token/${token}`);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Ungueltiger oder abgelaufener Link.');
        }
        const data: TokenDaten = await response.json();
        setDaten(data);
        if (data.bestehendeAntwort) {
          setElternName(data.bestehendeAntwort.elternName);
          setZugestimmt(data.bestehendeAntwort.zugestimmt);
        }
      } catch (err) {
        setFehler(err instanceof Error ? err.message : 'Fehler beim Laden.');
      } finally {
        setLadend(false);
      }
    }
    laden();
  }, [token]);

  const handleAbsenden = async () => {
    if (!elternName.trim() || zugestimmt === null) return;
    setAbsendeLadend(true);
    try {
      const response = await fetch(`${API_BASE_URL}/einverstaendnis/token/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elternName: elternName.trim(),
          zugestimmt,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Fehler beim Speichern.');
      }
      setErfolg(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler beim Speichern.');
    } finally {
      setAbsendeLadend(false);
    }
  };

  if (ladend) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Wird geladen...
        </div>
      </div>
    );
  }

  if (fehler && !daten) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Link ungueltig</h2>
            <p className="text-muted-foreground">{fehler}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (erfolg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Vielen Dank!</h2>
            <p className="text-muted-foreground">
              Ihre Antwort wurde gespeichert. Sie koennen diese Seite jetzt schliessen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!daten) return null;

  const { einverstaendnis, mitglied } = daten;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <FileCheck className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-xl font-bold">Einverstaendniserklaerung</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fuer {mitglied.firstName} {mitglied.lastName}
          </p>
        </div>

        {/* Event-Info */}
        <Card>
          <CardContent className="pt-4 space-y-1 text-sm">
            <p><strong>Veranstaltung:</strong> {einverstaendnis.event.title}</p>
            <p>
              <strong>Datum:</strong>{' '}
              {new Date(einverstaendnis.event.date).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p><strong>Ort:</strong> {einverstaendnis.event.location}</p>
          </CardContent>
        </Card>

        {/* Erklaerungstext */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{einverstaendnis.titel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {einverstaendnis.inhalt}
            </div>
          </CardContent>
        </Card>

        {/* Bereits beantwortet Hinweis */}
        {daten.bereitsBeantwortet && (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Sie haben diese Erklaerung bereits beantwortet. Sie koennen Ihre Antwort unten aktualisieren.
          </div>
        )}

        {/* Antwort-Formular */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ihre Antwort</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ihr Name (Erziehungsberechtigte/r) *</Label>
              <Input
                value={elternName}
                onChange={(e) => setElternName(e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </div>

            <div className="space-y-2">
              <Label>Einverstaendnis *</Label>
              <div className="flex gap-3">
                <Button
                  variant={zugestimmt === true ? 'default' : 'outline'}
                  className={zugestimmt === true ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setZugestimmt(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Ich stimme zu
                </Button>
                <Button
                  variant={zugestimmt === false ? 'default' : 'outline'}
                  className={zugestimmt === false ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setZugestimmt(false)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Ich stimme nicht zu
                </Button>
              </div>
            </div>

            {fehler && (
              <p className="text-sm text-red-600">{fehler}</p>
            )}

            <Button
              className="w-full"
              onClick={handleAbsenden}
              disabled={!elternName.trim() || zugestimmt === null || absendeLadend}
            >
              {absendeLadend ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                'Unterschreiben und absenden'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
