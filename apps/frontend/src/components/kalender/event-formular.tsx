'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { apiClient } from '@/lib/api-client';
import { AdressSuche } from './adress-suche';

interface Team {
  id: string;
  name: string;
  sport: string;
}

interface Halle {
  id: string;
  name: string;
  adresse: string | null;
}

interface EventData {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  location: string;
  untergrund: string | null;
  teamId: string;
  notes: string | null;
  halleId?: string | null;
}

interface EventFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  event?: EventData | null;
}

const EVENT_TYPEN = [
  { wert: 'TRAINING', label: 'Training' },
  { wert: 'MATCH', label: 'Spiel' },
  { wert: 'TOURNAMENT', label: 'Turnier' },
  { wert: 'TRIP', label: 'Ausflug' },
  { wert: 'MEETING', label: 'Besprechung' },
];

const UNTERGRUND_TYPEN = [
  { wert: '', label: '-- Kein Untergrund --' },
  { wert: 'HALLE', label: 'Halle' },
  { wert: 'RASEN', label: 'Rasen' },
  { wert: 'KUNSTRASEN', label: 'Kunstrasen' },
  { wert: 'ASCHE', label: 'Asche' },
  { wert: 'HARTPLATZ', label: 'Hartplatz' },
  { wert: 'TARTANBAHN', label: 'Tartanbahn' },
  { wert: 'SCHWIMMBAD', label: 'Schwimmbad' },
  { wert: 'SONSTIGES', label: 'Sonstiges' },
];

