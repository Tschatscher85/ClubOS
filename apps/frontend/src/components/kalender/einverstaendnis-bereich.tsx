'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, FileCheck, Plus, Copy, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

interface MitgliedKurz {
  id: string;
  firstName: string;
  lastName: string;
  parentEmail: string | null;
}

interface Antwort {
  id: string;
  mitgliedId: string;
  elternName: string;
  zugestimmt: boolean;
  beantwortetAm: string;
  member: MitgliedKurz;
}

interface EinverstaendnisData {
  id: string;
  titel: string;
  inhalt: string;
  erstelltAm: string;
  antworten: Antwort[];
}

interface TokenData {
  mitgliedId: string;
  vorname: string;
  nachname: string;
  parentEmail: string | null;
  token: string;
}

interface EinverstaendnisBereichProps {
  eventId: string;
  istAdmin: boolean;
}

export function EinverstaendnisBereich({ eventId, istAdmin }: EinverstaendnisBereichProps) {
  const [einverstaendnisse, setEinverstaendnisse] = useState<EinverstaendnisData[]>([]);
  const [teamMitglieder, setTeamMitglieder] = useState<MitgliedKurz[]>([]);
  const [ladend, setLadend] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [titel, setTitel] = useState('');
  const [inhalt, setInhalt] = useState('');
  const [erstellenLadend, setErstellenLadend] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [tokensOffen, setTokensOffen] = useState(false);
  const [tokensLadend, setTokensLadend] = useState(false);
  const [kopierErfolg, setKopierErfolg] = useState('');

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<{
        einverstaendnisse: EinverstaendnisData[];
        teamMitglieder: MitgliedKurz[];
      }>(`/einverstaendnis/event/${eventId}`);
      setEinverstaendnisse(daten.einverstaendnisse || []);
      setTeamMitglieder(daten.teamMitglieder || []);
    } catch {
      // Noch keine vorhanden
    } finally {
      setLadend(false);
    }
  }, [eventId]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleErstellen = async () => {
    if (!titel.trim() || !inhalt.trim()) return;
    setErstellenLadend(true);
    try {
      await apiClient.post('/einverstaendnis', {
        eventId,
        titel: titel.trim(),
        inhalt: inhalt.trim(),
      });
      setDialogOffen(false);
      setTitel('');
      setInhalt('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setErstellenLadend(false);
    }
  };

  const handleTokensGenerieren = async (einverstaendnisId: string) => {
    setTokensLadend(true);
    try {
      const result = await apiClient.post<TokenData[]>(
        `/einverstaendnis/${einverstaendnisId}/tokens`,
        {},
      );
      setTokens(result);
      setTokensOffen(true);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setTokensLadend(false);
    }
  };

  const handleLinkKopieren = (token: string) => {
    const url = `${window.location.origin}/einverstaendnis/${token}`;
    navigator.clipboard.writeText(url);
    setKopierErfolg(token);
    setTimeout(() => setKopierErfolg(''), 2000);
  };

  if (ladend) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Einverstaendniserklaerungen
          </CardTitle>
          {istAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOffen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Erstellen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {einverstaendnisse.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Einverstaendniserklaerung fuer dieses Event erstellt.
          </p>
        ) : (
          einverstaendnisse.map((ev) => {
            const beantwortet = ev.antworten.length;
            const gesamt = teamMitglieder.length;
            const zugestimmt = ev.antworten.filter((a) => a.zugestimmt).length;
            const abgelehnt = ev.antworten.filter((a) => !a.zugestimmt).length;

            return (
              <div key={ev.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{ev.titel}</h4>
                  <Badge variant="outline">
                    {beantwortet}/{gesamt} erhalten
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{ev.inhalt}</p>

                {/* Statistik */}
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {zugestimmt} zugestimmt
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    {abgelehnt} abgelehnt
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {gesamt - beantwortet} ausstehend
                  </span>
                </div>

                {/* Mitglieder-Status */}
                <div className="space-y-1">
                  {teamMitglieder.map((m) => {
                    const antwort = ev.antworten.find((a) => a.mitgliedId === m.id);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between py-1.5 border-b last:border-0"
                      >
                        <span className="text-sm">
                          {m.firstName} {m.lastName}
                        </span>
                        {antwort ? (
                          <div className="flex items-center gap-2">
                            {antwort.zugestimmt ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Zugestimmt
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                <XCircle className="h-3 w-3 mr-1" />
                                Abgelehnt
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              ({antwort.elternName})
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Ausstehend
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Token-Links generieren */}
                {istAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTokensGenerieren(ev.id)}
                    disabled={tokensLadend}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    {tokensLadend ? 'Generiere...' : 'Eltern-Links generieren'}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>

      {/* Dialog: Neue Einverstaendniserklaerung */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einverstaendniserklaerung erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="z.B. Einverstaendnis Ausflug Europapark"
              />
            </div>
            <div className="space-y-2">
              <Label>Inhalt / Text der Erklaerung</Label>
              <Textarea
                value={inhalt}
                onChange={(e) => setInhalt(e.target.value)}
                placeholder="Hiermit erklaere ich mich einverstanden, dass mein Kind..."
                rows={6}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleErstellen}
                disabled={!titel.trim() || !inhalt.trim() || erstellenLadend}
              >
                {erstellenLadend ? 'Wird erstellt...' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Token-Links */}
      <Dialog open={tokensOffen} onOpenChange={setTokensOffen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Eltern-Links</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Senden Sie diese Links an die Eltern. Jeder Link ist einzigartig pro Mitglied.
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto pt-2">
            {tokens.map((t) => (
              <div
                key={t.mitgliedId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <p className="text-sm font-medium">
                    {t.vorname} {t.nachname}
                  </p>
                  {t.parentEmail && (
                    <p className="text-xs text-muted-foreground">{t.parentEmail}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkKopieren(t.token)}
                >
                  {kopierErfolg === t.token ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
