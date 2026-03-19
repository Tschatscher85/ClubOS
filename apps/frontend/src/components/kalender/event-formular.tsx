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
import { sportartenLaden, sportartenFallback } from '@/lib/sportarten';
import { veranstaltungstypenLaden, veranstaltungstypenFallback } from '@/lib/veranstaltungstypen';
import type { VeranstaltungsTyp } from '@/lib/veranstaltungstypen';

interface Team {
  id: string;
  name: string;
  sport: string;
  abteilungId?: string;
}

interface Abteilung {
  id: string;
  name: string;
  sport: string;
  teams: { id: string; name: string; ageGroup: string }[];
}

interface Halle {
  id: string;
  name: string;
  adresse: string | null;
  untergruende?: string[];
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
  hallName?: string | null;
  hallAddress?: string | null;
}

interface EventFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  event?: EventData | null;
}

// Wird dynamisch aus der API geladen

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
  const [hallenName, setHallenName] = useState('');
  const [hallenAdresse, setHallenAdresse] = useState('');
  const [teamId, setTeamId] = useState('');
  const [notizen, setNotizen] = useState('');

  // Abteilung -> Team Filter
  const [abteilungen, setAbteilungen] = useState<Abteilung[]>([]);
  const [abteilungId, setAbteilungId] = useState('');
  const [gefilterteTeams, setGefilterteTeams] = useState<{ id: string; name: string }[]>([]);

  // Sportstaetten (Hallen/Plaetze aus Vereins-Einstellungen)
  const [hallen, setHallen] = useState<Halle[]>([]);
  // Dynamische Veranstaltungstypen
  const [eventTypen, setEventTypen] = useState<VeranstaltungsTyp[]>(veranstaltungstypenFallback());

  // Wiederholung
  const [istWiederkehrend, setIstWiederkehrend] = useState(false);
  const [wiederholung, setWiederholung] = useState('WEEKLY');
  const [wiederholungTage, setWiederholungTage] = useState<string[]>([]);
  const [wiederholungEnde, setWiederholungEnde] = useState('');

  // Turnier-spezifisch
  const [turnierSportart, setTurnierSportart] = useState('FUSSBALL');
  const [turnierFormat, setTurnierFormat] = useState('GRUPPE');
  const [sportartenOptionen, setSportartenOptionen] = useState(sportartenFallback());

  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  const istTurnier = typ === 'TOURNAMENT';

  // Daten laden
  useEffect(() => {
    if (!offen) return;

    Promise.all([
      apiClient.get<Abteilung[]>('/abteilungen').catch(() => []),
      apiClient.get<Halle[]>('/hallen').catch(() => []),
    ]).then(([abtDaten, hallenDaten]) => {
      setAbteilungen(abtDaten);
      setHallen(hallenDaten);

      // Alle Teams aus Abteilungen flach machen
      const alleTeams = abtDaten.flatMap((a) =>
        (a.teams || []).map((t) => ({ ...t, abteilungId: a.id })),
      );
      if (!abteilungId && abtDaten.length > 0) {
        setAbteilungId(abtDaten[0].id);
        const teams = abtDaten[0].teams || [];
        setGefilterteTeams(teams);
        if (!teamId && teams.length > 0) {
          setTeamId(teams[0].id);
        }
      } else if (alleTeams.length > 0 && !teamId) {
        setGefilterteTeams(alleTeams);
        setTeamId(alleTeams[0].id);
      }
    });

    veranstaltungstypenLaden().then(setEventTypen).catch(() => {});

    sportartenLaden().then((daten) => {
      setSportartenOptionen(
        daten.map((s) => ({
          wert: s.istVordefiniert ? s.name.toUpperCase().replace(/[^A-Z]/g, '') || s.name : s.name,
          label: s.name,
        })),
      );
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
      setHallenName(event.hallName || '');
      setHallenAdresse(event.hallAddress || '');
    } else {
      setTitel('');
      setTyp('TRAINING');
      setDatum('');
      setEndDatum('');
      setOrt('');
      setUntergrund('');
      setNotizen('');
      setHallenName('');
      setHallenAdresse('');
      setIstWiederkehrend(false);
      setWiederholung('WEEKLY');
      setWiederholungTage([]);
      setWiederholungEnde('');
      setTurnierSportart('FUSSBALL');
      setTurnierFormat('GRUPPE');
    }
    setFehler('');
  }, [offen, event]);

  // Abteilung wechseln -> Teams filtern
  const handleAbteilungWechsel = (neuId: string) => {
    setAbteilungId(neuId);
    if (!neuId) {
      // Alle Teams zeigen
      const alle = abteilungen.flatMap((a) => a.teams || []);
      setGefilterteTeams(alle);
      return;
    }
    const abt = abteilungen.find((a) => a.id === neuId);
    const teams = abt?.teams || [];
    setGefilterteTeams(teams);
    if (teams.length > 0 && !teams.find((t) => t.id === teamId)) {
      setTeamId(teams[0].id);
    }
  };

  // Ausgewaehlte Sportstaette (fuer Untergrund-Filterung)
  const [ausgewaehlteHalle, setAusgewaehlteHalle] = useState<Halle | null>(null);

  // Sportstaette auswaehlen -> Adresse + Untergrund uebernehmen
  const handleSportstaetteAendern = (halleId: string) => {
    if (!halleId) {
      setHallenName('');
      setHallenAdresse('');
      setAusgewaehlteHalle(null);
      return;
    }
    const halle = hallen.find((h) => h.id === halleId);
    if (halle) {
      setHallenName(halle.name);
      setHallenAdresse(halle.adresse || '');
      setOrt(halle.adresse || halle.name);
      setAusgewaehlteHalle(halle);
      // Ersten Untergrund der Sportstaette vorauswaehlen
      if (halle.untergruende && halle.untergruende.length > 0) {
        setUntergrund(halle.untergruende[0]);
      } else {
        setUntergrund('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    try {
      // Bei Turnier: erst Turnier anlegen
      if (istTurnier && !istBearbeitung) {
        await apiClient.post('/turniere', {
          name: titel,
          sportart: turnierSportart,
          format: turnierFormat,
        });
      }

      const daten = {
        titel,
        typ,
        datum: new Date(datum).toISOString(),
        ...(endDatum && { endDatum: new Date(endDatum).toISOString() }),
        ort,
        ...(hallenName && { hallenName }),
        ...(hallenAdresse && { hallenAdresse }),
        ...(untergrund && { untergrund }),
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
            {istBearbeitung ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung'}
          </DialogTitle>
          <DialogDescription>
            Training, Spiel, Turnier oder andere Veranstaltung planen
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
              placeholder="z.B. Training Dienstag, Sommerfest, Heimspiel vs. TSV"
              required
            />
          </div>

          {/* Typ */}
          <div className="space-y-2">
            <Label htmlFor="typ">Art der Veranstaltung</Label>
            <Select id="typ" value={typ} onChange={(e) => setTyp(e.target.value)}>
              {eventTypen.map((t) => (
                <option key={t.wert} value={t.wert}>{t.label}</option>
              ))}
            </Select>
          </div>

          {/* Turnier-spezifische Felder */}
          {istTurnier && !istBearbeitung && (
            <div className="space-y-4 rounded-md border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-medium text-purple-800">
                Turnier-Einstellungen (Spielplan, Livescoring & oeffentliche Anzeigetafel)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sportart</Label>
                  <Select value={turnierSportart} onChange={(e) => setTurnierSportart(e.target.value)}>
                    {sportartenOptionen.map((opt) => (
                      <option key={opt.wert} value={opt.wert}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Turnier-Format</Label>
                  <Select value={turnierFormat} onChange={(e) => setTurnierFormat(e.target.value)}>
                    <option value="GRUPPE">Gruppenphase</option>
                    <option value="KO">KO-System</option>
                    <option value="SCHWEIZER">Schweizer System</option>
                    <option value="KOMBINATION">Kombination</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Abteilung -> Team */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="abteilung">Abteilung</Label>
              <Select
                id="abteilung"
                value={abteilungId}
                onChange={(e) => handleAbteilungWechsel(e.target.value)}
              >
                <option value="">Alle Abteilungen</option>
                {abteilungen.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
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
                {gefilterteTeams.map((t) => (
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
              <span className="text-sm font-medium">Wiederkehrendes Event</span>
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
                              setWiederholungTage([...wiederholungTage, tag.wert]);
                            } else {
                              setWiederholungTage(wiederholungTage.filter((t) => t !== tag.wert));
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

          {/* Sportstaette (aus Vereins-Einstellungen) oder freie Eingabe */}
          {hallen.length > 0 && (
            <div className="space-y-2">
              <Label>Sportstaette / Halle</Label>
              <Select
                value=""
                onChange={(e) => handleSportstaetteAendern(e.target.value)}
              >
                <option value="">-- Freie Adresseingabe --</option>
                {hallen.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}{h.adresse ? ` (${h.adresse})` : ''}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Sportstaetten koennen unter Einstellungen &gt; Sportstaetten verwaltet werden.
              </p>
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
              {ausgewaehlteHalle && ausgewaehlteHalle.untergruende && ausgewaehlteHalle.untergruende.length > 0 ? (
                <>
                  <option value="">-- Kein Untergrund --</option>
                  {ausgewaehlteHalle.untergruende.map((ug) => {
                    const label = UNTERGRUND_TYPEN.find((u) => u.wert === ug)?.label || ug;
                    return <option key={ug} value={ug}>{label}</option>;
                  })}
                </>
              ) : (
                UNTERGRUND_TYPEN.map((u) => (
                  <option key={u.wert} value={u.wert}>{u.label}</option>
                ))
              )}
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
