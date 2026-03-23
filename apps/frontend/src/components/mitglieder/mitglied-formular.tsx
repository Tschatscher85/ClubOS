'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AdressSuche } from '@/components/ui/adress-suche';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { sportartenLaden, sportartenFallback, sportartLabel } from '@/lib/sportarten';

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
  fotoErlaubnis?: boolean;
  fahrgemeinschaftErlaubnis?: boolean;
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

interface TeamKurz {
  id: string;
  name: string;
  ageGroup: string;
  abteilungId: string | null;
}

interface AbteilungKurz {
  id: string;
  name: string;
  sport: string;
}

interface ElternKandidat {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  memberNumber: string;
}

interface MitgliedFormularProps {
  offen: boolean;
  onSchliessen: () => void;
  onGespeichert: () => void;
  mitglied?: Mitglied | null;
}

// Sportarten werden dynamisch geladen (siehe useEffect)

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
  const [fotoErlaubnis, setFotoErlaubnis] = useState(false);
  const [fahrgemeinschaftErlaubnis, setFahrgemeinschaftErlaubnis] = useState(false);
  const [erstelleLogin, setErstelleLogin] = useState(false);
  const [tempPasswort, setTempPasswort] = useState<string | null>(null);
  const [ladend, setLadend] = useState(false);
  const [fehler, setFehler] = useState('');

  // Eltern-Verknuepfung
  const [elternMemberId, setElternMemberId] = useState<string | null>(null);
  const [elternKandidaten, setElternKandidaten] = useState<ElternKandidat[]>([]);
  const [elternSuche, setElternSuche] = useState('');
  const [elternDropdownOffen, setElternDropdownOffen] = useState(false);
  const elternSucheRef = useRef<HTMLDivElement>(null);

  // Beitragsklasse
  const [beitragsklassen, setBeitragsklassen] = useState<Beitragsklasse[]>([]);
  const [beitragsklasseId, setBeitragsklasseId] = useState('');
  const [individuellerBeitrag, setIndividuellerBeitrag] = useState(false);
  const [individuellerBetrag, setIndividuellerBetrag] = useState('');
  const [individuellerIntervall, setIndividuellerIntervall] = useState('MONATLICH');

  // Vereinsrollen
  const [rollenVorlagen, setRollenVorlagen] = useState<RollenVorlage[]>([]);
  const [gewaehlteRollen, setGewaehlteRollen] = useState<string[]>(['Spieler']);

  // Sportarten (dynamisch)
  const [sportartenOptionen, setSportartenOptionen] = useState<{ wert: string; label: string }[]>(sportartenFallback());

  // Team- und Abteilungs-Zuordnung
  const [alleTeams, setAlleTeams] = useState<TeamKurz[]>([]);
  const [alleAbteilungen, setAlleAbteilungen] = useState<AbteilungKurz[]>([]);
  const [gewaehlteTeams, setGewaehlteTeams] = useState<Record<string, string>>({}); // teamId → rolle

  // Beitragsklassen + Rollen + Sportarten + Teams laden
  useEffect(() => {
    if (offen) {
      apiClient.get<Beitragsklasse[]>('/beitragsklassen')
        .then((result) => setBeitragsklassen(result.filter((k) => k.istAktiv)))
        .catch(() => {});
      apiClient.get<RollenVorlage[]>('/rollen-vorlagen')
        .then((result) => setRollenVorlagen(result))
        .catch(() => {});
      apiClient.get<TeamKurz[]>('/teams')
        .then(setAlleTeams)
        .catch(() => {});
      apiClient.get<AbteilungKurz[]>('/abteilungen')
        .then(setAlleAbteilungen)
        .catch(() => {});
      apiClient.get<ElternKandidat[]>('/mitglieder')
        .then((result) => setElternKandidaten(result.map((m) => ({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          memberNumber: m.memberNumber,
        }))))
        .catch(() => {});
      sportartenLaden().then((daten) => {
        setSportartenOptionen(daten.map((s) => ({
          wert: s.istVordefiniert
            ? s.name.toUpperCase().replace(/[^A-Z]/g, '') || s.name
            : s.name,
          label: s.name,
        })));
      }).catch(() => {});

      // Bestehende Team-Zuordnungen laden (mit Rolle)
      if (mitglied) {
        apiClient.get<Array<{ teamId: string; rolle: string }>>(`/mitglieder/${mitglied.id}/teams`)
          .then((daten) => {
            const map: Record<string, string> = {};
            for (const t of daten) map[t.teamId] = t.rolle || 'SPIELER';
            setGewaehlteTeams(map);
          })
          .catch(() => setGewaehlteTeams({}));
      } else {
        setGewaehlteTeams({});
      }
    }
  }, [offen, mitglied]);

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
      setElternMemberId(null);
      setElternSuche('');
      setElternDropdownOffen(false);
      setFotoErlaubnis(mitglied.fotoErlaubnis ?? false);
      setFahrgemeinschaftErlaubnis(mitglied.fahrgemeinschaftErlaubnis ?? false);
      setErstelleLogin(false);
      setTempPasswort(null);
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
        apiClient.get<{ id: string; vereinsRollen: string[] }[]>('/benutzer/verwaltung/liste')
          .then((benutzerListe) => {
            const user = benutzerListe.find((b) => b.id === mitglied.userId);
            setGewaehlteRollen(user?.vereinsRollen?.length ? user.vereinsRollen : ['Spieler']);
          })
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
      setElternMemberId(null);
      setElternSuche('');
      setElternDropdownOffen(false);
      setFotoErlaubnis(false);
      setFahrgemeinschaftErlaubnis(false);
      setErstelleLogin(false);
      setTempPasswort(null);
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

  // Eltern-Kandidaten filtern (nach Suchbegriff, ohne das aktuelle Mitglied)
  const gefilterteElternKandidaten = useMemo(() => {
    if (!elternSuche || elternSuche.length < 2) return [];
    const suche = elternSuche.toLowerCase();
    return elternKandidaten
      .filter((m) => {
        // Aktuelles Mitglied nicht als Elternteil anzeigen
        if (mitglied && m.id === mitglied.id) return false;
        const vollerName = `${m.firstName} ${m.lastName}`.toLowerCase();
        const emailLower = (m.email || '').toLowerCase();
        return vollerName.includes(suche) || emailLower.includes(suche) || m.memberNumber.toLowerCase().includes(suche);
      })
      .slice(0, 8);
  }, [elternSuche, elternKandidaten, mitglied]);

  // Dropdown schliessen bei Klick ausserhalb
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (elternSucheRef.current && !elternSucheRef.current.contains(e.target as Node)) {
        setElternDropdownOffen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sportarten auf aktive Abteilungen filtern (Fallback: alle, wenn keine Abteilungen existieren)
  const gefilterteSportarten = useMemo(() => {
    if (alleAbteilungen.length === 0) return sportartenOptionen;
    const abteilungsSportarten = new Set(alleAbteilungen.map((a) => a.sport));
    return sportartenOptionen.filter((s) => abteilungsSportarten.has(s.wert));
  }, [sportartenOptionen, alleAbteilungen]);

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
        ...(istMinderjaehrig && elternMemberId && { elternMemberId }),
        ...(istMinderjaehrig && { fotoErlaubnis }),
        ...(istMinderjaehrig && { fahrgemeinschaftErlaubnis }),
        ...(istMinderjaehrig && erstelleLogin && { erstelleBenutzerKonto: true }),
        status,
        beitragsklasseId: individuellerBeitrag ? null : (beitragsklasseId || null),
        ...(individuellerBeitrag && individuellerBetrag && {
          beitragBetrag: parseFloat(individuellerBetrag),
          beitragIntervall: individuellerIntervall,
        }),
      };

      let erhaltenesPasswort: string | null = null;

      if (istBearbeitung && mitglied) {
        const ergebnis = await apiClient.put<{ id: string; userId?: string; temporaeresPasswort?: string }>(`/mitglieder/${mitglied.id}`, daten);
        if (ergebnis?.temporaeresPasswort) {
          erhaltenesPasswort = ergebnis.temporaeresPasswort;
        }
        // Vereinsrollen zuweisen wenn Mitglied einen User-Account hat
        const aktuelleUserId = ergebnis?.userId || mitglied.userId;
        if (aktuelleUserId && gewaehlteRollen.length > 0) {
          await apiClient.put(`/benutzer/verwaltung/${aktuelleUserId}/vereinsrollen`, {
            vereinsRollen: gewaehlteRollen,
          }).catch(() => {/* User hat ggf. noch keinen Account */});
        }
        // Team-Zuordnungen aktualisieren (mit Rollen)
        const teamZuordnungen = Object.entries(gewaehlteTeams).map(([teamId, rolle]) => ({ teamId, rolle }));
        if (teamZuordnungen.length > 0) {
          await apiClient.put(`/mitglieder/${mitglied.id}/teams`, {
            teamIds: teamZuordnungen,
          }).catch(() => {});
        }
      } else {
        const neuesMitglied = await apiClient.post<{ id: string; userId?: string; temporaeresPasswort?: string }>('/mitglieder', daten);
        if (neuesMitglied?.temporaeresPasswort) {
          erhaltenesPasswort = neuesMitglied.temporaeresPasswort;
        }
        // Vereinsrollen zuweisen wenn User-Account erstellt wurde
        if (neuesMitglied.userId && gewaehlteRollen.length > 0) {
          await apiClient.put(`/benutzer/verwaltung/${neuesMitglied.userId}/vereinsrollen`, {
            vereinsRollen: gewaehlteRollen,
          }).catch(() => {});
        }
        // Team-Zuordnungen setzen (mit Rollen)
        const teamZuordnungen = Object.entries(gewaehlteTeams).map(([teamId, rolle]) => ({ teamId, rolle }));
        if (teamZuordnungen.length > 0) {
          await apiClient.put(`/mitglieder/${neuesMitglied.id}/teams`, {
            teamIds: teamZuordnungen,
          }).catch(() => {});
        }
      }

      onGespeichert();
      if (erhaltenesPasswort) {
        setTempPasswort(erhaltenesPasswort);
      } else {
        onSchliessen();
      }
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
            <AdressSuche
              id="adresse"
              value={adresse}
              onChange={(neueAdresse) => setAdresse(neueAdresse)}
              placeholder="Adresse suchen..."
            />
          </div>

          {/* Sportarten */}
          <div className="space-y-2">
            <Label>Sportarten *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gefilterteSportarten.map((s) => (
                <label
                  key={s.wert}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    gewaehlteSportarten.includes(s.wert)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={gewaehlteSportarten.includes(s.wert)}
                    onChange={() => handleSportartToggle(s.wert)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Team-Zuordnung */}
          {alleTeams.length > 0 && (
            <div className="space-y-2 rounded-lg border p-4">
              <Label className="text-base font-medium">Team-Zuordnung</Label>
              <p className="text-xs text-muted-foreground">
                Mitglied einem oder mehreren Teams zuordnen. Das Mitglied sieht nur Kalender, Nachrichten und Spiele seiner Teams.
              </p>
              <div className="space-y-1 mt-2 max-h-60 overflow-y-auto">
                {(() => {
                  const renderTeamZeile = (team: TeamKurz) => {
                    const istGewaehlt = team.id in gewaehlteTeams;
                    return (
                      <div
                        key={team.id}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
                          istGewaehlt ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={istGewaehlt}
                          onChange={() => {
                            setGewaehlteTeams((prev) => {
                              const neu = { ...prev };
                              if (istGewaehlt) {
                                delete neu[team.id];
                              } else {
                                neu[team.id] = 'SPIELER';
                              }
                              return neu;
                            });
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm flex-1">{team.name}</span>
                        <span className="text-xs text-muted-foreground">({team.ageGroup})</span>
                        {istGewaehlt && (
                          <select
                            value={gewaehlteTeams[team.id] || 'SPIELER'}
                            onChange={(e) => {
                              setGewaehlteTeams((prev) => ({
                                ...prev,
                                [team.id]: e.target.value,
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs rounded border border-input bg-background px-2 py-0.5 ml-1"
                          >
                            <option value="SPIELER">Spieler</option>
                            <option value="TRAINER">Trainer</option>
                            <option value="CO_TRAINER">Co-Trainer</option>
                            <option value="TORWART_TRAINER">TW-Trainer</option>
                            <option value="BETREUER">Betreuer</option>
                            <option value="KAPITAEN">Kapitaen</option>
                          </select>
                        )}
                      </div>
                    );
                  };

                  if (alleAbteilungen.length > 0) {
                    return (
                      <>
                        {alleAbteilungen.map((abt) => {
                          const abtTeams = alleTeams.filter((t) => t.abteilungId === abt.id);
                          if (abtTeams.length === 0) return null;
                          return (
                            <div key={abt.id} className="mb-2">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">{abt.name}</p>
                              {abtTeams.map(renderTeamZeile)}
                            </div>
                          );
                        })}
                        {alleTeams.filter((t) => !t.abteilungId).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Ohne Abteilung</p>
                            {alleTeams.filter((t) => !t.abteilungId).map(renderTeamZeile)}
                          </div>
                        )}
                      </>
                    );
                  }

                  return alleTeams.map(renderTeamZeile);
                })()}
              </div>
            </div>
          )}

          {/* Trainer-Lizenz Hinweis */}
          {Object.values(gewaehlteTeams).some((r) => ['TRAINER', 'CO_TRAINER', 'TORWART_TRAINER'].includes(r)) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">
                Dieses Mitglied ist als Trainer eingetragen
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Trainer-Lizenzen können auf der Mitglied-Detailseite oder unter{' '}
                <a href="/trainer-lizenzen" className="underline font-medium">
                  Trainer-Lizenzen
                </a>{' '}
                hinterlegt werden (inkl. Lizenz-Dokument als PDF).
              </p>
            </div>
          )}

          {/* Eltern-Verknuepfung - nur bei Minderjährigen */}
          {istMinderjaehrig && (
            <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <Label className="text-orange-800 text-base font-medium">
                Elternteil / Erziehungsberechtigter
              </Label>

              {/* Gewaehltes Eltern-Mitglied anzeigen */}
              {elternMemberId && (
                <div className="flex items-center gap-2 rounded-md border border-orange-300 bg-white px-3 py-2">
                  <span className="text-sm flex-1">
                    {(() => {
                      const em = elternKandidaten.find((m) => m.id === elternMemberId);
                      return em ? `${em.firstName} ${em.lastName}${em.email ? ` (${em.email})` : ""}` : "Verknuepftes Mitglied";
                    })()}
                  </span>
                  <Badge variant="secondary" className="text-xs">Mitglied</Badge>
                  <button
                    type="button"
                    onClick={() => {
                      setElternMemberId(null);
                      setElternEmail('');
                      setElternSuche('');
                    }}
                    className="text-xs text-orange-700 hover:text-orange-900 underline"
                  >
                    Entfernen
                  </button>
                </div>
              )}

              {/* Suche nach bestehendem Mitglied */}
              {!elternMemberId && (
                <div ref={elternSucheRef} className="relative">
                  <Label htmlFor="elternSuche" className="text-orange-800 text-sm">
                    Bestehendes Mitglied suchen
                  </Label>
                  <Input
                    id="elternSuche"
                    value={elternSuche}
                    onChange={(e) => {
                      setElternSuche(e.target.value);
                      setElternDropdownOffen(e.target.value.length >= 2);
                    }}
                    onFocus={() => {
                      if (elternSuche.length >= 2) setElternDropdownOffen(true);
                    }}
                    placeholder="Name oder E-Mail eingeben..."
                    autoComplete="off"
                  />
                  {elternDropdownOffen && gefilterteElternKandidaten.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-orange-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                      {gefilterteElternKandidaten.map((kandidat) => (
                        <button
                          key={kandidat.id}
                          type="button"
                          onClick={() => {
                            setElternMemberId(kandidat.id);
                            setElternEmail(kandidat.email || '');
                            setElternSuche('');
                            setElternDropdownOffen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <span className="text-sm font-medium">
                            {kandidat.firstName} {kandidat.lastName}
                          </span>
                          {kandidat.email && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {kandidat.email}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({kandidat.memberNumber})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {elternDropdownOffen && elternSuche.length >= 2 && gefilterteElternKandidaten.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-orange-200 bg-white shadow-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">Kein Mitglied gefunden. E-Mail unten manuell eingeben.</p>
                    </div>
                  )}
                </div>
              )}

              {!elternMemberId && (
                <div className="space-y-1">
                  <Label htmlFor="elternEmail" className="text-orange-800 text-sm">
                    Oder E-Mail-Adresse eingeben
                  </Label>
                  <Input
                    id="elternEmail"
                    type="email"
                    value={elternEmail}
                    onChange={(e) => setElternEmail(e.target.value)}
                    placeholder="eltern@beispiel.de"
                  />
                </div>
              )}

              <p className="text-xs text-orange-700">
                {elternMemberId
                  ? 'Das Kind wird automatisch mit dem Elternteil in einer Familie verknuepft.'
                  : 'Eltern erhalten Zugang zum Eltern-Portal und sehen Teams, Kalender und Nachrichten ihres Kindes.'}
              </p>
            </div>
          )}

          {/* Kind-Login erstellen - nur bei Minderjährigen ohne bestehenden User */}
          {istMinderjaehrig && !(istBearbeitung && mitglied?.userId) && (
            <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={erstelleLogin}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setErstelleLogin(checked);
                    // Automatisch Jugendspieler-Rolle setzen / zuruecksetzen
                    if (checked) {
                      setGewaehlteRollen((prev) => {
                        const ohneSpiel = prev.filter((r) => r !== 'Spieler');
                        return ohneSpiel.includes('Jugendspieler') ? ohneSpiel : [...ohneSpiel, 'Jugendspieler'];
                      });
                    } else {
                      setGewaehlteRollen((prev) => {
                        const ohneJugend = prev.filter((r) => r !== 'Jugendspieler');
                        return ohneJugend.includes('Spieler') ? ohneJugend : [...ohneJugend, 'Spieler'];
                      });
                    }
                  }}
                  className="rounded border-gray-300 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-purple-800">
                    Eigenen Login fuer Kind erstellen
                  </span>
                  <p className="text-xs text-purple-700 mt-0.5">
                    Das Kind erhaelt einen eigenen Zugang zum Vereinsportal.
                    Die Eltern muessen der Erstellung zustimmen.
                    Ein temporaeres Passwort wird generiert.
                  </p>
                </div>
              </label>
              {erstelleLogin && !email && (
                <p className="text-xs text-red-600 font-medium">
                  Bitte eine E-Mail-Adresse fuer das Kind angeben, um einen Login zu erstellen.
                </p>
              )}
            </div>
          )}

          {/* Einverständniserklärungen - nur bei Minderjährigen */}
          {istMinderjaehrig && (
            <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Label className="text-base font-medium text-blue-800">
                Einverständniserklärungen der Erziehungsberechtigten
              </Label>
              <p className="text-xs text-blue-700">
                Für Minderjährige unter 18 Jahren sind folgende Einwilligungen der Eltern/Erziehungsberechtigten erforderlich.
              </p>

              <label className="flex items-start gap-3 cursor-pointer rounded-md border border-blue-200 bg-white p-3">
                <input
                  type="checkbox"
                  checked={fotoErlaubnis}
                  onChange={(e) => setFotoErlaubnis(e.target.checked)}
                  className="rounded border-gray-300 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">Fotoerlaubnis</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Die Erziehungsberechtigten erlauben, dass Fotos des Kindes im Rahmen
                    der Vereinsaktivitäten erstellt und in der internen Vereins-Galerie
                    angezeigt werden dürfen (KUG §22, DSGVO Art. 6).
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer rounded-md border border-blue-200 bg-white p-3">
                <input
                  type="checkbox"
                  checked={fahrgemeinschaftErlaubnis}
                  onChange={(e) => setFahrgemeinschaftErlaubnis(e.target.checked)}
                  className="rounded border-gray-300 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">Fahrgemeinschaft erlaubt</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Die Erziehungsberechtigten erlauben, dass das Kind im Rahmen von
                    Vereinsaktivitäten in Fahrgemeinschaften mit anderen Eltern/Betreuern
                    mitfahren darf (§832 BGB Aufsichtspflicht).
                  </p>
                </div>
              </label>
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

          {/* Temporaeres Passwort anzeigen */}
          {tempPasswort && (
            <div className="space-y-3 rounded-lg border border-green-300 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Kind-Login wurde erstellt!
              </p>
              <p className="text-xs text-green-700">
                Bitte notieren Sie das temporaere Passwort und geben Sie es an die Eltern weiter.
                Es wird nur einmal angezeigt.
              </p>
              <div className="flex items-center gap-2 rounded-md border border-green-300 bg-white p-3">
                <code className="text-lg font-mono font-bold text-green-900 select-all flex-1">
                  {tempPasswort}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPasswort);
                  }}
                >
                  Kopieren
                </Button>
              </div>
              <p className="text-xs text-green-700">
                Login-E-Mail: <strong>{email || elternEmail}</strong>
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setTempPasswort(null);
                  onSchliessen();
                }}
              >
                Verstanden, Dialog schliessen
              </Button>
            </div>
          )}

          {fehler && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {fehler}
            </div>
          )}

          {!tempPasswort && (
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onSchliessen}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={ladend || (erstelleLogin && istMinderjaehrig && !email)}>
                {ladend ? 'Speichern...' : istBearbeitung ? 'Aktualisieren' : 'Anlegen'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
