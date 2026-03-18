'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

// ==================== Typen ====================

interface MitgliedInfo {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

interface TeamMitglied {
  id: string;
  memberId: string;
  rolle: string;
  member: MitgliedInfo;
}

interface TeamDetail {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  teamMembers: TeamMitglied[];
}

interface AufstellungDaten {
  id: string;
  name: string;
  formation: string;
  positionen: Record<string, string>;
  publicUrl: string | null;
  erstelltAm: string;
  team: { name: string };
}

// ==================== Formationen ====================

interface PositionDefinition {
  key: string;
  label: string;
  kurzLabel: string;
  row: number;
  col: number;
}

const FORMATIONEN: Record<string, { label: string; positionen: PositionDefinition[] }> = {
  '4-3-3': {
    label: '4-3-3',
    positionen: [
      { key: 'LF', label: 'Linker Fluegel', kurzLabel: 'LF', row: 0, col: 0 },
      { key: 'ST', label: 'Stuermer', kurzLabel: 'ST', row: 0, col: 2 },
      { key: 'RF', label: 'Rechter Fluegel', kurzLabel: 'RF', row: 0, col: 4 },
      { key: 'LM', label: 'Linkes Mittelfeld', kurzLabel: 'LM', row: 1, col: 0 },
      { key: 'ZM', label: 'Zentrales Mittelfeld', kurzLabel: 'ZM', row: 1, col: 2 },
      { key: 'RM', label: 'Rechtes Mittelfeld', kurzLabel: 'RM', row: 1, col: 4 },
      { key: 'LV', label: 'Linker Verteidiger', kurzLabel: 'LV', row: 2, col: 0 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 2, col: 1 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 2, col: 3 },
      { key: 'RV', label: 'Rechter Verteidiger', kurzLabel: 'RV', row: 2, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 3, col: 2 },
    ],
  },
  '4-4-2': {
    label: '4-4-2',
    positionen: [
      { key: 'LS', label: 'Linker Stuermer', kurzLabel: 'LS', row: 0, col: 1 },
      { key: 'RS', label: 'Rechter Stuermer', kurzLabel: 'RS', row: 0, col: 3 },
      { key: 'LM', label: 'Linkes Mittelfeld', kurzLabel: 'LM', row: 1, col: 0 },
      { key: 'ZM1', label: 'Zentrales Mittelfeld 1', kurzLabel: 'ZM', row: 1, col: 1 },
      { key: 'ZM2', label: 'Zentrales Mittelfeld 2', kurzLabel: 'ZM', row: 1, col: 3 },
      { key: 'RM', label: 'Rechtes Mittelfeld', kurzLabel: 'RM', row: 1, col: 4 },
      { key: 'LV', label: 'Linker Verteidiger', kurzLabel: 'LV', row: 2, col: 0 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 2, col: 1 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 2, col: 3 },
      { key: 'RV', label: 'Rechter Verteidiger', kurzLabel: 'RV', row: 2, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 3, col: 2 },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    positionen: [
      { key: 'LS', label: 'Linker Stuermer', kurzLabel: 'LS', row: 0, col: 1 },
      { key: 'RS', label: 'Rechter Stuermer', kurzLabel: 'RS', row: 0, col: 3 },
      { key: 'LA', label: 'Linkes Aussen', kurzLabel: 'LA', row: 1, col: 0 },
      { key: 'ZM1', label: 'Zentrales Mittelfeld 1', kurzLabel: 'ZM', row: 1, col: 1 },
      { key: 'ZM2', label: 'Zentrales Mittelfeld 2', kurzLabel: 'ZM', row: 1, col: 2 },
      { key: 'ZM3', label: 'Zentrales Mittelfeld 3', kurzLabel: 'ZM', row: 1, col: 3 },
      { key: 'RA', label: 'Rechtes Aussen', kurzLabel: 'RA', row: 1, col: 4 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 2, col: 0 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 2, col: 2 },
      { key: 'IV3', label: 'Innenverteidiger 3', kurzLabel: 'IV', row: 2, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 3, col: 2 },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positionen: [
      { key: 'ST', label: 'Stuermer', kurzLabel: 'ST', row: 0, col: 2 },
      { key: 'LA', label: 'Links Offensiv', kurzLabel: 'LA', row: 1, col: 0 },
      { key: 'ZOM', label: 'Zentraler Offensiver', kurzLabel: 'ZOM', row: 1, col: 2 },
      { key: 'RA', label: 'Rechts Offensiv', kurzLabel: 'RA', row: 1, col: 4 },
      { key: 'ZDM1', label: 'Defensives Mittelfeld 1', kurzLabel: 'ZDM', row: 2, col: 1 },
      { key: 'ZDM2', label: 'Defensives Mittelfeld 2', kurzLabel: 'ZDM', row: 2, col: 3 },
      { key: 'LV', label: 'Linker Verteidiger', kurzLabel: 'LV', row: 3, col: 0 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 3, col: 1 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 3, col: 3 },
      { key: 'RV', label: 'Rechter Verteidiger', kurzLabel: 'RV', row: 3, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 4, col: 2 },
    ],
  },
  '4-1-4-1': {
    label: '4-1-4-1',
    positionen: [
      { key: 'ST', label: 'Stuermer', kurzLabel: 'ST', row: 0, col: 2 },
      { key: 'LM', label: 'Linkes Mittelfeld', kurzLabel: 'LM', row: 1, col: 0 },
      { key: 'ZM1', label: 'Zentrales Mittelfeld 1', kurzLabel: 'ZM', row: 1, col: 1 },
      { key: 'ZM2', label: 'Zentrales Mittelfeld 2', kurzLabel: 'ZM', row: 1, col: 3 },
      { key: 'RM', label: 'Rechtes Mittelfeld', kurzLabel: 'RM', row: 1, col: 4 },
      { key: 'ZDM', label: 'Defensives Mittelfeld', kurzLabel: 'ZDM', row: 2, col: 2 },
      { key: 'LV', label: 'Linker Verteidiger', kurzLabel: 'LV', row: 3, col: 0 },
      { key: 'IV1', label: 'Innenverteidiger 1', kurzLabel: 'IV', row: 3, col: 1 },
      { key: 'IV2', label: 'Innenverteidiger 2', kurzLabel: 'IV', row: 3, col: 3 },
      { key: 'RV', label: 'Rechter Verteidiger', kurzLabel: 'RV', row: 3, col: 4 },
      { key: 'TW', label: 'Torwart', kurzLabel: 'TW', row: 4, col: 2 },
    ],
  },
};

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== Spielfeld-Komponente ====================

function Spielfeld({
  formation,
  positionen,
  spieler,
  onPositionAendern,
  nurLesen,
}: {
  formation: string;
  positionen: Record<string, string>;
  spieler: TeamMitglied[];
  onPositionAendern: (key: string, memberId: string) => void;
  nurLesen: boolean;
}) {
  const formationDef = FORMATIONEN[formation];
  if (!formationDef) return null;

  const maxRow = Math.max(...formationDef.positionen.map((p) => p.row));
  const rows = maxRow + 1;

  const spielerMap = new Map(spieler.map((s) => [s.memberId, s]));

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #1a8c2e, #15701f)',
        minHeight: rows * 110 + 40,
      }}
    >
      {/* Spielfeld-Linien */}
      <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
      <div className="absolute left-4 right-4 top-1/2 -translate-y-px h-0.5 bg-white/30" />
      <div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full"
      />
      {/* Strafraum oben */}
      <div className="absolute left-1/2 -translate-x-1/2 top-4 w-48 h-16 border-2 border-t-0 border-white/20 rounded-b-lg" />
      {/* Strafraum unten */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-48 h-16 border-2 border-b-0 border-white/20 rounded-t-lg" />

      {/* Positionen */}
      <div
        className="relative p-6"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${rows}, 100px)`,
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
        }}
      >
        {formationDef.positionen.map((pos) => {
          const gewaehlterSpielerId = positionen[pos.key] || '';
          const gewaehlterSpieler = gewaehlterSpielerId
            ? spielerMap.get(gewaehlterSpielerId)
            : undefined;

          return (
            <div
              key={pos.key}
              style={{
                gridRow: pos.row + 1,
                gridColumn: pos.col + 1,
              }}
              className="flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-1">
                {/* Positions-Badge */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                    gewaehlterSpieler
                      ? 'bg-white text-green-800'
                      : 'bg-white/20 text-white border-2 border-dashed border-white/50'
                  }`}
                >
                  {pos.kurzLabel}
                </div>

