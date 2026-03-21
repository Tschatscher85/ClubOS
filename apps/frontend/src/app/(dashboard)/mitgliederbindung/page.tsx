'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  UserX,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

// ==================== Typen ====================

interface MitgliedTeam {
  id: string;
  name: string;
}

interface RisikoFaktoren {
  anwesenheit: { score: number; details: string };
  inaktivitaet: { score: number; letzteAnwesenheit: string | null };
  alter: { score: number; alter: number | null };
  beitrag: { score: number; details: string };
}

interface MitgliedRisiko {
  mitglied: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    teams: MitgliedTeam[];
  };
  score: number;
  ampel: 'gruen' | 'gelb' | 'rot';
  faktoren: RisikoFaktoren;
  vorschlag?: string;
}

// ==================== Hilfsfunktionen ====================

function ampelFarbe(ampel: 'gruen' | 'gelb' | 'rot'): string {
  switch (ampel) {
    case 'rot':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'gelb':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'gruen':
      return 'bg-green-100 text-green-800 border-green-200';
  }
}

function ampelLabel(ampel: 'gruen' | 'gelb' | 'rot'): string {
  switch (ampel) {
    case 'rot':
      return 'Kritisch';
    case 'gelb':
      return 'Auffaellig';
    case 'gruen':
      return 'Stabil';
  }
}

function scoreBalkenFarbe(score: number): string {
  if (score > 60) return 'bg-red-500';
  if (score >= 30) return 'bg-amber-500';
  return 'bg-green-500';
}

function alterBerechnen(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// ==================== Komponenten ====================

function ZusammenfassungKarten({
  gruen,
  gelb,
  rot,
}: {
  gruen: number;
  gelb: number;
  rot: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stabil</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{gruen}</div>
          <p className="text-xs text-muted-foreground">Kein Handlungsbedarf</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auffaellig</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{gelb}</div>
          <p className="text-xs text-muted-foreground">Im Auge behalten</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kritisch</CardTitle>
          <UserX className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{rot}</div>
          <p className="text-xs text-muted-foreground">Sofort handeln</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Hauptkomponente ====================

export default function MitgliederbindungPage() {
  const [daten, setDaten] = useState<MitgliedRisiko[]>([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);

  // Dialog-State
  const [dialogOffen, setDialogOffen] = useState(false);
  const [vorschlagLadend, setVorschlagLadend] = useState(false);
  const [vorschlagText, setVorschlagText] = useState('');
  const [vorschlagMitglied, setVorschlagMitglied] = useState<string>('');

  const datenLaden = useCallback(async () => {
    try {
      setLadend(true);
      const ergebnis = await apiClient.get<MitgliedRisiko[]>('/mitgliederbindung');
      setDaten(ergebnis);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const vorschlagLaden = async (mitgliedId: string, name: string) => {
    setVorschlagMitglied(name);
    setVorschlagText('');
    setDialogOffen(true);
    setVorschlagLadend(true);

    try {
      const ergebnis = await apiClient.get<{ vorschlag: string }>(
        `/mitgliederbindung/${mitgliedId}/vorschlag`,
      );
      setVorschlagText(ergebnis.vorschlag);
    } catch (err) {
      setVorschlagText(
        err instanceof Error ? err.message : 'Vorschlag konnte nicht geladen werden.',
      );
    } finally {
      setVorschlagLadend(false);
    }
  };

  // Zaehler berechnen
  const zaehler = { gruen: 0, gelb: 0, rot: 0 };
  for (const eintrag of daten) {
    zaehler[eintrag.ampel]++;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Mitgliederbindung
        </h1>
        <p className="text-muted-foreground">
          Churn Prevention — Mitglieder im Blick behalten und fruehzeitig
          handeln
        </p>
      </div>

      {/* Fehler */}
      {fehler && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{fehler}</p>
          </CardContent>
        </Card>
      )}

      {/* Lade-Zustand */}
      {ladend ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-12 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    <div className="flex-1 h-2 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Zusammenfassung */}
          <ZusammenfassungKarten
            gruen={zaehler.gruen}
            gelb={zaehler.gelb}
            rot={zaehler.rot}
          />

          {/* Tabelle */}
          {daten.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">Alles im gruenen Bereich</p>
                <p className="text-sm text-muted-foreground">
                  Keine aktiven Mitglieder mit Kuendigungsrisiko gefunden.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Risiko-Uebersicht ({daten.length} Mitglieder)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Alter</th>
                        <th className="pb-3 font-medium">Teams</th>
                        <th className="pb-3 font-medium w-48">Score</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Faktoren</th>
                        <th className="pb-3 font-medium text-right">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {daten.map((eintrag) => {
                        const alter = alterBerechnen(
                          eintrag.mitglied.birthDate,
                        );
                        return (
                          <tr key={eintrag.mitglied.id} className="hover:bg-muted/50">
                            <td className="py-3 font-medium">
                              {eintrag.mitglied.firstName}{' '}
                              {eintrag.mitglied.lastName}
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {alter !== null ? `${alter} J.` : '—'}
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                {eintrag.mitglied.teams.length > 0
                                  ? eintrag.mitglied.teams.map((t) => (
                                      <Badge
                                        key={t.id}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {t.name}
                                      </Badge>
                                    ))
                                  : <span className="text-muted-foreground">—</span>}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-muted">
                                  <div
                                    className={`h-2 rounded-full transition-all ${scoreBalkenFarbe(eintrag.score)}`}
                                    style={{
                                      width: `${eintrag.score}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-mono w-8 text-right">
                                  {eintrag.score}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge
                                className={ampelFarbe(eintrag.ampel)}
                              >
                                {ampelLabel(eintrag.ampel)}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                                {eintrag.faktoren.anwesenheit.score > 0 && (
                                  <span
                                    title={eintrag.faktoren.anwesenheit.details}
                                    className="cursor-help underline decoration-dotted"
                                  >
                                    Anw. {eintrag.faktoren.anwesenheit.score}
                                  </span>
                                )}
                                {eintrag.faktoren.inaktivitaet.score > 0 && (
                                  <span className="cursor-help">
                                    Inakt. {eintrag.faktoren.inaktivitaet.score}
                                  </span>
                                )}
                                {eintrag.faktoren.alter.score > 10 && (
                                  <span>
                                    Alter {eintrag.faktoren.alter.score}
                                  </span>
                                )}
                                {eintrag.faktoren.beitrag.score > 0 && (
                                  <span
                                    title={eintrag.faktoren.beitrag.details}
                                    className="cursor-help underline decoration-dotted text-red-600"
                                  >
                                    Beitrag {eintrag.faktoren.beitrag.score}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {eintrag.ampel === 'rot' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                      vorschlagLaden(
                                        eintrag.mitglied.id,
                                        `${eintrag.mitglied.firstName} ${eintrag.mitglied.lastName}`,
                                      )
                                    }
                                  >
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    KI-Vorschlag
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  asChild
                                >
                                  <a href="/nachrichten">
                                    <MessageSquare className="h-3 w-3" />
                                  </a>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* KI-Vorschlag Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>KI-Kontaktvorschlag</DialogTitle>
            <DialogDescription>
              Persoenlicher Ansprache-Text fuer {vorschlagMitglied}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {vorschlagLadend ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>KI generiert Vorschlag...</span>
              </div>
            ) : (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {vorschlagText}
                </p>
              </div>
            )}
          </div>
          {!vorschlagLadend && vorschlagText && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(vorschlagText);
                }}
              >
                Kopieren
              </Button>
              <Button size="sm" asChild>
                <a href="/nachrichten">Nachricht senden</a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
