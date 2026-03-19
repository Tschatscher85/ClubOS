'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, Award, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';

interface EmpfehlungsDaten {
  code: string;
  empfohleneVereine: number;
  freiMonate: number;
  erstelltAm: string;
  ausgezahltAm: string | null;
}

interface StatistikDaten {
  code: string | null;
  empfohleneVereine: number;
  freiMonate: number;
  erstelltAm: string | null;
  ausgezahltAm: string | null;
  empfehlungen: { nr: number }[];
}

export default function EmpfehlenPage() {
  const { benutzer } = useAuth();
  const [daten, setDaten] = useState<EmpfehlungsDaten | null>(null);
  const [statistik, setStatistik] = useState<StatistikDaten | null>(null);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');
  const [codeKopiert, setCodeKopiert] = useState(false);
  const [linkKopiert, setLinkKopiert] = useState(false);

  const istAdmin =
    benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  useEffect(() => {
    if (!istAdmin) return;

    const laden = async () => {
      setLadend(true);
      setFehler('');
      try {
        const [codeDaten, statDaten] = await Promise.all([
          apiClient.get<EmpfehlungsDaten>('/referral/mein-code'),
          apiClient.get<StatistikDaten>('/referral/statistik'),
        ]);
        setDaten(codeDaten);
        setStatistik(statDaten);
      } catch (error) {
        setFehler(
          error instanceof Error
            ? error.message
            : 'Fehler beim Laden der Empfehlungsdaten.',
        );
      } finally {
        setLadend(false);
      }
    };

    laden();
  }, [istAdmin]);

  const empfehlungsLink = daten
    ? `https://vereinbase.de/registrieren?ref=${daten.code}`
    : '';

  const handleCodeKopieren = async () => {
    if (!daten) return;
    try {
      await navigator.clipboard.writeText(daten.code);
      setCodeKopiert(true);
      setTimeout(() => setCodeKopiert(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleLinkKopieren = async () => {
    if (!empfehlungsLink) return;
    try {
      await navigator.clipboard.writeText(empfehlungsLink);
      setLinkKopiert(true);
      setTimeout(() => setLinkKopiert(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!istAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Empfehlungsprogramm</h1>
            <p className="text-muted-foreground">
              Nur Administratoren koennen das Empfehlungsprogramm verwalten.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/einstellungen" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Einstellungen
      </Link>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Gift className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Empfehlungsprogramm</h1>
          <p className="text-muted-foreground">
            Empfehlen Sie Vereinbase weiter und erhalten Sie Gratismonate
          </p>
        </div>
      </div>

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {fehler}
        </div>
      )}

      {ladend ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Empfehlungscode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Ihr Empfehlungscode
              </CardTitle>
              <CardDescription>
                Teilen Sie diesen Code mit anderen Vereinen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-center">
                  <span className="text-3xl font-bold tracking-widest text-primary">
                    {daten?.code || '---'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCodeKopieren}
                  className="shrink-0"
                >
                  {codeKopiert ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                  <span className="ml-2">
                    {codeKopiert ? 'Kopiert!' : 'Kopieren'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Teilbarer Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Teilbarer Link
              </CardTitle>
              <CardDescription>
                Senden Sie diesen Link direkt an interessierte Vereine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  value={empfehlungsLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleLinkKopieren}
                  className="shrink-0"
                >
                  {linkKopiert ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                  <span className="ml-2">
                    {linkKopiert ? 'Kopiert!' : 'Kopieren'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistik */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Statistik
              </CardTitle>
              <CardDescription>
                Uebersicht ueber Ihre Empfehlungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {statistik?.empfohleneVereine ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Empfohlene Vereine
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {statistik?.freiMonate ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Verdiente Gratismonate
                  </div>
                </div>
              </div>

              {statistik && statistik.empfehlungen.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Empfehlungsverlauf</h3>
                  <div className="space-y-1">
                    {statistik.empfehlungen.map((empfehlung) => (
                      <div
                        key={empfehlung.nr}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <Badge variant="secondary" className="shrink-0">
                          #{empfehlung.nr}
                        </Badge>
                        <span className="text-muted-foreground">
                          Verein erfolgreich empfohlen
                        </span>
                        <Award className="h-4 w-4 text-green-600 ml-auto shrink-0" />
                        <span className="text-sm text-green-600 font-medium">
                          +1 Monat
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Erklaerung */}
          <Card>
            <CardHeader>
              <CardTitle>So funktioniert das Empfehlungsprogramm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Code teilen</p>
                    <p className="text-sm text-muted-foreground">
                      Teilen Sie Ihren persoenlichen Empfehlungscode oder den
                      Registrierungslink mit anderen Vereinen.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Verein registriert sich</p>
                    <p className="text-sm text-muted-foreground">
                      Der neue Verein gibt bei der Registrierung Ihren
                      Empfehlungscode ein.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Beide profitieren</p>
                    <p className="text-sm text-muted-foreground">
                      Beide Vereine erhalten 1 Monat gratis. Je mehr Vereine
                      Sie empfehlen, desto mehr Gratismonate sammeln Sie!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
