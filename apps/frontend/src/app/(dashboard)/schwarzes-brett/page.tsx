'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Info,
  Dumbbell,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Select } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

// ==================== Typen ====================

interface Team {
  id: string;
  name: string;
}

interface Aushang {
  id: string;
  titel: string;
  inhalt: string;
  kategorie: 'INFO' | 'WICHTIG' | 'TRAINING' | 'AUSFALL';
  bildUrl: string | null;
  ablaufDatum: string | null;
  erstelltVon: string;
  erstelltAm: string;
  team: Team | null;
}

const KATEGORIE_KONFIG: Record<
  Aushang['kategorie'],
  { label: string; borderColor: string; badgeClass: string; icon: typeof Info }
> = {
  INFO: {
    label: 'Info',
    borderColor: 'border-l-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700',
    icon: Info,
  },
  WICHTIG: {
    label: 'Wichtig',
    borderColor: 'border-l-red-500',
    badgeClass: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
  },
  TRAINING: {
    label: 'Training',
    borderColor: 'border-l-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700',
    icon: Dumbbell,
  },
  AUSFALL: {
    label: 'Ausfall',
    borderColor: 'border-l-orange-500',
    badgeClass: 'bg-orange-100 text-orange-700',
    icon: XCircle,
  },
};

// ==================== Hauptseite ====================

