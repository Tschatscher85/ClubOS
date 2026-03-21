'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  Users,
  MessageSquare,
  Wallet,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

// ==================== Typen ====================

interface KategorieDetails {
  score: number;
  details: Record<string, unknown>;
}

interface GesundheitsBericht {
  score: number;
  bewertung: 'Ausgezeichnet' | 'Gut' | 'Verbesserungswuerdig' | 'Kritisch';
  kategorien: {
    mitglieder: KategorieDetails;
    aktivitaet: KategorieDetails;
    kommunikation: KategorieDetails;
    finanzen: KategorieDetails;
  };
  empfehlungen: string[];
  zeitraum: { von: string; bis: string };
}

// ==================== Score-Kreis Komponente ====================

function ScoreKreis({ score, groesse = 180 }: { score: number; groesse?: number }) {
  const radius = (groesse - 20) / 2;
  const umfang = 2 * Math.PI * radius;
  const fortschritt = (score / 100) * umfang;
  const mittelpunkt = groesse / 2;

  const farbe =
    score >= 80
      ? '#22c55e'
      : score >= 60
        ? '#eab308'
        : score >= 40
          ? '#f97316'
          : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={groesse} height={groesse} className="-rotate-90">
        <circle
          cx={mittelpunkt}
          cy={mittelpunkt}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/20"
          strokeWidth={10}
        />
        <circle
          cx={mittelpunkt}
          cy={mittelpunkt}
          r={radius}
          fill="none"
          stroke={farbe}
          strokeWidth={10}
          strokeDasharray={umfang}
          strokeDashoffset={umfang - fortschritt}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color: farbe }}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">von 100</span>
      </div>
    </div>
  );
}

// ==================== Fortschrittsbalken ====================

