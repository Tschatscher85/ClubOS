'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shirt,
  Plus,
  Trash2,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

// ==================== Interfaces ====================

interface MitgliedKurz {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

interface TrikotVergabeInfo {
  id: string;
  trikotId: string;
  memberId: string;
  vergabenAm: string;
  zurueckAm: string | null;
  notiz: string | null;
  member: MitgliedKurz;
}

interface TrikotMitStatus {
  id: string;
  teamId: string;
  nummer: number;
  groesse: string | null;
  farbe: string | null;
  zustand: string | null;
  vergaben: TrikotVergabeInfo[];
  aktuelleVergabe: TrikotVergabeInfo | null;
  istVerfuegbar: boolean;
}

interface TeamMitglied {
  id: string;
  memberId: string;
  member: MitgliedKurz;
}

// ==================== Hilfsfunktionen ====================

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ==================== Komponente ====================

export default function TrikotPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [trikots, setTrikots] = useState<TrikotMitStatus[]>([]);
  const [teamMitglieder, setTeamMitglieder] = useState<TeamMitglied[]>([]);
  const [ladend, setLadend] = useState(true);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [ausgebenDialogOffen, setAusgebenDialogOffen] = useState(false);
  const [ausgebenTrikotId, setAusgebenTrikotId] = useState<string | null>(null);

  // Formular-State: Neues Trikot
  const [neueNummer, setNeueNummer] = useState('');
  const [neueGroesse, setNeueGroesse] = useState('');
  const [neueFarbe, setNeueFarbe] = useState('');
  const [neuerZustand, setNeuerZustand] = useState('');
  const [erstellenLadend, setErstellenLadend] = useState(false);