export function EventFormular({
  offen,
  onSchliessen,
  onGespeichert,
  event,
}: EventFormularProps) {
  const istBearbeitung = !!event;
  const [titel, setTitel] = useState('');
  const [typ, setTyp] = useState('TRAINING');
  const [datum, setDatum] = useState('');
  const [endDatum, setEndDatum] = useState('');
  const [ort, setOrt] = useState('');
  const [untergrund, setUntergrund] = useState('');
  const [halleId, setHalleId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [notizen, setNotizen] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [hallen, setHallen] = useState<Halle[]>([]);

  // Wiederholung
  const [istWiederkehrend, setIstWiederkehrend] = useState(false);
  const [wiederholung, setWiederholung] = useState('WEEKLY');
  const [wiederholungTage, setWiederholungTage] = useState<string[]>([]);
  const [wiederholungEnde, setWiederholungEnde] = useState('');

  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  // Daten laden
  useEffect(() => {
    if (!offen) return;

    Promise.all([
      apiClient.get<Team[]>('/teams').catch(() => []),
      apiClient.get<Halle[]>('/hallen').catch(() => []),
    ]).then(([teamDaten, hallenDaten]) => {
      setTeams(teamDaten);
      setHallen(hallenDaten);
      if (!teamId && teamDaten.length > 0) {
        setTeamId(teamDaten[0].id);
      }
    });

    // Felder setzen bei Bearbeitung
    if (event) {
      setTitel(event.title || '');
      setTyp(event.type || 'TRAINING');
      setDatum(event.date ? event.date.slice(0, 16) : '');
      setEndDatum(event.endDate ? event.endDate.slice(0, 16) : '');
      setOrt(event.location || '');
      setUntergrund(event.untergrund || '');
      setTeamId(event.teamId || '');
      setNotizen(event.notes || '');
      setHalleId(event.halleId || '');
    } else {
      setTitel('');
      setTyp('TRAINING');
      setDatum('');
      setEndDatum('');
      setOrt('');
      setUntergrund('');
      setNotizen('');
      setHalleId('');
      setIstWiederkehrend(false);
      setWiederholung('WEEKLY');
      setWiederholungTage([]);
      setWiederholungEnde('');
    }
    setFehler('');
  }, [offen, event]);

  // Wenn Halle ausgewaehlt wird, Adresse und Untergrund uebernehmen
  const handleHalleAendern = (id: string) => {
    setHalleId(id);
    if (id) {
      const halle = hallen.find((h) => h.id === id);
      if (halle) {
        setOrt(halle.adresse || halle.name);
        if (!untergrund) setUntergrund('HALLE');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    try {
      const daten = {
        titel,
        typ,
        datum: new Date(datum).toISOString(),
        ...(endDatum && { endDatum: new Date(endDatum).toISOString() }),
        ort,
        ...(untergrund && { untergrund }),
        ...(halleId && { halleId }),
        teamId,
        ...(notizen && { notizen }),
        ...(istWiederkehrend && {
          wiederholung,
          wiederholungTage,
          wiederholungEnde: wiederholungEnde
            ? new Date(wiederholungEnde).toISOString()
            : undefined,
        }),
      };

      if (istBearbeitung && event) {
        await apiClient.put(`/veranstaltungen/${event.id}`, daten);
      } else {
        await apiClient.post('/veranstaltungen', daten);
      }

      onGespeichert();
      onSchliessen();
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Speichern.',
      );
    } finally {
      setLadend(false);
    }
  };

  return (
    <Dialog open={offen} onOpenChange={onSchliessen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {istBearbeitung
              ? 'Veranstaltung bearbeiten'
              : 'Neue Veranstaltung'}
          </DialogTitle>
          <DialogDescription>
            Training, Spiel oder andere Veranstaltung planen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="titel">Titel *</Label>
            <Input
              id="titel"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="z.B. Training Dienstag"
              required
            />
          </div>

          {/* Typ + Team */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typ">Typ</Label>
              <Select
                id="typ"
                value={typ}
                onChange={(e) => setTyp(e.target.value)}
              >
                {EVENT_TYPEN.map((t) => (
                  <option key={t.wert} value={t.wert}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Datum & Uhrzeit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="datum">Datum & Uhrzeit *</Label>
              <Input
                id="datum"
                type="datetime-local"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDatum">Ende</Label>
              <Input
                id="endDatum"
                type="datetime-local"
                value={endDatum}
                onChange={(e) => setEndDatum(e.target.value)}
              />
            </div>
          </div>

          {/* Wiederholung */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={istWiederkehrend}
                onChange={(e) => setIstWiederkehrend(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">
                Wiederkehrendes Event
              </span>
            </label>
          </div>

          {istWiederkehrend && (
            <div className="space-y-4 rounded-md border p-4">
              <div className="space-y-2">
                <Label htmlFor="wiederholung">Wiederholung</Label>
                <Select
                  id="wiederholung"
                  value={wiederholung}
                  onChange={(e) => setWiederholung(e.target.value)}
                >
                  <option value="DAILY">Taeglich</option>
                  <option value="WEEKLY">Woechentlich</option>
                  <option value="BIWEEKLY">Alle 2 Wochen</option>
                  <option value="MONTHLY">Monatlich</option>
                </Select>
              </div>

              {(wiederholung === 'WEEKLY' || wiederholung === 'BIWEEKLY') && (
                <div className="space-y-2">
                  <Label>Wochentage</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { wert: 'MO', label: 'Mo' },
                      { wert: 'DI', label: 'Di' },
                      { wert: 'MI', label: 'Mi' },
                      { wert: 'DO', label: 'Do' },
                      { wert: 'FR', label: 'Fr' },
                      { wert: 'SA', label: 'Sa' },
                      { wert: 'SO', label: 'So' },
                    ].map((tag) => (
                      <label
                        key={tag.wert}
                        className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                          wiederholungTage.includes(tag.wert)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={wiederholungTage.includes(tag.wert)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWiederholungTage([
                                ...wiederholungTage,
                                tag.wert,
                              ]);
                            } else {
                              setWiederholungTage(
                                wiederholungTage.filter((t) => t !== tag.wert),
                              );
                            }
                          }}
                          className="sr-only"
                        />
                        {tag.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="wiederholungEnde">Wiederholen bis</Label>
                <Input
                  id="wiederholungEnde"
                  type="date"
                  value={wiederholungEnde}
                  onChange={(e) => setWiederholungEnde(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Ort aus Belegung oder freie Eingabe */}
          {hallen.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="halleId">Ort (aus Belegung)</Label>
              <Select
                id="halleId"
                value={halleId}
                onChange={(e) => handleHalleAendern(e.target.value)}
              >
                <option value="">-- Freie Adresseingabe --</option>
                {hallen.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                    {h.adresse ? ` (${h.adresse})` : ''}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Adresse mit Suche */}
          <div className="space-y-2">
            <Label htmlFor="ort">Adresse *</Label>
            <AdressSuche
              id="ort"
              value={ort}
              onChange={setOrt}
              placeholder="Adresse suchen (z.B. Jahnhalle, Musterstadt)"
              required
            />
          </div>

          {/* Untergrund */}
          <div className="space-y-2">
            <Label htmlFor="untergrund">Untergrund</Label>
            <Select
              id="untergrund"
              value={untergrund}
              onChange={(e) => setUntergrund(e.target.value)}
            >
              {UNTERGRUND_TYPEN.map((u) => (
                <option key={u.wert} value={u.wert}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Notizen */}
          <div className="space-y-2">
            <Label htmlFor="notizen">Notizen</Label>
            <Input
              id="notizen"
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
              placeholder="Bitte Schienbeinschoner mitbringen"
            />
          </div>

          {fehler && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {fehler}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onSchliessen}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={ladend}>
              {ladend
                ? 'Speichern...'
                : istBearbeitung
                  ? 'Aktualisieren'
                  : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