                {/* Spieler-Info oder Dropdown */}
                {nurLesen ? (
                  <div className="text-center">
                    <span className="text-xs text-white font-medium drop-shadow">
                      {gewaehlterSpieler
                        ? `${gewaehlterSpieler.member.firstName.charAt(0)}. ${gewaehlterSpieler.member.lastName}`
                        : '-'}
                    </span>
                    {gewaehlterSpieler && (
                      <span className="block text-[10px] text-white/70">
                        #{gewaehlterSpieler.member.memberNumber}
                      </span>
                    )}
                  </div>
                ) : (
                  <select
                    value={gewaehlterSpielerId}
                    onChange={(e) => onPositionAendern(pos.key, e.target.value)}
                    className="w-28 text-[11px] rounded bg-white/90 text-gray-800 px-1 py-0.5 border-0 focus:ring-2 focus:ring-white/50"
                    title={pos.label}
                  >
                    <option value="">-- Frei --</option>
                    {spieler.map((s) => (
                      <option key={s.memberId} value={s.memberId}>
                        {s.member.firstName.charAt(0)}. {s.member.lastName} (#{s.member.memberNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== Hauptseite ====================

export default function AufstellungPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [ladend, setLadend] = useState(true);
  const [speichernd, setSpeichernd] = useState(false);

  // Aktuelle Aufstellung
  const [aktuelleId, setAktuelleId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [formation, setFormation] = useState('4-3-3');
  const [positionen, setPositionen] = useState<Record<string, string>>({});

  // Gespeicherte Aufstellungen
  const [aufstellungen, setAufstellungen] = useState<AufstellungDaten[]>([]);
  const [kopiert, setKopiert] = useState(false);

  const teamLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<TeamDetail>(`/teams/${teamId}`);
      setTeam(daten);
    } catch (error) {
      console.error('Fehler beim Laden des Teams:', error);
    }
  }, [teamId]);

  const aufstellungenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<AufstellungDaten[]>(`/aufstellungen/${teamId}`);
      setAufstellungen(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Aufstellungen:', error);
    }
  }, [teamId]);

  useEffect(() => {
    Promise.all([teamLaden(), aufstellungenLaden()]).finally(() => setLadend(false));
  }, [teamLaden, aufstellungenLaden]);

  const handlePositionAendern = (key: string, memberId: string) => {
    setPositionen((prev) => {
      const neu = { ...prev };
      if (memberId) {
        neu[key] = memberId;
      } else {
        delete neu[key];
      }
      return neu;
    });
  };

  const handleFormationWechsel = (neueFormation: string) => {
    setFormation(neueFormation);
    setPositionen({});
  };

  const handleSpeichern = async () => {
    if (!name.trim()) {
      alert('Bitte einen Namen fuer die Aufstellung eingeben.');
      return;
    }

    setSpeichernd(true);
    try {
      if (aktuelleId) {
        await apiClient.patch(`/aufstellungen/${aktuelleId}`, {
          name,
          formation,
          positionen,
        });
      } else {
        const result = await apiClient.post<AufstellungDaten>('/aufstellungen', {
          teamId,
          name,
          formation,
          positionen,
        });
        setAktuelleId(result.id);
      }
      await aufstellungenLaden();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Aufstellung.');
    } finally {
      setSpeichernd(false);
    }
  };

  const handleLaden = (aufstellung: AufstellungDaten) => {
    setAktuelleId(aufstellung.id);
    setName(aufstellung.name);
    setFormation(aufstellung.formation);
    setPositionen(aufstellung.positionen || {});
  };

  const handleNeu = () => {
    setAktuelleId(null);
    setName('');
    setFormation('4-3-3');
    setPositionen({});
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Aufstellung wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/aufstellungen/${id}`);
      if (aktuelleId === id) {
        handleNeu();
      }
      await aufstellungenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  const handleTeilen = async (id: string) => {
    try {
      const result = await apiClient.post<{ publicUrl: string }>(`/aufstellungen/${id}/teilen`, {});
      const vollUrl = `${window.location.origin}/aufstellung/${result.publicUrl}`;
      await navigator.clipboard.writeText(vollUrl);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
      await aufstellungenLaden();
    } catch (error) {
      console.error('Fehler beim Teilen:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Aufstellungsplaner wird geladen...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Team nicht gefunden.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/teams/${teamId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Aufstellungsplaner</h1>
            <p className="text-sm text-muted-foreground">{team.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleNeu}>
            Neue Aufstellung
          </Button>
          <Button onClick={handleSpeichern} disabled={speichernd}>
            {speichernd ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {aktuelleId ? 'Aktualisieren' : 'Speichern'}
          </Button>
        </div>
      </div>

      {/* Formation + Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(FORMATIONEN).map((f) => (
                <Button
                  key={f}
                  variant={formation === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFormationWechsel(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aufstellung benennen</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Aufstellung vs. FC Muster"
            />
          </CardContent>
        </Card>
      </div>

      {/* Spielfeld */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Spielfeld ({formation})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Spielfeld
            formation={formation}
            positionen={positionen}
            spieler={team.teamMembers}
            onPositionAendern={handlePositionAendern}
            nurLesen={false}
          />
          {team.teamMembers.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Noch keine Spieler im Kader. Fuegen Sie zuerst Mitglieder zum Team hinzu.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gespeicherte Aufstellungen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Gespeicherte Aufstellungen ({aufstellungen.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aufstellungen.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Aufstellungen gespeichert.
            </p>
          ) : (
            <div className="space-y-2">
              {aufstellungen.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    aktuelleId === a.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {a.formation}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDatum(a.erstelltAm)}
                        </span>
                        {a.publicUrl && (
                          <Badge variant="outline" className="text-xs">
                            Geteilt
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLaden(a)}
                      title="Laden"
                    >
                      Laden
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTeilen(a.id)}
                      title="Teilen"
                    >
                      {kopiert ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleLoeschen(a.id)}
                      title="Loeschen"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