  // Formular-State: Ausgeben
  const [ausgebenMemberId, setAusgebenMemberId] = useState('');
  const [ausgebenNotiz, setAusgebenNotiz] = useState('');
  const [ausgebenLadend, setAusgebenLadend] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const [trikotDaten, mitgliederDaten] = await Promise.all([
        apiClient.get<TrikotMitStatus[]>(`/trikots/${teamId}`),
        apiClient.get<TeamMitglied[]>(`/teams/${teamId}/mitglieder`),
      ]);
      setTrikots(trikotDaten);
      setTeamMitglieder(mitgliederDaten);
    } catch (error) {
      console.error('Fehler beim Laden der Trikots:', error);
    } finally {
      setLadend(false);
    }
  }, [teamId]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleErstellen = async () => {
    if (!neueNummer) return;
    setErstellenLadend(true);
    try {
      await apiClient.post(`/trikots/${teamId}`, {
        nummer: parseInt(neueNummer, 10),
        groesse: neueGroesse || undefined,
        farbe: neueFarbe || undefined,
        zustand: neuerZustand || undefined,
      });
      setNeueNummer('');
      setNeueGroesse('');
      setNeueFarbe('');
      setNeuerZustand('');
      setDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Erstellen');
    } finally {
      setErstellenLadend(false);
    }
  };

  const handleAusgeben = async () => {
    if (!ausgebenTrikotId || !ausgebenMemberId) return;
    setAusgebenLadend(true);
    try {
      await apiClient.post(`/trikots/${ausgebenTrikotId}/ausgeben`, {
        memberId: ausgebenMemberId,
        notiz: ausgebenNotiz || undefined,
      });
      setAusgebenMemberId('');
      setAusgebenNotiz('');
      setAusgebenDialogOffen(false);
      setAusgebenTrikotId(null);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Ausgeben:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Ausgeben');
    } finally {
      setAusgebenLadend(false);
    }
  };

  const handleZurueckbuchen = async (trikotId: string) => {
    if (!confirm('Trikot wirklich als zurueckgegeben markieren?')) return;
    try {
      await apiClient.post(`/trikots/${trikotId}/zurueck`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Zurueckbuchen:', error);
    }
  };

  const handleLoeschen = async (trikotId: string) => {
    if (!confirm('Trikot wirklich löschen? Alle Vergabe-Historie geht verloren.'))
      return;
    try {
      await apiClient.delete(`/trikots/${trikotId}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  const oeffneAusgebenDialog = (trikotId: string) => {
    setAusgebenTrikotId(trikotId);
    setAusgebenMemberId('');
    setAusgebenNotiz('');
    setAusgebenDialogOffen(true);
  };

  // ==================== Statistiken ====================

  const gesamt = trikots.length;
  const ausgegeben = trikots.filter((t) => !t.istVerfuegbar).length;
  const verfuegbar = trikots.filter((t) => t.istVerfuegbar).length;

  // ==================== Render ====================

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Trikots werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/teams/${teamId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Shirt className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Trikotverwaltung</h1>
              <p className="text-sm text-muted-foreground">
                Trikots verwalten, ausgeben und zurueckbuchen
              </p>
            </div>
          </div>
        </div>

        {/* Trikot anlegen Dialog */}
        <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Trikot anlegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Trikot anlegen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Trikot für dieses Team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="nummer">Trikotnummer *</Label>
                <Input
                  id="nummer"
                  type="number"
                  min={1}
                  value={neueNummer}
                  onChange={(e) => setNeueNummer(e.target.value)}
                  placeholder="z.B. 7"
                />
              </div>
              <div>
                <Label htmlFor="groesse">Groesse</Label>
                <Select
                  id="groesse"
                  value={neueGroesse}
                  onChange={(e) => setNeueGroesse(e.target.value)}
                >
                  <option value="">Keine Angabe</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="farbe">Typ</Label>
                <Select
                  id="farbe"
                  value={neueFarbe}
                  onChange={(e) => setNeueFarbe(e.target.value)}
                >
                  <option value="">Keine Angabe</option>
                  <option value="Heimtrikot">Heimtrikot</option>
                  <option value="Auswaertstrikot">Auswaertstrikot</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="zustand">Zustand</Label>
                <Select
                  id="zustand"
                  value={neuerZustand}
                  onChange={(e) => setNeuerZustand(e.target.value)}
                >
                  <option value="">Keine Angabe</option>
                  <option value="Neu">Neu</option>
                  <option value="Gut">Gut</option>
                  <option value="Gebraucht">Gebraucht</option>
                  <option value="Abgenutzt">Abgenutzt</option>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleErstellen}
                disabled={!neueNummer || erstellenLadend}
              >
                {erstellenLadend ? 'Wird erstellt...' : 'Trikot erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{gesamt}</div>
            <p className="text-sm text-muted-foreground">Trikots gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{ausgegeben}</div>
            <p className="text-sm text-muted-foreground">Ausgegeben</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{verfuegbar}</div>
            <p className="text-sm text-muted-foreground">Verfuegbar</p>
          </CardContent>
        </Card>
      </div>

      {/* Trikot-Tabelle */}
      {trikots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Trikots angelegt. Erstellen Sie das erste Trikot.
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Trikots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Nr</th>
                    <th className="pb-3 font-medium">Groesse</th>
                    <th className="pb-3 font-medium">Typ</th>
                    <th className="pb-3 font-medium">Zustand</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Zugewiesen an</th>
                    <th className="pb-3 font-medium">Seit</th>
                    <th className="pb-3 font-medium text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {trikots.map((trikot) => (
                    <tr
                      key={trikot.id}
                      className="border-b last:border-0 hover:bg-accent/50"
                    >
                      <td className="py-3 font-medium">{trikot.nummer}</td>
                      <td className="py-3">{trikot.groesse || '-'}</td>
                      <td className="py-3">{trikot.farbe || '-'}</td>
                      <td className="py-3">{trikot.zustand || '-'}</td>
                      <td className="py-3">
                        {trikot.istVerfuegbar ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                            Verfuegbar
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          >
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                            Ausgegeben
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {trikot.aktuelleVergabe
                          ? `${trikot.aktuelleVergabe.member.firstName} ${trikot.aktuelleVergabe.member.lastName}`
                          : '-'}
                      </td>
                      <td className="py-3">
                        {trikot.aktuelleVergabe
                          ? formatDatum(trikot.aktuelleVergabe.vergabenAm)
                          : '-'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          {trikot.istVerfuegbar ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => oeffneAusgebenDialog(trikot.id)}
                              title="Ausgeben"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZurueckbuchen(trikot.id)}
                              title="Zurueckbuchen"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoeschen(trikot.id)}
                            title="Loeschen"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ausgeben Dialog */}
      <Dialog open={ausgebenDialogOffen} onOpenChange={setAusgebenDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trikot ausgeben</DialogTitle>
            <DialogDescription>
              Waehlen Sie ein Mitglied aus, dem das Trikot zugewiesen werden soll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="mitglied">Mitglied *</Label>
              <Select
                id="mitglied"
                value={ausgebenMemberId}
                onChange={(e) => setAusgebenMemberId(e.target.value)}
              >
                <option value="">Mitglied auswaehlen...</option>
                {teamMitglieder.map((tm) => (
                  <option key={tm.memberId} value={tm.memberId}>
                    {tm.member.firstName} {tm.member.lastName} (
                    {tm.member.memberNumber})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="notiz">Notiz (optional)</Label>
              <Input
                id="notiz"
                value={ausgebenNotiz}
                onChange={(e) => setAusgebenNotiz(e.target.value)}
                placeholder="z.B. Fuer Saison 2025/26"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAusgeben}
              disabled={!ausgebenMemberId || ausgebenLadend}
            >
              {ausgebenLadend ? 'Wird zugewiesen...' : 'Trikot ausgeben'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
