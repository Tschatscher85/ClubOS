'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, MapPin, Clock, Users, ChevronLeft, ChevronRight, Building, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { EventFormular } from '@/components/kalender/event-formular';
import { apiClient } from '@/lib/api-client';
import { getEventFarben, EVENT_TYP_LABEL } from '@/lib/event-farben';
import type { EventFarben } from '@/lib/event-farben';

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
  team: { id: string; name: string; sport: string; abteilungId?: string };
  attendances: { status: string }[];
  _count: { attendances: number };
}

interface BelegungData {
  id: string;
  wochentag: string;
  von: string;
  bis: string;
  notiz: string | null;
  halle: { id: string; name: string };
  team: { id: string; name: string };
}

interface AbteilungData {
  id: string;
  name: string;
  sport: string;
  teams: { id: string; name: string; ageGroup: string }[];
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WOCHENTAG_MAP: Record<string, number> = { MO: 0, DI: 1, MI: 2, DO: 3, FR: 4, SA: 5, SO: 6 };
const MONATSNAMEN = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function formatUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function KalenderInhalt() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [belegungen, setBelegungen] = useState<BelegungData[]>([]);
  const [abteilungen, setAbteilungen] = useState<AbteilungData[]>([]);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const [aktuellerMonat, setAktuellerMonat] = useState(new Date());
  const [ansicht, setAnsicht] = useState<'monat' | 'liste' | 'timeline'>('monat');
  const [farben, setFarben] = useState<EventFarben>(getEventFarben());

