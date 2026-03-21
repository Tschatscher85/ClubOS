'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Coins,
  Plus,
  Target,
  Clock,
  Users,
  Heart,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

// ==================== Typen ====================

interface FundingSpende {
  id: string;
  betrag: number;
  spenderName: string | null;
  anonym: boolean;
  nachricht: string | null;
  erstelltAm: string;
}

interface FundingProjekt {
  id: string;
  tenantId: string;
  titel: string;
  beschreibung: string;
  bildUrl: string | null;
  zielBetrag: number;
  aktuellerBetrag: number;
  laufzeitBis: string;
  sichtbarkeit: 'MITGLIEDER' | 'OEFFENTLICH';
  status: 'AKTIV' | 'ERREICHT' | 'ABGELAUFEN' | 'GESCHLOSSEN';
  erstelltVon: string;
  erstelltAm: string;
  spenden: FundingSpende[];
  _count: { spenden: number };
}

// ==================== Hilfsfunktionen ====================

function fortschrittProzent(aktuell: number, ziel: number): number {
  if (ziel <= 0) return 0;
  return Math.min(100, Math.round((aktuell / ziel) * 100));
}

function restlicheTage(laufzeitBis: string): number {
  const diff = new Date(laufzeitBis).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function statusFarbe(status: string): string {
  switch (status) {
    case 'AKTIV':
      return 'bg-green-100 text-green-800';
    case 'ERREICHT':
      return 'bg-blue-100 text-blue-800';
    case 'ABGELAUFEN':
      return 'bg-yellow-100 text-yellow-800';
    case 'GESCHLOSSEN':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'AKTIV':
      return 'Aktiv';
    case 'ERREICHT':
      return 'Ziel erreicht';
    case 'ABGELAUFEN':
      return 'Abgelaufen';
    case 'GESCHLOSSEN':
      return 'Geschlossen';
    default:
      return status;
  }
}

// ==================== Seite ====================

export default function FundingPage() {
  const benutzer = useBenutzer();
  const istAdmin =
    benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  const [projekte, setProjekte] = useState<FundingProjekt[]>([]);
  const [laden, setLaden] = useState(true);
  const [neuesProjektDialog, setNeuesProjektDialog] = useState(false);
  const [spendenDialog, setSpendenDialog] = useState<FundingProjekt | null>(null);
  const [detailDialog, setDetailDialog] = useState<FundingProjekt | null>(null);

  // Formular-State: Neues Projekt
  const [npTitel, setNpTitel] = useState('');
  const [npBeschreibung, setNpBeschreibung] = useState('');
  const [npZielBetrag, setNpZielBetrag] = useState('');
  const [npLaufzeitBis, setNpLaufzeitBis] = useState('');
  const [npSichtbarkeit, setNpSichtbarkeit] = useState<'MITGLIEDER' | 'OEFFENTLICH'>('MITGLIEDER');
  const [npLaden, setNpLaden] = useState(false);

  // Formular-State: Spende
  const [spBetrag, setSpBetrag] = useState('');
  const [spName, setSpName] = useState('');
  const [spNachricht, setSpNachricht] = useState('');
  const [spAnonym, setSpAnonym] = useState(false);
  const [spLaden, setSpLaden] = useState(false);

  const laden_ = useCallback(async () => {
    try {
      const data = await apiClient.get<FundingProjekt[]>('/funding');
      setProjekte(data);
    } catch {
      // Fehler still ignorieren
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    laden_();
  }, [laden_]);

  const projektErstellen = async () => {
    if (!npTitel || !npBeschreibung || !npZielBetrag || !npLaufzeitBis) return;
    setNpLaden(true);
    try {
      await apiClient.post('/funding', {
        titel: npTitel,
        beschreibung: npBeschreibung,
        zielBetrag: parseFloat(npZielBetrag),
        laufzeitBis: npLaufzeitBis,
        sichtbarkeit: npSichtbarkeit,
      });
      setNeuesProjektDialog(false);
      setNpTitel('');
      setNpBeschreibung('');
      setNpZielBetrag('');
      setNpLaufzeitBis('');
      setNpSichtbarkeit('MITGLIEDER');
      laden_();
    } catch {
      // Fehler
    } finally {
      setNpLaden(false);
    }
  };

  const spendeAbgeben = async () => {
    if (!spendenDialog || !spBetrag) return;
    setSpLaden(true);
    try {
      await apiClient.post(`/funding/${spendenDialog.id}/spenden`, {
        betrag: parseFloat(spBetrag),
        spenderName: spAnonym ? undefined : spName || undefined,
        anonym: spAnonym,
        nachricht: spNachricht || undefined,
      });
      setSpendenDialog(null);
      setSpBetrag('');
      setSpName('');
      setSpNachricht('');
      setSpAnonym(false);
      laden_();
    } catch {
      // Fehler
    } finally {
      setSpLaden(false);
    }
  };

  const projektLoeschen = async (id: string) => {
    if (!confirm('Projekt wirklich schliessen/loeschen?')) return;
    try {
      await apiClient.delete(`/funding/${id}`);
      laden_();
    } catch {
      // Fehler
    }
  };

  const detailLaden = async (projekt: FundingProjekt) => {
    try {
      const data = await apiClient.get<FundingProjekt>(`/funding/${projekt.id}`);
      setDetailDialog(data);
    } catch {
      setDetailDialog(projekt);
    }
  };

  if (laden) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coins className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Crowdfunding</h1>
            <p className="text-muted-foreground">
              Vereinsprojekte gemeinsam finanzieren
            </p>
          </div>
        </div>
        {istAdmin && (
          <Button onClick={() => setNeuesProjektDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Projekt
          </Button>
        )}
      </div>

      {/* Projekte Grid */}
      {projekte.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Coins className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Projekte vorhanden</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {istAdmin
                ? 'Erstellen Sie das erste Crowdfunding-Projekt fuer Ihren Verein.'
                : 'Derzeit sind keine Crowdfunding-Projekte aktiv.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projekte.map((projekt) => {
            const prozent = fortschrittProzent(
              projekt.aktuellerBetrag,
              projekt.zielBetrag,
            );
            const tage = restlicheTage(projekt.laufzeitBis);

            return (
              <Card
                key={projekt.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => detailLaden(projekt)}
              >
                {projekt.bildUrl && (
                  <div className="h-40 bg-muted overflow-hidden">
                    <img
                      src={projekt.bildUrl}
                      alt={projekt.titel}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {projekt.titel}
                    </h3>
                    <Badge className={statusFarbe(projekt.status)}>
                      {statusLabel(projekt.status)}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {projekt.beschreibung}
                  </p>

                  {/* Fortschrittsbalken */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {projekt.aktuellerBetrag.toFixed(2)} EUR
                      </span>
                      <span className="text-muted-foreground">
                        von {projekt.zielBetrag.toFixed(2)} EUR
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${prozent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-primary">
                        {prozent}% erreicht
                      </span>
                      <span>{projekt._count.spenden} Spenden</span>
                    </div>
                  </div>

                  {/* Info-Zeile */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tage > 0 ? `${tage} Tage` : 'Abgelaufen'}
                    </div>
                    <div className="flex items-center gap-1">
                      {projekt.sichtbarkeit === 'OEFFENTLICH' ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Oeffentlich
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Nur Mitglieder
                        </>
                      )}
                    </div>
                  </div>

                  {/* Aktions-Buttons */}
                  <div className="flex gap-2">
                    {projekt.status === 'AKTIV' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSpendenDialog(projekt);
                        }}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Spenden
                      </Button>
                    )}
                    {istAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          projektLoeschen(projekt.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Neues Projekt */}
      <Dialog open={neuesProjektDialog} onOpenChange={setNeuesProjektDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neues Crowdfunding-Projekt</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Projekt, das vom Verein gemeinsam
              finanziert wird.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={npTitel}
                onChange={(e) => setNpTitel(e.target.value)}
                placeholder="z.B. Neue Trikots fuer die A-Jugend"
              />
            </div>
            <div>
              <Label>Beschreibung *</Label>
              <Textarea
                value={npBeschreibung}
                onChange={(e) => setNpBeschreibung(e.target.value)}
                placeholder="Beschreiben Sie das Projekt und wofuer die Mittel verwendet werden..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Zielbetrag (EUR) *</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={npZielBetrag}
                  onChange={(e) => setNpZielBetrag(e.target.value)}
                  placeholder="500.00"
                />
              </div>
              <div>
                <Label>Laufzeit bis *</Label>
                <Input
                  type="date"
                  value={npLaufzeitBis}
                  onChange={(e) => setNpLaufzeitBis(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div>
              <Label>Sichtbarkeit</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="sichtbarkeit"
                    checked={npSichtbarkeit === 'MITGLIEDER'}
                    onChange={() => setNpSichtbarkeit('MITGLIEDER')}
                  />
                  <EyeOff className="h-4 w-4" />
                  Nur Mitglieder
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="sichtbarkeit"
                    checked={npSichtbarkeit === 'OEFFENTLICH'}
                    onChange={() => setNpSichtbarkeit('OEFFENTLICH')}
                  />
                  <Eye className="h-4 w-4" />
                  Oeffentlich
                </label>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={projektErstellen}
              disabled={npLaden || !npTitel || !npBeschreibung || !npZielBetrag || !npLaufzeitBis}
            >
              {npLaden ? 'Erstelle...' : 'Projekt erstellen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Spende */}
      <Dialog
        open={!!spendenDialog}
        onOpenChange={() => setSpendenDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Spende fuer &quot;{spendenDialog?.titel}&quot;
            </DialogTitle>
            <DialogDescription>
              Unterstuetzen Sie dieses Projekt mit einer Spende.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Betrag (EUR) *</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={spBetrag}
                onChange={(e) => setSpBetrag(e.target.value)}
                placeholder="25.00"
              />
            </div>
            <div>
              <Label>Ihr Name (optional)</Label>
              <Input
                value={spName}
                onChange={(e) => setSpName(e.target.value)}
                placeholder="Max Mustermann"
                disabled={spAnonym}
              />
            </div>
            <div>
              <Label>Nachricht (optional)</Label>
              <Textarea
                value={spNachricht}
                onChange={(e) => setSpNachricht(e.target.value)}
                placeholder="Viel Erfolg mit dem Projekt!"
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={spAnonym}
                onChange={(e) => setSpAnonym(e.target.checked)}
              />
              Anonym spenden
            </label>
            <Button
              className="w-full"
              onClick={spendeAbgeben}
              disabled={spLaden || !spBetrag || parseFloat(spBetrag) <= 0}
            >
              {spLaden ? 'Wird gespendet...' : `${spBetrag ? parseFloat(spBetrag).toFixed(2) : '0.00'} EUR spenden`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detail */}
      <Dialog
        open={!!detailDialog}
        onOpenChange={() => setDetailDialog(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {detailDialog.titel}
                </DialogTitle>
                <DialogDescription>
                  {detailDialog.beschreibung}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Fortschritt */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>
                      {detailDialog.aktuellerBetrag.toFixed(2)} EUR gesammelt
                    </span>
                    <span>
                      Ziel: {detailDialog.zielBetrag.toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${fortschrittProzent(detailDialog.aktuellerBetrag, detailDialog.zielBetrag)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {fortschrittProzent(
                        detailDialog.aktuellerBetrag,
                        detailDialog.zielBetrag,
                      )}
                      % erreicht
                    </span>
                    <span>
                      {restlicheTage(detailDialog.laufzeitBis)} Tage verbleibend
                    </span>
                  </div>
                </div>

                {/* Infos */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Target className="h-5 w-5 mx-auto text-primary mb-1" />
                      <div className="text-lg font-bold">
                        {detailDialog.zielBetrag.toFixed(0)} EUR
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Zielbetrag
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                      <div className="text-lg font-bold">
                        {detailDialog._count?.spenden || detailDialog.spenden.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Spender
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
                      <div className="text-lg font-bold">
                        {restlicheTage(detailDialog.laufzeitBis)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tage uebrig
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Spenden-Liste */}
                <div>
                  <h3 className="font-semibold mb-3">Spenden</h3>
                  {detailDialog.spenden.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Noch keine Spenden vorhanden.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {detailDialog.spenden.map((spende) => (
                        <div
                          key={spende.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {spende.anonym
                                ? 'Anonym'
                                : spende.spenderName || 'Anonym'}
                            </div>
                            {spende.nachricht && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                &quot;{spende.nachricht}&quot;
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">
                              {spende.betrag.toFixed(2)} EUR
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(spende.erstelltAm).toLocaleDateString(
                                'de-DE',
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Spenden-Button */}
                {detailDialog.status === 'AKTIV' && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setDetailDialog(null);
                      setSpendenDialog(detailDialog);
                    }}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Jetzt spenden
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
