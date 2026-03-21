'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Users,
  ShoppingCart,
  Wallet,
  CheckCircle2,
  Circle,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

// ==================== Interfaces ====================

interface FestHelfer {
  id: string;
  mitgliedId: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface FestSchicht {
  id: string;
  name: string;
  startZeit: string | null;
  endZeit: string | null;
  maxHelfer: number;
  helfer: FestHelfer[];
}

interface FestEinkauf {
  id: string;
  artikel: string;
  menge: string | null;
  kauftEin: string | null;
  erledigt: boolean;
}

interface FestKasseEintrag {
  id: string;
  typ: 'EINNAHME' | 'AUSGABE';
  betrag: number;
  beschreibung: string;
  erstelltAm: string;
}

interface FestKasseResult {
  eintraege: FestKasseEintrag[];
  einnahmen: number;
  ausgaben: number;
  saldo: number;
}

// ==================== Komponente ====================

interface VereinsfestPlanerProps {
  eventId: string;
}

export function VereinsfestPlaner({ eventId }: VereinsfestPlanerProps) {
  const benutzer = useBenutzer();
  const istAdmin = benutzer && ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  // Schichten
  const [schichten, setSchichten] = useState<FestSchicht[]>([]);
  const [schichtDialog, setSchichtDialog] = useState(false);
  const [neueSchicht, setNeueSchicht] = useState({ name: '', startZeit: '', endZeit: '', maxHelfer: '3' });
  const [schichtLadend, setSchichtLadend] = useState(false);

  // Einkauf
  const [einkaeufe, setEinkaeufe] = useState<FestEinkauf[]>([]);
  const [neuerArtikel, setNeuerArtikel] = useState('');
  const [neueMenge, setNeueMenge] = useState('');

  // Kasse
  const [kasse, setKasse] = useState<FestKasseResult>({ eintraege: [], einnahmen: 0, ausgaben: 0, saldo: 0 });
  const [kasseDialog, setKasseDialog] = useState(false);
  const [neueBuchung, setNeueBuchung] = useState({ typ: 'EINNAHME' as 'EINNAHME' | 'AUSGABE', betrag: '', beschreibung: '' });

  const [ladend, setLadend] = useState(true);

  // ==================== Daten laden ====================

  const datenLaden = useCallback(async () => {
    try {
      const [schichtenData, einkaufData, kasseData] = await Promise.all([
        apiClient.get<FestSchicht[]>(`/fest/${eventId}/schichten`),
        apiClient.get<FestEinkauf[]>(`/fest/${eventId}/einkauf`),
        apiClient.get<FestKasseResult>(`/fest/${eventId}/kasse`),
      ]);
      setSchichten(schichtenData);
      setEinkaeufe(einkaufData);
      setKasse(kasseData);
    } catch (error) {
      console.error('Fehler beim Laden der Fest-Daten:', error);
    } finally {
      setLadend(false);
    }
  }, [eventId]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  // ==================== Schichten Handler ====================

  const handleSchichtErstellen = async () => {
    if (!neueSchicht.name.trim()) return;
    setSchichtLadend(true);
    try {
      await apiClient.post(`/fest/${eventId}/schichten`, {
        name: neueSchicht.name,
        startZeit: neueSchicht.startZeit || undefined,
        endZeit: neueSchicht.endZeit || undefined,
        maxHelfer: parseInt(neueSchicht.maxHelfer, 10) || 3,
      });
      setNeueSchicht({ name: '', startZeit: '', endZeit: '', maxHelfer: '3' });
      setSchichtDialog(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setSchichtLadend(false);
    }
  };

  const handleSchichtLoeschen = async (id: string) => {
    if (!confirm('Schicht wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/fest/schicht/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleSchichtEintragen = async (schichtId: string) => {
    try {
      await apiClient.post(`/fest/schicht/${schichtId}/eintragen`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleSchichtAustragen = async (schichtId: string) => {
    try {
      await apiClient.delete(`/fest/schicht/${schichtId}/austragen`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // ==================== Einkauf Handler ====================

  const handleEinkaufErstellen = async () => {
    if (!neuerArtikel.trim()) return;
    try {
      await apiClient.post(`/fest/${eventId}/einkauf`, {
        artikel: neuerArtikel,
        menge: neueMenge || undefined,
      });
      setNeuerArtikel('');
      setNeueMenge('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleEinkaufToggle = async (id: string, erledigt: boolean) => {
    try {
      await apiClient.put(`/fest/einkauf/${id}`, { erledigt: !erledigt });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleEinkaufPerson = async (id: string, kauftEin: string) => {
    try {
      await apiClient.put(`/fest/einkauf/${id}`, { kauftEin });
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleEinkaufLoeschen = async (id: string) => {
    try {
      await apiClient.delete(`/fest/einkauf/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // ==================== Kasse Handler ====================

  const handleKasseErstellen = async () => {
    if (!neueBuchung.beschreibung.trim() || !neueBuchung.betrag) return;
    try {
      await apiClient.post(`/fest/${eventId}/kasse`, {
        typ: neueBuchung.typ,
        betrag: parseFloat(neueBuchung.betrag),
        beschreibung: neueBuchung.beschreibung,
      });
      setNeueBuchung({ typ: 'EINNAHME', betrag: '', beschreibung: '' });
      setKasseDialog(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleKasseLoeschen = async (id: string) => {
    if (!confirm('Buchung wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/fest/kasse/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // ==================== Render ====================

  if (ladend) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="animate-pulse text-muted-foreground text-sm">
            Vereinsfest-Planer wird geladen...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        Vereinsfest-Planer
      </h2>

      {/* ==================== Schichtplan ==================== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Schichtplan
            </CardTitle>
            {istAdmin && (
              <Button size="sm" variant="outline" onClick={() => setSchichtDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Neue Schicht
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schichten.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Schichten angelegt.
            </p>
          ) : (
            <div className="space-y-3">
              {schichten.map((s) => (
                <div
                  key={s.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{s.name}</span>
                      {(s.startZeit || s.endZeit) && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {s.startZeit && s.endZeit
                            ? `${s.startZeit} - ${s.endZeit}`
                            : s.startZeit
                              ? `ab ${s.startZeit}`
                              : `bis ${s.endZeit}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={s.helfer.length >= s.maxHelfer ? 'default' : 'outline'}
                        className={s.helfer.length >= s.maxHelfer ? 'bg-green-600' : ''}
                      >
                        {s.helfer.length}/{s.maxHelfer} Helfer
                      </Badge>
                      {istAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => handleSchichtLoeschen(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Helfer-Liste */}
                  {s.helfer.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {s.helfer.map((h) => (
                        <Badge key={h.id} variant="secondary" className="text-xs">
                          {h.member.firstName} {h.member.lastName}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Eintragen/Austragen */}
                  {s.helfer.length < s.maxHelfer ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleSchichtEintragen(s.id)}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Eintragen
                    </Button>
                  ) : null}
                  {s.helfer.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground"
                      onClick={() => handleSchichtAustragen(s.id)}
                    >
                      <UserMinus className="h-3.5 w-3.5 mr-1" />
                      Austragen
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schicht erstellen Dialog */}
      <Dialog open={schichtDialog} onOpenChange={setSchichtDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Schicht</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                value={neueSchicht.name}
                onChange={(e) => setNeueSchicht({ ...neueSchicht, name: e.target.value })}
                placeholder="z.B. Theke, Grill, Aufbau..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Startzeit</Label>
                <Input
                  type="time"
                  value={neueSchicht.startZeit}
                  onChange={(e) => setNeueSchicht({ ...neueSchicht, startZeit: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Endzeit</Label>
                <Input
                  type="time"
                  value={neueSchicht.endZeit}
                  onChange={(e) => setNeueSchicht({ ...neueSchicht, endZeit: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max. Helfer</Label>
              <Input
                type="number"
                min="1"
                value={neueSchicht.maxHelfer}
                onChange={(e) => setNeueSchicht({ ...neueSchicht, maxHelfer: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSchichtErstellen}
                disabled={!neueSchicht.name.trim() || schichtLadend}
                size="sm"
              >
                {schichtLadend ? 'Erstellen...' : 'Schicht erstellen'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSchichtDialog(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Einkaufsliste ==================== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Einkaufsliste
            {einkaeufe.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({einkaeufe.filter((e) => e.erledigt).length}/{einkaeufe.length} erledigt)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {einkaeufe.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Noch keine Artikel auf der Einkaufsliste.
            </p>
          )}

          {einkaeufe.map((e) => (
            <div
              key={e.id}
              className={`flex items-center gap-3 py-2 border-b last:border-0 ${e.erledigt ? 'opacity-50' : ''}`}
            >
              <button
                onClick={() => handleEinkaufToggle(e.id, e.erledigt)}
                className="flex-shrink-0"
              >
                {e.erledigt ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${e.erledigt ? 'line-through' : ''}`}>
                  {e.artikel}
                </span>
                {e.menge && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({e.menge})
                  </span>
                )}
              </div>
              <Input
                className="w-28 h-7 text-xs"
                placeholder="Wer kauft?"
                defaultValue={e.kauftEin || ''}
                onBlur={(ev) => handleEinkaufPerson(e.id, ev.target.value)}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive flex-shrink-0"
                onClick={() => handleEinkaufLoeschen(e.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {/* Neuen Artikel hinzufuegen */}
          <div className="flex gap-2 pt-1">
            <Input
              className="flex-1 h-8 text-sm"
              placeholder="Neuer Artikel..."
              value={neuerArtikel}
              onChange={(e) => setNeuerArtikel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEinkaufErstellen();
              }}
            />
            <Input
              className="w-28 h-8 text-sm"
              placeholder="Menge"
              value={neueMenge}
              onChange={(e) => setNeueMenge(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEinkaufErstellen();
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={handleEinkaufErstellen}
              disabled={!neuerArtikel.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ==================== Kassen-Abrechnung ==================== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Kassen-Abrechnung
            </CardTitle>
            {istAdmin && (
              <Button size="sm" variant="outline" onClick={() => setKasseDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Neue Buchung
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {kasse.eintraege.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Buchungen vorhanden.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                {kasse.eintraege.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {e.typ === 'EINNAHME' ? (
                        <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className="text-sm">{e.beschreibung}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${e.typ === 'EINNAHME' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {e.typ === 'EINNAHME' ? '+' : '-'}{e.betrag.toFixed(2)} EUR
                      </span>
                      {istAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => handleKasseLoeschen(e.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Zusammenfassung */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gesamteinnahmen</span>
                  <span className="text-green-600 font-medium">
                    +{kasse.einnahmen.toFixed(2)} EUR
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gesamtausgaben</span>
                  <span className="text-red-600 font-medium">
                    -{kasse.ausgaben.toFixed(2)} EUR
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-1">
                  <span>Ueberschuss</span>
                  <span className={kasse.saldo >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {kasse.saldo >= 0 ? '+' : ''}{kasse.saldo.toFixed(2)} EUR
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Buchung erstellen Dialog */}
      <Dialog open={kasseDialog} onOpenChange={setKasseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Buchung</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Typ *</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={neueBuchung.typ === 'EINNAHME' ? 'default' : 'outline'}
                  className={neueBuchung.typ === 'EINNAHME' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setNeueBuchung({ ...neueBuchung, typ: 'EINNAHME' })}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Einnahme
                </Button>
                <Button
                  size="sm"
                  variant={neueBuchung.typ === 'AUSGABE' ? 'default' : 'outline'}
                  className={neueBuchung.typ === 'AUSGABE' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setNeueBuchung({ ...neueBuchung, typ: 'AUSGABE' })}
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Ausgabe
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Betrag (EUR) *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={neueBuchung.betrag}
                onChange={(e) => setNeueBuchung({ ...neueBuchung, betrag: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Beschreibung *</Label>
              <Input
                value={neueBuchung.beschreibung}
                onChange={(e) => setNeueBuchung({ ...neueBuchung, beschreibung: e.target.value })}
                placeholder="z.B. Getraenkeeinkauf, Eintritt, ..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleKasseErstellen}
                disabled={!neueBuchung.beschreibung.trim() || !neueBuchung.betrag}
                size="sm"
              >
                Buchung erstellen
              </Button>
              <Button variant="outline" size="sm" onClick={() => setKasseDialog(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