function Fortschrittsbalken({
  wert,
  max,
  label,
}: {
  wert: number;
  max: number;
  label: string;
}) {
  const prozent = max > 0 ? (wert / max) * 100 : 0;
  const farbe =
    prozent >= 80
      ? 'bg-green-500'
      : prozent >= 60
        ? 'bg-yellow-500'
        : prozent >= 40
          ? 'bg-orange-500'
          : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">
          {wert}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${farbe}`}
          style={{ width: `${Math.min(prozent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ==================== Kategorie-Karte ====================

function KategorieKarte({
  titel,
  icon: Icon,
  kategorie,
  renderDetails,
}: {
  titel: string;
  icon: typeof Users;
  kategorie: KategorieDetails;
  renderDetails: (details: Record<string, unknown>) => React.ReactNode;
}) {
  const [offen, setOffen] = useState(false);

  const farbKlasse =
    kategorie.score >= 20
      ? 'text-green-600'
      : kategorie.score >= 15
        ? 'text-yellow-600'
        : kategorie.score >= 8
          ? 'text-orange-600'
          : 'text-red-600';

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setOffen(!offen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{titel}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${farbKlasse}`}>
              {kategorie.score}
            </span>
            <span className="text-sm text-muted-foreground">/25</span>
            {offen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <Fortschrittsbalken wert={kategorie.score} max={25} label="" />
      </CardHeader>
      {offen && (
        <CardContent className="border-t pt-4">
          {renderDetails(kategorie.details)}
        </CardContent>
      )}
    </Card>
  );
}

// ==================== Hauptseite ====================

export default function GesundheitscheckPage() {
  const [bericht, setBericht] = useState<GesundheitsBericht | null>(null);
  const [fehler, setFehler] = useState('');
  const [laed, setLaed] = useState(true);

  useEffect(() => {
    const laden = async () => {
      try {
        const daten = await apiClient.get<GesundheitsBericht>('/gesundheitscheck');
        setBericht(daten);
      } catch (e) {
        setFehler(e instanceof Error ? e.message : 'Fehler beim Laden');
      } finally {
        setLaed(false);
      }
    };
    laden();
  }, []);

  if (laed) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Vereins-Gesundheitscheck</h1>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-muted-foreground">Analyse wird durchgefuehrt...</span>
        </div>
      </div>
    );
  }

  if (fehler) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Vereins-Gesundheitscheck</h1>
        <Card>
          <CardContent className="py-10 text-center text-red-600">
            {fehler}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bericht) return null;

  const bewertungFarbe: Record<string, string> = {
    Ausgezeichnet: 'bg-green-100 text-green-800',
    Gut: 'bg-yellow-100 text-yellow-800',
    Verbesserungswuerdig: 'bg-orange-100 text-orange-800',
    Kritisch: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vereins-Gesundheitscheck</h1>
          <p className="text-muted-foreground">
            Analyse-Zeitraum: {bericht.zeitraum.von} bis {bericht.zeitraum.bis}
          </p>
        </div>
      </div>

      {/* Score-Uebersicht */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <ScoreKreis score={bericht.score} />
            <Badge
              className={`text-sm px-4 py-1 ${bewertungFarbe[bericht.bewertung] || 'bg-gray-100'}`}
              variant="secondary"
            >
              {bericht.bewertung}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Kategorie-Karten */}
      <div className="grid gap-4 md:grid-cols-2">
        <KategorieKarte
          titel="Mitglieder"
          icon={Users}
          kategorie={bericht.kategorien.mitglieder}
          renderDetails={(d) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{d.aktiveMitglieder as number}</p>
                  <p className="text-xs text-muted-foreground">Aktive Mitglieder</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-1">
                    {(d.wachstumsRate as number) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <p className="text-2xl font-bold">{d.wachstumsRate as number}%</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Wachstumsrate</p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <span className="text-green-600">
                  +{d.neueLetzte3Monate as number} Neue
                </span>
                <span className="text-red-600">
                  -{d.abgaengeLetzte3Monate as number} Abgaenge
                </span>
              </div>
            </div>
          )}
        />

        <KategorieKarte
          titel="Aktivitaet"
          icon={Activity}
          kategorie={bericht.kategorien.aktivitaet}
          renderDetails={(d) => (
            <div className="space-y-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">
                  {d.durchschnittlicheAnwesenheit as number}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Durchschnittliche Anwesenheit
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <span>{d.anzahlEvents as number} Events</span>
                <span>{d.anzahlTeamsMitDaten as number} Teams erfasst</span>
              </div>
              {(d.teamsUnter50Prozent as string[])?.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-orange-600 mb-1">
                    Teams unter 50% Anwesenheit:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {(d.teamsUnter50Prozent as string[]).map((team) => (
                      <li key={team}>{team}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        />

        <KategorieKarte
          titel="Kommunikation"
          icon={MessageSquare}
          kategorie={bericht.kategorien.kommunikation}
          renderDetails={(d) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{d.pushQuote as number}%</p>
                  <p className="text-xs text-muted-foreground">Push-Quote</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {d.nachrichtenLetzte3Monate as number}
                  </p>
                  <p className="text-xs text-muted-foreground">Nachrichten (3 Mon.)</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {d.pushAktiviert as number} von {d.aktiveMitglieder as number} Mitgliedern
                haben Push aktiviert
              </p>
            </div>
          )}
        />

        <KategorieKarte
          titel="Finanzen & Ehrenamt"
          icon={Wallet}
          kategorie={bericht.kategorien.finanzen}
          renderDetails={(d) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {d.ehrenamtStundenGesamt as number}h
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ehrenamt-Stunden gesamt
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{d.aktiveSportarten as number}</p>
                  <p className="text-xs text-muted-foreground">Aktive Sportarten</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Ehrenamt-Aufgaben:{' '}
                  {(d.ehrenamtAufgaben as { abgeschlossen: number; gesamt: number })
                    ?.abgeschlossen ?? 0}{' '}
                  von{' '}
                  {(d.ehrenamtAufgaben as { abgeschlossen: number; gesamt: number })
                    ?.gesamt ?? 0}{' '}
                  abgeschlossen
                </p>
                <p>
                  Stunden letzte 3 Monate: {d.stundenLetzte3Monate as number}h
                </p>
              </div>
            </div>
          )}
        />
      </div>

      {/* Empfehlungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Empfehlungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {bericht.empfehlungen.map((empfehlung, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed">{empfehlung}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
