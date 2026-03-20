'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BarChart3, Clock, Users, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/lib/constants';

interface Statistik {
  option: string;
  anzahl: number;
  prozent: number;
}

interface UmfragePublic {
  id: string;
  frage: string;
  optionen: string[];
  endetAm: string | null;
  erstelltAm: string;
  teamName: string | null;
  gesamtStimmen: number;
  statistiken: Statistik[];
  abgelaufen: boolean;
}

const FARBEN = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export default function OeffentlicheUmfragePage() {
  const params = useParams();
  const token = params.token as string;

  const [umfrage, setUmfrage] = useState<UmfragePublic | null>(null);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [hatAbgestimmt, setHatAbgestimmt] = useState(false);
  const [abstimmend, setAbstimmend] = useState(false);

  useEffect(() => {
    const laden = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/umfragen/token/${token}`);
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Umfrage konnte nicht geladen werden.');
        }
        const data = await response.json();
        setUmfrage(data);
      } catch (err) {
        setFehler(
          err instanceof Error
            ? err.message
            : 'Umfrage konnte nicht geladen werden.',
        );
      } finally {
        setLadend(false);
      }
    };
    laden();
  }, [token]);

  const handleAbstimmen = async (option: string) => {
    if (!name.trim()) return;
    setAbstimmend(true);
    try {
      const response = await fetch(`${API_BASE_URL}/umfragen/token/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option, name: name.trim() }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Fehler beim Abstimmen.');
      }

      setHatAbgestimmt(true);

      // Ergebnisse neu laden
      const neueDaten = await fetch(
        `${API_BASE_URL}/umfragen/token/${token}`,
      );
      if (neueDaten.ok) {
        setUmfrage(await neueDaten.json());
      }
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Fehler beim Abstimmen.',
      );
    } finally {
      setAbstimmend(false);
    }
  };

  if (ladend) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">
          Umfrage wird geladen...
        </div>
      </div>
    );
  }

  if (fehler) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-bold mb-2">Umfrage nicht verfuegbar</h2>
            <p className="text-muted-foreground">{fehler}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!umfrage) return null;

  return (
    <div className="min-h-screen bg-muted/30 p-6 flex items-start justify-center">
      <Card className="max-w-lg w-full mt-8">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Vereinbase Umfrage</span>
          </div>
          <CardTitle className="text-xl">{umfrage.frage}</CardTitle>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            {umfrage.teamName && (
              <Badge variant="outline">{umfrage.teamName}</Badge>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {umfrage.gesamtStimmen} {umfrage.gesamtStimmen === 1 ? 'Stimme' : 'Stimmen'}
            </span>
            {umfrage.endetAm && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {umfrage.abgelaufen
                  ? 'Abgelaufen'
                  : `Endet am ${new Date(umfrage.endetAm).toLocaleDateString('de-DE')}`}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hatAbgestimmt || umfrage.abgelaufen ? (
            <>
              {/* Ergebnis-Ansicht */}
              {hatAbgestimmt && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium text-green-800">
                    Danke fuer deine Stimme!
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {umfrage.statistiken.map((stat, idx) => (
                  <div key={stat.option} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stat.option}</span>
                      <span className="text-muted-foreground">
                        {stat.anzahl} ({stat.prozent}%)
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${FARBEN[idx % FARBEN.length]}`}
                        style={{ width: `${stat.prozent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Abstimmungs-Ansicht */}
              <div className="space-y-2">
                <Label>Dein Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name eingeben..."
                />
              </div>

              <div className="space-y-2">
                {umfrage.optionen.map((option, idx) => (
                  <button
                    key={option}
                    onClick={() => handleAbstimmen(option)}
                    disabled={!name.trim() || abstimmend}
                    className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                      !name.trim()
                        ? 'opacity-50 cursor-not-allowed border-muted'
                        : 'cursor-pointer hover:border-primary hover:bg-primary/5 hover:shadow-sm border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${FARBEN[idx % FARBEN.length]}`}
                      />
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {!name.trim() && (
                <p className="text-sm text-muted-foreground text-center">
                  Bitte gib deinen Namen ein, um abzustimmen.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
