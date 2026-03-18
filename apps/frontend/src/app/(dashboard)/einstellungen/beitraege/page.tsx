'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Beitragsklasse {
  id: string;
  name: string;
  beschreibung: string | null;
  betrag: number;
  intervall: string;
  sportarten: string[];
  altersVon: number | null;
  altersBis: number | null;
  istAktiv: boolean;
  sortierung: number;
}

const INTERVALL_LABEL: Record<string, string> = {
  MONATLICH: 'Monatlich',
  QUARTALSWEISE: 'Quartalsweise',
  HALBJAEHRLICH: 'Halbjaehrlich',
  JAEHRLICH: 'Jaehrlich',
};

const SPORTARTEN = [
  'FUSSBALL', 'HANDBALL', 'BASKETBALL', 'FOOTBALL',
  'TENNIS', 'TURNEN', 'SCHWIMMEN', 'LEICHTATHLETIK', 'SONSTIGES',
];

const SPORTARTEN_LABEL: Record<string, string> = {
  FUSSBALL: 'Fussball', HANDBALL: 'Handball', BASKETBALL: 'Basketball',
  FOOTBALL: 'Football', TENNIS: 'Tennis', TURNEN: 'Turnen',
  SCHWIMMEN: 'Schwimmen', LEICHTATHLETIK: 'Leichtathletik', SONSTIGES: 'Sonstiges',
};

const formatBetrag = (betrag: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(betrag);
};