  // Filter
  const [filterAbteilung, setFilterAbteilung] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterTyp, setFilterTyp] = useState('');
  const [belegungenAnzeigen, setBelegungenAnzeigen] = useState(true);

  useEffect(() => {
    const handler = (e: Event) => {
      setFarben((e as CustomEvent).detail);
    };
    window.addEventListener('event-farben-changed', handler);
    return () => window.removeEventListener('event-farben-changed', handler);
  }, []);

  const datenLaden = useCallback(async () => {
    try {
      const [eventDaten, turnierDaten, wochenplan, abteilungenDaten] = await Promise.all([
        apiClient.get<EventData[]>('/veranstaltungen'),
        apiClient.get<{ id: string; name: string; matches: { id: string; team1: string; team2: string; time: string | null; status: string; score1: number | null; score2: number | null }[] }[]>('/turniere').catch(() => []),
        apiClient.get<Record<string, BelegungData[]>>('/hallen/wochenplan').catch(() => ({})),
        apiClient.get<AbteilungData[]>('/abteilungen').catch(() => []),
      ]);

      const turnierEvents: EventData[] = [];
      for (const turnier of turnierDaten) {
        for (const spiel of turnier.matches || []) {
          if (spiel.time) {
            turnierEvents.push({
              id: `turnier-${spiel.id}`,
              title: `${spiel.team1} vs ${spiel.team2}`,
              type: 'TOURNAMENT',
              date: spiel.time,
              endDate: null,
              location: turnier.name,
              untergrund: null,
              teamId: '',
              notes: spiel.score1 !== null ? `${spiel.score1}:${spiel.score2}` : null,
              team: { id: '', name: turnier.name, sport: '' },
              attendances: [],
              _count: { attendances: 0 },
            });
          }
        }
      }

      const alleBelegungen: BelegungData[] = [];
      for (const tagesListe of Object.values(wochenplan)) {
        alleBelegungen.push(...tagesListe);
      }
      setBelegungen(alleBelegungen);
      setAbteilungen(abteilungenDaten);
      setEvents([...eventDaten, ...turnierEvents]);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  // Team-IDs fuer aktuellen Filter
  const filterTeamIds = useMemo(() => {
    if (filterTeam) return new Set([filterTeam]);
    if (filterAbteilung) {
      const abt = abteilungen.find((a) => a.id === filterAbteilung);
      return abt ? new Set(abt.teams.map((t) => t.id)) : new Set<string>();
    }
    return null; // null = alle anzeigen
  }, [filterAbteilung, filterTeam, abteilungen]);

  // Gefilterte Events
  const gefilterteEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterTeamIds && e.teamId && !filterTeamIds.has(e.teamId)) return false;
      if (filterTyp && e.type !== filterTyp) return false;
      return true;
    });
  }, [events, filterTeamIds, filterTyp]);

  // Gefilterte Belegungen
  const gefilterteBelegungen = useMemo(() => {
    if (!belegungenAnzeigen) return [];
    return belegungen.filter((b) => {
      if (filterTeamIds && !filterTeamIds.has(b.team.id)) return false;
      return true;
    });
  }, [belegungen, filterTeamIds, belegungenAnzeigen]);

  // Teams fuer Team-Filter (abhaengig von Abteilung)
  const verfuegbareTeams = useMemo(() => {
    if (filterAbteilung) {
      const abt = abteilungen.find((a) => a.id === filterAbteilung);
      return abt?.teams || [];
    }
    return abteilungen.flatMap((a) => a.teams);
  }, [filterAbteilung, abteilungen]);

  const handleLoeschen = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Veranstaltung wirklich löschen?')) return;
    try {
      await apiClient.delete(`/veranstaltungen/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const typFarbe = (typ: string): string => {
    return farben[typ as keyof EventFarben] || farben.MEETING;
  };

  // Kalendertage berechnen
  const kalenderTage = useMemo(() => {
    const jahr = aktuellerMonat.getFullYear();
    const monat = aktuellerMonat.getMonth();
    const ersterTag = new Date(jahr, monat, 1);
    const letzterTag = new Date(jahr, monat + 1, 0);

    let startTag = ersterTag.getDay() - 1;
    if (startTag < 0) startTag = 6;

    const tage: { datum: Date; istAktuellerMonat: boolean }[] = [];

    for (let i = startTag - 1; i >= 0; i--) {
      tage.push({ datum: new Date(jahr, monat, -i), istAktuellerMonat: false });
    }

    for (let i = 1; i <= letzterTag.getDate(); i++) {
      tage.push({ datum: new Date(jahr, monat, i), istAktuellerMonat: true });
    }

    while (tage.length < 42) {
      const nächsterTag = tage.length - startTag - letzterTag.getDate() + 1;
      tage.push({ datum: new Date(jahr, monat + 1, nächsterTag), istAktuellerMonat: false });
    }

    return tage;
  }, [aktuellerMonat]);

  // Events pro Tag
  const eventsProTag = useMemo(() => {
    const map = new Map<string, EventData[]>();
    for (const event of gefilterteEvents) {
      const key = new Date(event.date).toISOString().split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [gefilterteEvents]);

  // Belegungen pro Wochentag-Index
  const belegungenProTag = useMemo(() => {
    const map = new Map<number, BelegungData[]>();
    for (const b of gefilterteBelegungen) {
      const idx = WOCHENTAG_MAP[b.wochentag];
      if (idx !== undefined) {
        if (!map.has(idx)) map.set(idx, []);
        map.get(idx)!.push(b);
      }
    }
    return map;
  }, [gefilterteBelegungen]);

  const heute = new Date().toISOString().split('T')[0];

  // Kommende Events (fuer Liste + Timeline)
  const kommendeEvents = useMemo(() => {
    return gefilterteEvents
      .filter((e) => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 30);
  }, [gefilterteEvents]);

  // Aktiver Filter?
  const hatFilter = filterAbteilung || filterTeam || filterTyp;

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="animate-pulse text-muted-foreground">Kalender wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter-Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 bg-muted/30">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filterAbteilung}
          onChange={(e) => {
            setFilterAbteilung(e.target.value);
            setFilterTeam('');
          }}
          className="w-44 h-8 text-sm"
        >
          <option value="">Alle Abteilungen</option>
          {abteilungen.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
        {verfuegbareTeams.length > 0 && (
          <Select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="w-44 h-8 text-sm"
          >
            <option value="">Alle Teams</option>
            {verfuegbareTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.ageGroup})</option>
            ))}
          </Select>
        )}
        <Select
          value={filterTyp}
          onChange={(e) => setFilterTyp(e.target.value)}
          className="w-40 h-8 text-sm"
        >
          <option value="">Alle Typen</option>
          {Object.entries(EVENT_TYP_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={belegungenAnzeigen}
            onChange={(e) => setBelegungenAnzeigen(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Building className="h-3.5 w-3.5 text-muted-foreground" />
          Belegungen
        </label>
        {hatFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setFilterAbteilung(''); setFilterTeam(''); setFilterTyp(''); }}
          >
            Filter zuruecksetzen
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <button
              onClick={() => setAnsicht('monat')}
              className={`px-3 py-1.5 text-sm rounded-l-md ${ansicht === 'monat' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Monat
            </button>
            <button
              onClick={() => setAnsicht('liste')}
              className={`px-3 py-1.5 text-sm border-l ${ansicht === 'liste' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Liste
            </button>
            <button
              onClick={() => setAnsicht('timeline')}
              className={`px-3 py-1.5 text-sm border-l rounded-r-md ${ansicht === 'timeline' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Timeline
            </button>
          </div>
          {ansicht === 'monat' && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAktuellerMonat(new Date(aktuellerMonat.getFullYear(), aktuellerMonat.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[160px] text-center">
                {MONATSNAMEN[aktuellerMonat.getMonth()]} {aktuellerMonat.getFullYear()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAktuellerMonat(new Date(aktuellerMonat.getFullYear(), aktuellerMonat.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => setAktuellerMonat(new Date())}
              >
                Heute
              </Button>
            </div>
          )}
        </div>
        <Button onClick={() => setFormularOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Veranstaltung
        </Button>
      </div>

      {/* Monatsansicht */}
      {ansicht === 'monat' && (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-muted">
            {WOCHENTAGE.map((tag) => (
              <div key={tag} className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
                {tag}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {kalenderTage.map(({ datum, istAktuellerMonat }, idx) => {
              const key = datum.toISOString().split('T')[0];
              const tagesEvents = eventsProTag.get(key) || [];
              const istHeute = key === heute;
              let wtIdx = datum.getDay() - 1;
              if (wtIdx < 0) wtIdx = 6;
              const tagesBelegungen = belegungenProTag.get(wtIdx) || [];

              const alleEintraege = tagesEvents.length + tagesBelegungen.length;

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-r border-b last:border-r-0 p-1 ${
                    !istAktuellerMonat ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className={`text-xs font-medium mb-0.5 ${
                    istHeute
                      ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                      : istAktuellerMonat ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {datum.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {/* Belegungen */}
                    {tagesBelegungen.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="w-full text-[10px] leading-tight px-1 py-0.5 rounded truncate bg-muted/80 text-muted-foreground border border-dashed"
                        title={`${b.von}–${b.bis} ${b.team.name} @ ${b.halle.name}`}
                      >
                        {b.von} {b.team.name}
                      </div>
                    ))}
                    {/* Events */}
                    {tagesEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => router.push(`/kalender/${event.id}`)}
                        className="w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded text-white truncate"
                        style={{ backgroundColor: typFarbe(event.type) }}
                        title={`${formatUhrzeit(event.date)} ${event.title} (${event.team.name})`}
                      >
                        {formatUhrzeit(event.date)} {event.title}
                      </button>
                    ))}
                    {alleEintraege > 5 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{alleEintraege - 5} weitere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listenansicht */}
      {ansicht === 'liste' && (
        <div className="space-y-2">
          {kommendeEvents.length === 0 && gefilterteBelegungen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Keine kommenden Veranstaltungen{hatFilter ? ' für diesen Filter' : ''}.
            </div>
          ) : (
            <>
              {/* Belegungen als kompakte Uebersicht */}
              {gefilterteBelegungen.length > 0 && (
                <div className="rounded-lg border p-3 bg-muted/30 mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" />
                    Regelmaessige Belegungen
                  </p>
                  <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {gefilterteBelegungen.map((b) => (
                      <div key={b.id} className="text-xs flex items-center gap-2 px-2 py-1 rounded border border-dashed">
                        <span className="font-medium min-w-[24px]">{b.wochentag}</span>
                        <span className="text-muted-foreground">{b.von}–{b.bis}</span>
                        <span className="truncate">{b.team.name}</span>
                        <span className="text-muted-foreground truncate ml-auto">{b.halle.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {kommendeEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/kalender/${event.id}`)}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center min-w-[50px] rounded-md bg-muted px-2 py-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-bold">
                      {new Date(event.date).getDate()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('de-DE', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: typFarbe(event.type) }}
                      />
                      <span className="font-medium truncate">{event.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {event.team.name}
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatUhrzeit(event.date)}
                        {event.endDate && ` – ${formatUhrzeit(event.endDate)}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                      {event.attendances?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.attendances.filter((a) => a.status === 'YES').length}/{event.attendances.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    className="text-white shrink-0"
                    style={{ backgroundColor: typFarbe(event.type) }}
                  >
                    {EVENT_TYP_LABEL[event.type] || event.type}
                  </Badge>
                  {!event.id.startsWith('turnier-') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => handleLoeschen(event.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Timeline-Ansicht */}
      {ansicht === 'timeline' && (() => {
        const sortiert = [...gefilterteEvents]
          .filter((e) => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const nachDatum = new Map<string, EventData[]>();
        for (const event of sortiert) {
          const tag = new Date(event.date).toLocaleDateString('de-DE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          });
          if (!nachDatum.has(tag)) nachDatum.set(tag, []);
          nachDatum.get(tag)!.push(event);
        }

        return (
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

            {nachDatum.size === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Keine kommenden Termine{hatFilter ? ' für diesen Filter' : ''}.
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(nachDatum.entries()).slice(0, 30).map(([tag, tagesEvents]) => (
                  <div key={tag}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold z-10">
                        {tagesEvents[0] ? new Date(tagesEvents[0].date).getDate() : ''}
                      </div>
                      <span className="font-semibold text-sm">{tag}</span>
                    </div>

                    <div className="ml-[40px] space-y-2">
                      {tagesEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => !event.id.startsWith('turnier-') && router.push(`/kalender/${event.id}`)}
                          className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                            event.id.startsWith('turnier-') ? '' : 'cursor-pointer hover:bg-accent/50'
                          }`}
                        >
                          <div
                            className="w-1 h-10 rounded-full shrink-0"
                            style={{ backgroundColor: typFarbe(event.type) }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{event.title}</span>
                              <Badge variant="outline" className="text-xs shrink-0">{event.team.name}</Badge>
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{formatUhrzeit(event.date)}{event.endDate ? ` – ${formatUhrzeit(event.endDate)}` : ''}</span>
                              <span>{event.location || event.team.name}</span>
                            </div>
                          </div>
                          <Badge
                            className="text-white text-xs shrink-0"
                            style={{ backgroundColor: typFarbe(event.type) }}
                          >
                            {EVENT_TYP_LABEL[event.type] || event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Legende */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(EVENT_TYP_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: typFarbe(key) }}
            />
            {label}
          </span>
        ))}
        {belegungen.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded border border-dashed bg-muted" />
            Belegung
          </span>
        )}
      </div>

      <EventFormular
        offen={formularOffen}
        onSchliessen={() => setFormularOffen(false)}
        onGespeichert={datenLaden}
      />
    </div>
  );
}
