'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Plus,
  Users,
  Calendar,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { apiClient } from '@/lib/api-client';

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  _count: { teamMembers: number; events: number };
}

interface Abteilung {
  id: string;
  name: string;
  sport: string;
  beschreibung: string | null;
  leiterIds: string[];
  teams: Team[];
  _count: { teams: number };
}

interface AbteilungBericht {
  abteilung: { id: string; name: string; sport: string };
  zusammenfassung: {
    anzahlTeams: number;
    gesamtMitglieder: number;
    gesamtVeranstaltungen: number;
  };
  teams: Array<{
    id: string;
    name: string;
    altersgruppe: string;
    anzahlMitglieder: number;
    anzahlVeranstaltungen: number;
    mitglieder: Array<{
      id: string;
      name: string;
      status: string;
      rolle: string;
    }>;
  }>;
}

const SPORTARTEN_LABEL: Record<string, string> = {
  FUSSBALL: 'Fussball',
  HANDBALL: 'Handball',
  BASKETBALL: 'Basketball',
  FOOTBALL: 'Football',
  TENNIS: 'Tennis',
  TURNEN: 'Turnen',
  SCHWIMMEN: 'Schwimmen',
  LEICHTATHLETIK: 'Leichtathletik',
  SONSTIGES: 'Sonstiges',
};

const SPORTARTEN = Object.keys(SPORTARTEN_LABEL);

export default function AbteilungenInhalt() {
  const [abteilungen, setAbteilungen] = useState<Abteilung[]>([]);
  const [ladend, setLadend] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [neuerName, setNeuerName] = useState('');
  const [neueSportart, setNeueSportart] = useState('FUSSBALL');
  const [neueBeschreibung, setNeueBeschreibung] = useState('');
  const [erstellend, setErstellend] = useState(false);

  // Bericht
  const [berichtOffen, setBerichtOffen] = useState(false);
  const [bericht, setBericht] = useState<AbteilungBericht | null>(null);
  const [berichtLadend, setBerichtLadend] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Abteilung[]>('/abteilungen');
      setAbteilungen(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Abteilungen:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleErstellen = async () => {
    if (!neuerName) return;
    setErstellend(true);
    try {
      await apiClient.post('/abteilungen', {
        name: neuerName,
        sport: neueSportart,
        beschreibung: neueBeschreibung || undefined,
      });
      setDialogOffen(false);
      setNeuerName('');
      setNeueBeschreibung('');
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    } finally {
      setErstellend(false);
    }
  };

  const handleBerichtLaden = async (abteilungId: string) => {
    setBerichtOffen(true);
    setBerichtLadend(true);
    setBericht(null);
    try {
      const daten = await apiClient.get<AbteilungBericht>(
        `/abteilungen/${abteilungId}/bericht`,
      );
      setBericht(daten);
    } catch (error) {
      console.error('Fehler beim Laden des Berichts:', error);
    } finally {
      setBerichtLadend(false);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Abteilungen werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Abteilungen</h1>
            <p className="text-muted-foreground">
              Sportabteilungen und ihre Teams verwalten
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Abteilung
        </Button>
      </div>

      {/* Abteilungs-Karten */}
      {abteilungen.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Abteilungen vorhanden. Erstellen Sie die erste Abteilung
          (z.B. Fussball, Handball).
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {abteilungen.map((abt) => (
            <Card key={abt.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{abt.name}</CardTitle>
                  <Badge variant="secondary">
                    {SPORTARTEN_LABEL[abt.sport] || abt.sport}
                  </Badge>
                </div>
                {abt.beschreibung && (
                  <p className="text-sm text-muted-foreground">
                    {abt.beschreibung}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {abt._count.teams} Teams
                  </div>
                </div>

                {/* Teams Liste */}
                {abt.teams.length > 0 && (
                  <div className="space-y-1">
                    {abt.teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{team.name}</span>
                          <span className="text-muted-foreground">
                            ({team.ageGroup})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{team._count.teamMembers} Spieler</span>
                          <span>{team._count.events} Events</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleBerichtLaden(abt.id)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Abteilungsbericht
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Neue Abteilung Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Abteilung erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Abteilung fuer eine Sportart (z.B. Fussball,
              Handball). Teams koennen dann der Abteilung zugeordnet werden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={neuerName}
                onChange={(e) => setNeuerName(e.target.value)}
                placeholder="z.B. Fussball"
              />
            </div>
            <div className="space-y-2">
              <Label>Sportart *</Label>
              <Select
                value={neueSportart}
                onChange={(e) => setNeueSportart(e.target.value)}
              >
                {SPORTARTEN.map((s) => (
                  <option key={s} value={s}>
                    {SPORTARTEN_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input
                value={neueBeschreibung}
                onChange={(e) => setNeueBeschreibung(e.target.value)}
                placeholder="Optionale Beschreibung"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleErstellen}
                disabled={!neuerName || erstellend}
              >
                {erstellend ? 'Wird erstellt...' : 'Abteilung erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bericht Dialog */}
      <Dialog open={berichtOffen} onOpenChange={setBerichtOffen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {bericht
                ? `Bericht: ${bericht.abteilung.name}`
                : 'Abteilungsbericht'}
            </DialogTitle>
            <DialogDescription>
              Uebersicht ueber Teams, Mitglieder und Veranstaltungen
            </DialogDescription>
          </DialogHeader>

          {berichtLadend ? (
            <div className="py-8 text-center text-muted-foreground animate-pulse">
              Bericht wird geladen...
            </div>
          ) : bericht ? (
            <div className="space-y-6">
              {/* Zusammenfassung */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">
                    {bericht.zusammenfassung.anzahlTeams}
                  </div>
                  <div className="text-sm text-muted-foreground">Teams</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {bericht.zusammenfassung.gesamtMitglieder}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mitglieder
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {bericht.zusammenfassung.gesamtVeranstaltungen}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Veranstaltungen
                  </div>
                </div>
              </div>

              {/* Team-Details */}
              {bericht.teams.map((team) => (
                <div key={team.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {team.name}{' '}
                      <span className="text-muted-foreground font-normal">
                        ({team.altersgruppe})
                      </span>
                    </h3>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {team.anzahlMitglieder}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {team.anzahlVeranstaltungen}
                      </span>
                    </div>
                  </div>
                  {team.mitglieder.length > 0 && (
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="h-8 px-3 text-left font-medium">
                              Name
                            </th>
                            <th className="h-8 px-3 text-left font-medium">
                              Rolle
                            </th>
                            <th className="h-8 px-3 text-left font-medium">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.mitglieder.map((m) => (
                            <tr key={m.id} className="border-b last:border-0">
                              <td className="px-3 py-2">{m.name}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {m.rolle}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={
                                    m.status === 'ACTIVE'
                                      ? 'default'
                                      : 'outline'
                                  }
                                >
                                  {m.status === 'ACTIVE' ? 'Aktiv' : m.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
