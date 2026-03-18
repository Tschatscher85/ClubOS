'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  memberNumber: string;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  sport: string[];
  parentEmail: string | null;
  status: string;
  joinDate: string;
  beitragsklasseId?: string | null;
  beitragBetrag?: number | null;
  beitragIntervall?: string | null;
  userId?: string | null;
}

interface RollenVorlage {
  id: string;
  name: string;
  beschreibung: string | null;
  farbe: string | null;
}

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
}

interface MitgliedFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  mitglied?: Mitglied | null;
}

const SPORTARTEN = [
  'FUSSBALL', 'HANDBALL', 'BASKETBALL', 'FOOTBALL',
  'TENNIS', 'TURNEN', 'SCHWIMMEN', 'LEICHTATHLETIK', 'SONSTIGES',
];

const SPORTARTEN_LABEL: Record<string, string> = {
  FUSSBALL: 'Fußball', HANDBALL: 'Handball', BASKETBALL: 'Basketball',
  FOOTBALL: 'Football', TENNIS: 'Tennis', TURNEN: 'Turnen',
  SCHWIMMEN: 'Schwimmen', LEICHTATHLETIK: 'Leichtathletik', SONSTIGES: 'Sonstiges',
};

const INTERVALL_LABEL: Record<string, string> = {
  MONATLICH: 'Monat',
  QUARTALSWEISE: 'Quartal',
  HALBJAEHRLICH: 'Halbjahr',
  JAEHRLICH: 'Jahr',
};

const formatBetrag = (betrag: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(betrag);
};

function berechneAlter(geburtsdatum: string): number | null {
  if (!geburtsdatum) return null;
  const heute = new Date();
  const geb = new Date(geburtsdatum);
  let alter = heute.getFullYear() - geb.getFullYear();
  const monatsDiff = heute.getMonth() - geb.getMonth();
  if (monatsDiff < 0 || (monatsDiff === 0 && heute.getDate() < geb.getDate())) {
    alter--;
  }
  return alter;
}

