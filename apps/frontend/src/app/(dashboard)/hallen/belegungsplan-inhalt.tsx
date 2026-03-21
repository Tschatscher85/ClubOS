'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building,
  Plus,
  Clock,
  Trash2,
  Pencil,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface Halle {
  id: string;
  name: string;
  adresse: string | null;
  kapazitaet: number | null;
}

interface Team {
  id: string;
  name: string;
  ageGroup: string;
}

interface Belegung {
  id: string;
  wochentag: string;
  von: string;
  bis: string;
  notiz: string | null;
  halle: { id: string; name: string };
  team: { id: string; name: string };
}

interface Wochenplan {
  [wochentag: string]: Belegung[];
}

const WOCHENTAGE = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];
const WOCHENTAG_LABEL: Record<string, string> = {
  MO: 'Montag',
  DI: 'Dienstag',
  MI: 'Mittwoch',
  DO: 'Donnerstag',
  FR: 'Freitag',
  SA: 'Samstag',
  SO: 'Sonntag',
};

export default function BelegungsplanInhalt() {
  const [hallen, setHallen] = useState<Halle[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [wochenplan, setWochenplan] = useState<Wochenplan>({});
  const [ladend, setLadend] = useState(true);

  // Halle Dialog (Erstellen + Bearbeiten)
  const [halleDialogOffen, setHalleDialogOffen] = useState(false);
  const [halleBearbeitenId, setHalleBearbeitenId] = useState<string | null>(null);
  const [halleName, setHalleName] = useState('');
  const [halleAdresse, setHalleAdresse] = useState('');
  const [halleKapazitaet, setHalleKapazitaet] = useState('');
  const [halleSpeichernd, setHalleSpeichernd] = useState(false);

  // Belegung Dialog (Erstellen + Bearbeiten)
  const [belegungDialogOffen, setBelegungDialogOffen] = useState(false);
  const [belegungBearbeitenId, setBelegungBearbeitenId] = useState<string | null>(null);
  const [belegungHalleId, setBelegungHalleId] = useState('');
  const [belegungTeamId, setBelegungTeamId] = useState('');
  const [belegungWochentag, setBelegungWochentag] = useState('MO');
  const [belegungVon, setBelegungVon] = useState('18:00');
  const [belegungBis, setBelegungBis] = useState('20:00');
  const [belegungNotiz, setBelegungNotiz] = useState('');
  const [belegungWiederholung, setBelegungWiederholung] = useState('WOECHENTLICH');
  const [belegungGueltigVon, setBelegungGueltigVon] = useState('');
  const [belegungGueltigBis, setBelegungGueltigBis] = useState('');
  const [belegungEinmalDatum, setBelegungEinmalDatum] = useState('');
  const [belegungSpeichernd, setBelegungSpeichernd] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const [hallenDaten, teamsDaten, wochenplanDaten] = await Promise.all([
        apiClient.get<Halle[]>('/hallen'),
        apiClient.get<Team[]>('/teams'),
        apiClient.get<Wochenplan>('/hallen/wochenplan'),
      ]);
      setHallen(hallenDaten);
      setTeams(teamsDaten);
      setWochenplan(wochenplanDaten);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  // ==================== Halle erstellen/bearbeiten ====================

  const handleHalleDialogOeffnen = (halle?: Halle) => {
    if (halle) {
      setHalleBearbeitenId(halle.id);
      setHalleName(halle.name);
      setHalleAdresse(halle.adresse || '');
      setHalleKapazitaet(halle.kapazitaet?.toString() || '');
    } else {
      setHalleBearbeitenId(null);
      setHalleName('');
      setHalleAdresse('');
      setHalleKapazitaet('');
    }
    setHalleDialogOffen(true);
  };

  const handleHalleSpeichern = async () => {
    if (!halleName) return;
    setHalleSpeichernd(true);
    try {
      const daten = {
        name: halleName,
        adresse: halleAdresse || undefined,
        kapazitaet: halleKapazitaet ? parseInt(halleKapazitaet) : undefined,
      };
      if (halleBearbeitenId) {
        await apiClient.put(`/hallen/${halleBearbeitenId}`, daten);
      } else {
        await apiClient.post('/hallen', daten);
      }
      setHalleDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setHalleSpeichernd(false);
    }
  };

  const handleHalleLoeschen = async (id: string) => {
    if (!confirm('Ort wirklich löschen? Alle Belegungen dieses Orts werden ebenfalls gelöscht.')) return;
    try {
      await apiClient.delete(`/hallen/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  // ==================== Belegung erstellen/bearbeiten ====================

  const handleBelegungDialogOeffnen = (belegung?: Belegung) => {
    if (belegung) {
      setBelegungBearbeitenId(belegung.id);
      setBelegungHalleId(belegung.halle.id);
      setBelegungTeamId(belegung.team.id);
      setBelegungWochentag(belegung.wochentag);
      setBelegungVon(belegung.von);
      setBelegungBis(belegung.bis);
      setBelegungNotiz(belegung.notiz || '');
      setBelegungWiederholung((belegung as any).wiederholung || 'WOECHENTLICH');
      setBelegungGueltigVon((belegung as any).gueltigVon?.split('T')[0] || '');
      setBelegungGueltigBis((belegung as any).gueltigBis?.split('T')[0] || '');
      setBelegungEinmalDatum((belegung as any).einmalDatum?.split('T')[0] || '');
    } else {
      setBelegungBearbeitenId(null);
      setBelegungHalleId('');
      setBelegungTeamId('');
      setBelegungWochentag('MO');
      setBelegungVon('18:00');
      setBelegungBis('20:00');
      setBelegungNotiz('');
      setBelegungWiederholung('WOECHENTLICH');
      setBelegungGueltigVon('');
      setBelegungGueltigBis('');
      setBelegungEinmalDatum('');
    }
    setBelegungDialogOffen(true);
  };

  const handleBelegungSpeichern = async () => {
    if (!belegungHalleId || !belegungTeamId) return;
    setBelegungSpeichernd(true);
    try {
      const daten = {
        teamId: belegungTeamId,
        wochentag: belegungWochentag,
        von: belegungVon,
        bis: belegungBis,
        notiz: belegungNotiz || undefined,
        wiederholung: belegungWiederholung,
        gueltigVon: belegungGueltigVon || undefined,
        gueltigBis: belegungGueltigBis || undefined,
        einmalDatum: belegungEinmalDatum || undefined,
      };
      if (belegungBearbeitenId) {
        await apiClient.put(`/hallen/belegung/${belegungBearbeitenId}`, {
          ...daten,
          halleId: belegungHalleId,
        });
      } else {
        await apiClient.post(`/hallen/${belegungHalleId}/belegung`, daten);
      }
      setBelegungDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setBelegungSpeichernd(false);
    }
  };

  const handleBelegungLoeschen = async (id: string) => {
    if (!confirm('Belegung löschen?')) return;
    try {
      await apiClient.delete(`/hallen/belegung/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Belegung wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Belegungsplan</h1>
            <p className="text-muted-foreground">
              Wochenplan fuer Hallen, Sportplaetze und Trainingszeiten
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleHalleDialogOeffnen()}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Ort
          </Button>
          <Button
            onClick={() => handleBelegungDialogOeffnen()}
            disabled={hallen.length === 0}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Belegung eintragen
          </Button>
        </div>
      </div>

      {/* Wochenplan */}
      {WOCHENTAGE.map((tag) => {
        const belegungen = wochenplan[tag] || [];
        if (belegungen.length === 0) return null;

        return (
          <div key={tag} className="space-y-2">
            <h2 className="text-lg font-semibold">{WOCHENTAG_LABEL[tag]}</h2>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {belegungen
                .sort((a, b) => a.von.localeCompare(b.von))
                .map((b) => (
                  <Card key={b.id} className="relative">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {b.von} – {b.bis}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{b.team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.halle.name}
                          </p>
                          {b.notiz && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {b.notiz}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleBelegungDialogOeffnen(b)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleBelegungLoeschen(b.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        );
      })}

      {Object.values(wochenplan).every((arr) => arr.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Belegungen eingetragen.
          {hallen.length === 0 && ' Erstellen Sie zuerst einen Ort (Halle, Sportplatz, etc.).'}
        </div>
      )}

      {/* Orte-Uebersicht mit Bearbeiten/Loeschen */}
      {hallen.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Orte</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hallen.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{h.name}</p>
                  {h.adresse && (
                    <p className="text-xs text-muted-foreground">{h.adresse}</p>
                  )}
                  {h.kapazitaet && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {h.kapazitaet} Plaetze
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleHalleDialogOeffnen(h)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleHalleLoeschen(h.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog: Halle erstellen/bearbeiten */}
      <Dialog open={halleDialogOffen} onOpenChange={setHalleDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {halleBearbeitenId ? 'Ort bearbeiten' : 'Neuen Ort erfassen'}
            </DialogTitle>
            <DialogDescription>
              Halle, Sportplatz, Raum oder anderen Ort fuer den Belegungsplan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={halleName}
                onChange={(e) => setHalleName(e.target.value)}
                placeholder="z.B. Jahnhalle"
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={halleAdresse}
                onChange={(e) => setHalleAdresse(e.target.value)}
                placeholder="z.B. Sportstr. 1, 73037 Goeppingen"
              />
            </div>
            <div className="space-y-2">
              <Label>Kapazitaet</Label>
              <Input
                type="number"
                value={halleKapazitaet}
                onChange={(e) => setHalleKapazitaet(e.target.value)}
                placeholder="z.B. 200"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setHalleDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleHalleSpeichern} disabled={!halleName || halleSpeichernd}>
                {halleSpeichernd
                  ? 'Wird gespeichert...'
                  : halleBearbeitenId
                    ? 'Speichern'
                    : 'Ort erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Belegung erstellen/bearbeiten */}
      <Dialog open={belegungDialogOffen} onOpenChange={setBelegungDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {belegungBearbeitenId ? 'Belegung bearbeiten' : 'Belegung eintragen'}
            </DialogTitle>
            <DialogDescription>
              {belegungBearbeitenId
                ? 'Aendern Sie die Trainingszeit.'
                : 'Tragen Sie eine regelmaessige Trainingszeit ein.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ort *</Label>
              <Select
                value={belegungHalleId}
                onChange={(e) => setBelegungHalleId(e.target.value)}
              >
                <option value="">Ort waehlen...</option>
                {hallen.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team *</Label>
              <Select
                value={belegungTeamId}
                onChange={(e) => setBelegungTeamId(e.target.value)}
              >
                <option value="">Team waehlen...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.ageGroup})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wochentag *</Label>
              <Select
                value={belegungWochentag}
                onChange={(e) => setBelegungWochentag(e.target.value)}
              >
                {WOCHENTAGE.map((tag) => (
                  <option key={tag} value={tag}>{WOCHENTAG_LABEL[tag]}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Von *</Label>
                <Input
                  type="time"
                  value={belegungVon}
                  onChange={(e) => setBelegungVon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bis *</Label>
                <Input
                  type="time"
                  value={belegungBis}
                  onChange={(e) => setBelegungBis(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notiz</Label>
              <Input
                value={belegungNotiz}
                onChange={(e) => setBelegungNotiz(e.target.value)}
                placeholder="z.B. nur in der Winterpause"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBelegungDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleBelegungSpeichern}
                disabled={!belegungHalleId || !belegungTeamId || belegungSpeichernd}
              >
                {belegungSpeichernd
                  ? 'Wird gespeichert...'
                  : belegungBearbeitenId
                    ? 'Speichern'
                    : 'Eintragen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