export default function SchwarzesBrettPage() {
  const benutzer = useBenutzer();
  const [aushaenge, setAushaenge] = useState<Aushang[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [ladend, setLadend] = useState(true);
  const [expandiert, setExpandiert] = useState<Record<string, boolean>>({});
  const [dialogOffen, setDialogOffen] = useState(false);
  const [bearbeitungsId, setBearbeitungsId] = useState<string | null>(null);

  // Formular-State
  const [titel, setTitel] = useState('');
  const [inhalt, setInhalt] = useState('');
  const [kategorie, setKategorie] = useState<Aushang['kategorie']>('INFO');
  const [teamId, setTeamId] = useState<string>('');
  const [bildUrl, setBildUrl] = useState('');
  const [ablaufDatum, setAblaufDatum] = useState('');

  const istTrainerOderAdmin =
    benutzer &&
    ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);

  const laden = useCallback(async () => {
    try {
      const [aushangDaten, teamDaten] = await Promise.all([
        apiClient.get<Aushang[]>('/aushaenge'),
        apiClient.get<Team[]>('/teams'),
      ]);
      setAushaenge(aushangDaten);
      setTeams(teamDaten);
    } catch {
      // Fehler werden im UI-State behandelt
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const formularZuruecksetzen = () => {
    setTitel('');
    setInhalt('');
    setKategorie('INFO');
    setTeamId('');
    setBildUrl('');
    setAblaufDatum('');
    setBearbeitungsId(null);
  };

  const dialogOeffnen = (aushang?: Aushang) => {
    if (aushang) {
      setBearbeitungsId(aushang.id);
      setTitel(aushang.titel);
      setInhalt(aushang.inhalt);
      setKategorie(aushang.kategorie);
      setTeamId(aushang.team?.id || '');
      setBildUrl(aushang.bildUrl || '');
      setAblaufDatum(
        aushang.ablaufDatum
          ? new Date(aushang.ablaufDatum).toISOString().slice(0, 16)
          : '',
      );
    } else {
      formularZuruecksetzen();
    }
    setDialogOffen(true);
  };

  const speichern = async () => {
    if (!titel.trim() || !inhalt.trim()) return;

    const daten = {
      titel: titel.trim(),
      inhalt: inhalt.trim(),
      kategorie,
      teamId: teamId || undefined,
      bildUrl: bildUrl.trim() || undefined,
      ablaufDatum: ablaufDatum || undefined,
    };

    try {
      if (bearbeitungsId) {
        await apiClient.put(`/aushaenge/${bearbeitungsId}`, daten);
      } else {
        await apiClient.post('/aushaenge', daten);
      }
      setDialogOffen(false);
      formularZuruecksetzen();
      laden();
    } catch {
      // Fehler werden ignoriert (apiClient zeigt Toast)
    }
  };

  const loeschen = async (id: string) => {
    if (!confirm('Aushang wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/aushaenge/${id}`);
      laden();
    } catch {
      // Fehler
    }
  };

  const istAbgelaufen = (aushang: Aushang) => {
    if (!aushang.ablaufDatum) return false;
    return new Date(aushang.ablaufDatum) < new Date();
  };

  const darfBearbeiten = (aushang: Aushang) => {
    if (!benutzer) return false;
    if (['SUPERADMIN', 'ADMIN'].includes(benutzer.rolle)) return true;
    return aushang.erstelltVon === benutzer.id;
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pinnwand</h1>
          <Badge variant="secondary">{aushaenge.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <a href="/fahrgemeinschaften">
            <Button variant="outline" size="sm">
              Fahrtenbörse
            </Button>
          </a>
          {istTrainerOderAdmin && (
            <Button onClick={() => dialogOeffnen()}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Aushang
            </Button>
          )}
        </div>
      </div>

      {/* Aushaenge-Liste */}
      {aushaenge.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Noch keine Aushaenge vorhanden.
            </p>
            {istTrainerOderAdmin && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => dialogOeffnen()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ersten Aushang erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {aushaenge.map((aushang) => {
            const konfig = KATEGORIE_KONFIG[aushang.kategorie];
            const KategorieIcon = konfig.icon;
            const istExpanded = expandiert[aushang.id] || false;
            const abgelaufen = istAbgelaufen(aushang);

            return (
              <Card
                key={aushang.id}
                className={`border-l-4 ${konfig.borderColor} ${
                  abgelaufen ? 'opacity-60' : ''
                } cursor-pointer transition-shadow hover:shadow-md`}
                onClick={() =>
                  setExpandiert((prev) => ({
                    ...prev,
                    [aushang.id]: !prev[aushang.id],
                  }))
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <KategorieIcon className="h-4 w-4 shrink-0" />
                        <h3 className="font-semibold text-base truncate">
                          {aushang.titel}
                        </h3>
                        <Badge className={`text-xs ${konfig.badgeClass}`}>
                          {konfig.label}
                        </Badge>
                        {aushang.team && (
                          <Badge variant="outline" className="text-xs">
                            {aushang.team.name}
                          </Badge>
                        )}
                        {abgelaufen && (
                          <Badge variant="destructive" className="text-xs">
                            Abgelaufen
                          </Badge>
                        )}
                      </div>

                      {!istExpanded && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {aushang.inhalt.replace(/<[^>]+>/g, '')}
                        </p>
                      )}

                      {istExpanded && (
                        <div className="mt-3 space-y-3">
                          <div
                            className="text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: aushang.inhalt }}
                          />
                          {aushang.bildUrl && (
                            <img
                              src={aushang.bildUrl}
                              alt={aushang.titel}
                              className="max-h-64 rounded-lg object-cover"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(aushang.erstelltAm).toLocaleDateString(
                            'de-DE',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                        {aushang.ablaufDatum && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Bis{' '}
                            {new Date(aushang.ablaufDatum).toLocaleDateString(
                              'de-DE',
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {darfBearbeiten(aushang) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              dialogOeffnen(aushang);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              loeschen(aushang.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {istExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Erstellen/Bearbeiten Dialog */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {bearbeitungsId ? 'Aushang bearbeiten' : 'Neuer Aushang'}
            </DialogTitle>
            <DialogDescription>
              {bearbeitungsId
                ? 'Aenderungen am Aushang vornehmen.'
                : 'Neuen Aushang am Schwarzen Brett veroeffentlichen.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titel">Titel *</Label>
              <Input
                id="titel"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="z.B. Training faellt aus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inhalt">Inhalt *</Label>
              <Textarea
                id="inhalt"
                value={inhalt}
                onChange={(e) => setInhalt(e.target.value)}
                placeholder="Beschreibung des Aushangs..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select
                  value={kategorie}
                  onChange={(e) =>
                    setKategorie(e.target.value as Aushang['kategorie'])
                  }
                >
                  <option value="INFO">Info</option>
                  <option value="WICHTIG">Wichtig</option>
                  <option value="TRAINING">Training</option>
                  <option value="AUSFALL">Ausfall</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Team (optional)</Label>
                <Select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  <option value="">Kein Team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ablaufDatum">Ablaufdatum (optional)</Label>
              <Input
                id="ablaufDatum"
                type="datetime-local"
                value={ablaufDatum}
                onChange={(e) => setAblaufDatum(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bildUrl">Bild-URL (optional)</Label>
              <Input
                id="bildUrl"
                value={bildUrl}
                onChange={(e) => setBildUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOffen(false);
                  formularZuruecksetzen();
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={speichern}
                disabled={!titel.trim() || !inhalt.trim()}
              >
                {bearbeitungsId ? 'Speichern' : 'Veroeffentlichen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