export function MitgliedFormular({
  offen,
  onSchliessen,
  onGespeichert,
  mitglied,
}: MitgliedFormularProps) {
  const istBearbeitung = !!mitglied;

  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [email, setEmail] = useState('');
  const [geburtsdatum, setGeburtsdatum] = useState('');
  const [eintrittsdatum, setEintrittsdatum] = useState(new Date().toISOString().split('T')[0]);
  const [telefon, setTelefon] = useState('');
  const [adresse, setAdresse] = useState('');
  const [gewaehlteSportarten, setGewaehlteSportarten] = useState<string[]>([]);
  const [elternEmail, setElternEmail] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  // Beitragsklasse
  const [beitragsklassen, setBeitragsklassen] = useState<Beitragsklasse[]>([]);
  const [beitragsklasseId, setBeitragsklasseId] = useState('');
  const [individuellerBeitrag, setIndividuellerBeitrag] = useState(false);
  const [individuellerBetrag, setIndividuellerBetrag] = useState('');
  const [individuellerIntervall, setIndividuellerIntervall] = useState('MONATLICH');

  // Vereinsrollen
  const [rollenVorlagen, setRollenVorlagen] = useState<RollenVorlage[]>([]);
  const [gewaehlteRollen, setGewaehlteRollen] = useState<string[]>(['Spieler']);

  // Beitragsklassen + Rollen laden
  useEffect(() => {
    if (offen) {
      apiClient.get<Beitragsklasse[]>('/beitragsklassen')
        .then((result) => setBeitragsklassen(result.filter((k) => k.istAktiv)))
        .catch(() => {});
      apiClient.get<RollenVorlage[]>('/rollen-vorlagen')
        .then((result) => setRollenVorlagen(result))
        .catch(() => {});
    }
  }, [offen]);

  // Gewaehlte Beitragsklasse
  const gewaehlteBeitragsklasse = useMemo(() => {
    if (!beitragsklasseId) return null;
    return beitragsklassen.find((k) => k.id === beitragsklasseId) || null;
  }, [beitragsklasseId, beitragsklassen]);

  // Felder aktualisieren wenn ein anderes Mitglied geoeffnet wird
  useEffect(() => {
    if (offen && mitglied) {
      setVorname(mitglied.firstName || '');
      setNachname(mitglied.lastName || '');
      setEmail(mitglied.email || '');
      setGeburtsdatum(mitglied.birthDate ? mitglied.birthDate.split('T')[0] : '');
      setEintrittsdatum(mitglied.joinDate ? mitglied.joinDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setTelefon(mitglied.phone || '');
      setAdresse(mitglied.address || '');
      setGewaehlteSportarten(mitglied.sport || []);
      setElternEmail(mitglied.parentEmail || '');
      setStatus(mitglied.status || 'PENDING');
      setBeitragsklasseId(mitglied.beitragsklasseId || '');
      if (mitglied.beitragBetrag && mitglied.beitragBetrag > 0 && !mitglied.beitragsklasseId) {
        setIndividuellerBeitrag(true);
        setIndividuellerBetrag(mitglied.beitragBetrag.toString());
        setIndividuellerIntervall(mitglied.beitragIntervall || 'MONATLICH');
      } else {
        setIndividuellerBeitrag(false);
        setIndividuellerBetrag('');
        setIndividuellerIntervall('MONATLICH');
      }
      // Rollen laden wenn Mitglied einen User hat
      if (mitglied.userId) {
        apiClient.get<{ vereinsRollen: string[] }>(`/benutzer/${mitglied.userId}`)
          .then((user) => setGewaehlteRollen(user.vereinsRollen?.length ? user.vereinsRollen : ['Spieler']))
          .catch(() => setGewaehlteRollen(['Spieler']));
      } else {
        setGewaehlteRollen(['Spieler']);
      }
      setFehler('');
    } else if (offen && !mitglied) {
      // Neues Mitglied - alles zuruecksetzen
      setVorname('');
      setNachname('');
      setEmail('');
      setGeburtsdatum('');
      setEintrittsdatum(new Date().toISOString().split('T')[0]);
      setTelefon('');
      setAdresse('');
      setGewaehlteSportarten([]);
      setElternEmail('');
      setStatus('PENDING');
      setBeitragsklasseId('');
      setIndividuellerBeitrag(false);
      setIndividuellerBetrag('');
      setIndividuellerIntervall('MONATLICH');
      setGewaehlteRollen(['Spieler']);
      setFehler('');
    }
  }, [offen, mitglied]);

  // Alter berechnen fuer Eltern-E-Mail Sichtbarkeit
  const alter = useMemo(() => berechneAlter(geburtsdatum), [geburtsdatum]);
  const istMinderjaehrig = alter !== null && alter < 18;

  const handleSportartToggle = (sportart: string) => {
    setGewaehlteSportarten((prev) =>
      prev.includes(sportart)
        ? prev.filter((s) => s !== sportart)
        : [...prev, sportart],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadend(true);
    setFehler('');

    if (gewaehlteSportarten.length === 0) {
      setFehler('Bitte mindestens eine Sportart auswählen.');
      setLadend(false);
      return;
    }

    try {
      const daten = {
        vorname,
        nachname,
        ...(email && { email }),
        ...(geburtsdatum && { geburtsdatum }),
        eintrittsdatum,
        ...(telefon && { telefon }),
        ...(adresse && { adresse }),
        sportarten: gewaehlteSportarten,
        ...(istMinderjaehrig && elternEmail && { elternEmail }),
        status,
        beitragsklasseId: individuellerBeitrag ? null : (beitragsklasseId || null),
        ...(individuellerBeitrag && individuellerBetrag && {
          beitragBetrag: parseFloat(individuellerBetrag),
          beitragIntervall: individuellerIntervall,
        }),
      };

      if (istBearbeitung && mitglied) {
        await apiClient.put(`/mitglieder/${mitglied.id}`, daten);
        // Vereinsrollen zuweisen wenn Mitglied einen User-Account hat
        if (mitglied.userId && gewaehlteRollen.length > 0) {
          await apiClient.put(`/benutzer/verwaltung/${mitglied.userId}/vereinsrollen`, {
            vereinsRollen: gewaehlteRollen,
          }).catch(() => {/* User hat ggf. noch keinen Account */});
        }
      } else {
        const neuesMitglied = await apiClient.post<{ id: string; userId?: string }>('/mitglieder', daten);
        // Vereinsrollen zuweisen wenn User-Account erstellt wurde
        if (neuesMitglied.userId && gewaehlteRollen.length > 0) {
          await apiClient.put(`/benutzer/verwaltung/${neuesMitglied.userId}/vereinsrollen`, {
            vereinsRollen: gewaehlteRollen,
          }).catch(() => {});
        }
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
            {istBearbeitung ? 'Mitglied bearbeiten' : 'Neues Mitglied anlegen'}
          </DialogTitle>
          <DialogDescription>
            {istBearbeitung
              ? `${mitglied?.firstName} ${mitglied?.lastName} bearbeiten`
              : 'Erfassen Sie die Daten des neuen Mitglieds'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vorname">Vorname *</Label>
              <Input
                id="vorname"
                value={vorname}
                onChange={(e) => setVorname(e.target.value)}
                placeholder="Max"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nachname">Nachname *</Label>
              <Input
                id="nachname"
                value={nachname}
                onChange={(e) => setNachname(e.target.value)}
                placeholder="Mustermann"
                required
              />
            </div>
          </div>

          {/* E-Mail */}
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="max@beispiel.de"
            />
            <p className="text-xs text-muted-foreground">
              Wird für den persönlichen Login verwendet
            </p>
          </div>

          {/* Geburtsdatum + Eintrittsdatum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
              <Input
                id="geburtsdatum"
                type="date"
                value={geburtsdatum}
                onChange={(e) => setGeburtsdatum(e.target.value)}
              />
              {alter !== null && (
                <p className="text-xs text-muted-foreground">
                  Alter: {alter} Jahre
                  {istMinderjaehrig && (
                    <Badge variant="secondary" className="ml-2 text-xs">Minderjährig</Badge>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eintrittsdatum">Eintrittsdatum *</Label>
              <Input
                id="eintrittsdatum"
                type="date"
                value={eintrittsdatum}
                onChange={(e) => setEintrittsdatum(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Telefon */}
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input
              id="telefon"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="+49 176 12345678"
            />
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Musterstr. 1, 73037 Göppingen"
            />
          </div>

          {/* Sportarten */}
          <div className="space-y-2">
            <Label>Sportarten *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPORTARTEN.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    gewaehlteSportarten.includes(s)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={gewaehlteSportarten.includes(s)}
                    onChange={() => handleSportartToggle(s)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{SPORTARTEN_LABEL[s]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Eltern-E-Mail - nur bei Minderjährigen */}
          {istMinderjaehrig && (
            <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <Label htmlFor="elternEmail" className="text-orange-800">
                Eltern-E-Mail (Pflicht bei Minderjährigen)
              </Label>
              <Input
                id="elternEmail"
                type="email"
                value={elternEmail}
                onChange={(e) => setElternEmail(e.target.value)}
                placeholder="eltern@beispiel.de"
              />
              <p className="text-xs text-orange-700">
                Eltern erhalten Zugang zum Eltern-Portal und sehen Teams, Kalender und Nachrichten ihres Kindes.
              </p>
            </div>
          )}

          {/* Beitragsklasse */}
          {beitragsklassen.length > 0 && (
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-base font-medium">Beitragsklasse</Label>

              {!individuellerBeitrag && (
                <div className="space-y-2">
                  <Select
                    id="beitragsklasse"
                    value={beitragsklasseId}
                    onChange={(e) => setBeitragsklasseId(e.target.value)}
                  >
                    <option value="">-- Keine Beitragsklasse --</option>
                    {beitragsklassen.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} - {formatBetrag(k.betrag)} / {INTERVALL_LABEL[k.intervall] || k.intervall}
                      </option>
                    ))}
                  </Select>
                  {gewaehlteBeitragsklasse && (
                    <p className="text-sm text-muted-foreground">
                      {formatBetrag(gewaehlteBeitragsklasse.betrag)} / {INTERVALL_LABEL[gewaehlteBeitragsklasse.intervall] || gewaehlteBeitragsklasse.intervall}
                      {gewaehlteBeitragsklasse.beschreibung && (
                        <span className="block text-xs mt-0.5">{gewaehlteBeitragsklasse.beschreibung}</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={individuellerBeitrag}
                  onChange={(e) => {
                    setIndividuellerBeitrag(e.target.checked);
                    if (e.target.checked) {
                      setBeitragsklasseId('');
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Individueller Beitrag</span>
              </label>

              {individuellerBeitrag && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="ind-betrag">Betrag (EUR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        &euro;
                      </span>
                      <Input
                        id="ind-betrag"
                        type="number"
                        step="0.01"
                        min="0"
                        value={individuellerBetrag}
                        onChange={(e) => setIndividuellerBetrag(e.target.value)}
                        placeholder="0,00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ind-intervall">Intervall</Label>
                    <Select
                      id="ind-intervall"
                      value={individuellerIntervall}
                      onChange={(e) => setIndividuellerIntervall(e.target.value)}
                    >
                      <option value="MONATLICH">Monatlich</option>
                      <option value="QUARTALSWEISE">Quartalsweise</option>
                      <option value="HALBJAEHRLICH">Halbjaehrlich</option>
                      <option value="JAEHRLICH">Jaehrlich</option>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vereinsrollen */}
          {rollenVorlagen.length > 0 && (
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-base font-medium">Vereinsrolle</Label>
              <p className="text-xs text-muted-foreground">
                Bestimmt welche Bereiche das Mitglied im Portal sehen kann. Standard: Spieler.
              </p>
              <div className="flex flex-wrap gap-2">
                {rollenVorlagen.map((vorlage) => {
                  const istGewaehlt = gewaehlteRollen.includes(vorlage.name);
                  return (
                    <button
                      key={vorlage.id}
                      type="button"
                      onClick={() => {
                        setGewaehlteRollen((prev) =>
                          istGewaehlt
                            ? prev.filter((r) => r !== vorlage.name)
                            : [...prev, vorlage.name],
                        );
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                        istGewaehlt
                          ? 'text-white border-transparent'
                          : 'bg-background text-muted-foreground border-border hover:bg-muted'
                      }`}
                      style={istGewaehlt ? { backgroundColor: vorlage.farbe || '#64748b' } : undefined}
                    >
                      {vorlage.name}
                    </button>
                  );
                })}
              </div>
              {gewaehlteRollen.length === 0 && (
                <p className="text-xs text-orange-600">
                  Mindestens eine Rolle auswählen (z.B. Spieler)
                </p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="PENDING">Ausstehend</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="INACTIVE">Inaktiv</option>
              <option value="CANCELLED">Ausgetreten</option>
            </Select>
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
              {ladend ? 'Speichern...' : istBearbeitung ? 'Aktualisieren' : 'Anlegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