export default function BeitraegePage() {
  const { benutzer } = useAuth();
  const [klassen, setKlassen] = useState<Beitragsklasse[]>([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');

  // Dialog-State
  const [dialogOffen, setDialogOffen] = useState(false);
  const [bearbeitungsKlasse, setBearbeitungsKlasse] = useState<Beitragsklasse | null>(null);

  // Formular-Felder
  const [formName, setFormName] = useState('');
  const [formBeschreibung, setFormBeschreibung] = useState('');
  const [formBetrag, setFormBetrag] = useState('');
  const [formIntervall, setFormIntervall] = useState('MONATLICH');
  const [formSportarten, setFormSportarten] = useState<string[]>([]);
  const [formAltersVon, setFormAltersVon] = useState('');
  const [formAltersBis, setFormAltersBis] = useState('');
  const [speichernd, setSpeichernd] = useState(false);

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  const laden = async () => {
    setLadend(true);
    try {
      const result = await apiClient.get<Beitragsklasse[]>('/beitragsklassen');
      setKlassen(result);
    } catch {
      setFehler('Fehler beim Laden der Beitragsklassen.');
    } finally {
      setLadend(false);
    }
  };

  useEffect(() => {
    laden();
  }, []);

  const dialogOeffnen = (klasse?: Beitragsklasse) => {
    if (klasse) {
      setBearbeitungsKlasse(klasse);
      setFormName(klasse.name);
      setFormBeschreibung(klasse.beschreibung || '');
      setFormBetrag(klasse.betrag.toString());
      setFormIntervall(klasse.intervall);
      setFormSportarten(klasse.sportarten);
      setFormAltersVon(klasse.altersVon?.toString() || '');
      setFormAltersBis(klasse.altersBis?.toString() || '');
    } else {
      setBearbeitungsKlasse(null);
      setFormName('');
      setFormBeschreibung('');
      setFormBetrag('');
      setFormIntervall('MONATLICH');
      setFormSportarten([]);
      setFormAltersVon('');
      setFormAltersBis('');
    }
    setDialogOffen(true);
  };

  const handleSportartToggle = (sportart: string) => {
    setFormSportarten((prev) =>
      prev.includes(sportart)
        ? prev.filter((s) => s !== sportart)
        : [...prev, sportart],
    );
  };

  const handleSpeichern = async () => {
    if (!formName || !formBetrag) return;
    setSpeichernd(true);
    setFehler('');

    try {
      const daten = {
        name: formName,
        beschreibung: formBeschreibung || undefined,
        betrag: parseFloat(formBetrag),
        intervall: formIntervall,
        sportarten: formSportarten,
        altersVon: formAltersVon ? parseInt(formAltersVon) : undefined,
        altersBis: formAltersBis ? parseInt(formAltersBis) : undefined,
      };

      if (bearbeitungsKlasse) {
        await apiClient.put(`/beitragsklassen/${bearbeitungsKlasse.id}`, daten);
      } else {
        await apiClient.post('/beitragsklassen', daten);
      }

      setDialogOffen(false);
      laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    } finally {
      setSpeichernd(false);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Beitragsklasse wirklich loeschen? Zugewiesene Mitglieder verlieren ihre Zuordnung.')) return;
    try {
      await apiClient.delete(`/beitragsklassen/${id}`);
      laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Loeschen.');
    }
  };

  const handleAktivToggle = async (klasse: Beitragsklasse) => {
    try {
      await apiClient.put(`/beitragsklassen/${klasse.id}`, {
        istAktiv: !klasse.istAktiv,
      });
      laden();
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Fehler beim Aktualisieren.');
    }
  };

  const formatiereAltersbereich = (von: number | null, bis: number | null) => {
    if (von !== null && bis !== null) return `${von}-${bis} Jahre`;
    if (von !== null) return `Ab ${von} Jahre`;
    if (bis !== null) return `Bis ${bis} Jahre`;
    return 'Alle Alter';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/einstellungen">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurueck
            </Button>
          </Link>
          <CreditCard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Beitragsklassen</h1>
            <p className="text-muted-foreground">
              Verwalten Sie die Beitragsklassen Ihres Vereins
            </p>
          </div>
        </div>
        {istAdmin && (
          <Button onClick={() => dialogOeffnen()}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Klasse
          </Button>
        )}
      </div>

      {fehler && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{fehler}</div>
      )}

      {ladend ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="animate-pulse text-muted-foreground">Beitragsklassen werden geladen...</div>
        </div>
      ) : klassen.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Beitragsklassen</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Beitragsklassen, um Mitgliedsbeitraege zu verwalten.
            </p>
            {istAdmin && (
              <Button onClick={() => dialogOeffnen()}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Klasse erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {klassen.map((klasse) => (
            <Card
              key={klasse.id}
              className={!klasse.istAktiv ? 'opacity-60' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{klasse.name}</CardTitle>
                    {klasse.beschreibung && (
                      <CardDescription className="mt-1">
                        {klasse.beschreibung}
                      </CardDescription>
                    )}
                  </div>
                  {istAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dialogOeffnen(klasse)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoeschen(klasse.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Betrag + Intervall */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {formatBetrag(klasse.betrag)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {INTERVALL_LABEL[klasse.intervall] || klasse.intervall}
                  </span>
                </div>

                {/* Sportarten als Badges */}
                {klasse.sportarten.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {klasse.sportarten.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {SPORTARTEN_LABEL[s] || s}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Altersbereich */}
                <div className="text-sm text-muted-foreground">
                  {formatiereAltersbereich(klasse.altersVon, klasse.altersBis)}
                </div>

                {/* Aktiv/Inaktiv Toggle */}
                {istAdmin && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleAktivToggle(klasse)}
                    >
                      {klasse.istAktiv ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Neue Klasse / Bearbeiten */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bearbeitungsKlasse ? 'Beitragsklasse bearbeiten' : 'Neue Beitragsklasse'}
            </DialogTitle>
            <DialogDescription>
              {bearbeitungsKlasse
                ? `${bearbeitungsKlasse.name} bearbeiten`
                : 'Erstellen Sie eine neue Beitragsklasse fuer Ihren Verein'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="bk-name">Name *</Label>
              <Input
                id="bk-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="z.B. Jugend Fussball"
              />
            </div>

            {/* Beschreibung */}
            <div className="space-y-2">
              <Label htmlFor="bk-beschreibung">Beschreibung</Label>
              <Input
                id="bk-beschreibung"
                value={formBeschreibung}
                onChange={(e) => setFormBeschreibung(e.target.value)}
                placeholder="Optionale Beschreibung"
              />
            </div>

            {/* Betrag + Intervall */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bk-betrag">Betrag (EUR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    &euro;
                  </span>
                  <Input
                    id="bk-betrag"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formBetrag}
                    onChange={(e) => setFormBetrag(e.target.value)}
                    placeholder="0,00"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bk-intervall">Intervall *</Label>
                <Select
                  id="bk-intervall"
                  value={formIntervall}
                  onChange={(e) => setFormIntervall(e.target.value)}
                >
                  <option value="MONATLICH">Monatlich</option>
                  <option value="QUARTALSWEISE">Quartalsweise</option>
                  <option value="HALBJAEHRLICH">Halbjaehrlich</option>
                  <option value="JAEHRLICH">Jaehrlich</option>
                </Select>
              </div>
            </div>

            {/* Sportarten */}
            <div className="space-y-2">
              <Label>Sportarten</Label>
              <p className="text-xs text-muted-foreground">
                Fuer welche Sportarten gilt diese Beitragsklasse? (Keine Auswahl = alle)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPORTARTEN.map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      formSportarten.includes(s)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formSportarten.includes(s)}
                      onChange={() => handleSportartToggle(s)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{SPORTARTEN_LABEL[s]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Altersbereich */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bk-altersVon">Alter von</Label>
                <Input
                  id="bk-altersVon"
                  type="number"
                  min="0"
                  max="99"
                  value={formAltersVon}
                  onChange={(e) => setFormAltersVon(e.target.value)}
                  placeholder="z.B. 6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bk-altersBis">Alter bis</Label>
                <Input
                  id="bk-altersBis"
                  type="number"
                  min="0"
                  max="99"
                  value={formAltersBis}
                  onChange={(e) => setFormAltersBis(e.target.value)}
                  placeholder="z.B. 18"
                />
              </div>
            </div>

            {/* Aktionen */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSpeichern}
                disabled={!formName || !formBetrag || speichernd}
              >
                {speichernd
                  ? 'Wird gespeichert...'
                  : bearbeitungsKlasse
                    ? 'Aktualisieren'
                    : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
