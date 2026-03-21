'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Award,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';

// ==================== Typen ====================

interface Profil {
  firstName: string;
  lastName: string;
}

interface LizenzUser {
  id: string;
  email: string;
  role: string;
  profile?: Profil | null;
}

interface Lizenz {
  id: string;
  tenantId: string;
  userId: string;
  bezeichnung: string;
  ausstellerVerband: string | null;
  lizenznummer: string | null;
  erhaltenAm: string;
  gueltigBis: string | null;
  dokumentUrl: string | null;
  notizen: string | null;
  erstelltAm: string;
  status: 'GUELTIG' | 'LAEUFT_BALD_AB' | 'ABGELAUFEN';
  user: LizenzUser;
}

interface TrainerUebersicht {
  id: string;
  email: string;
  rolle: string;
  name: string;
  lizenzen: Lizenz[];
  hatAbgelaufene: boolean;
  hatBaldAblaufend: boolean;
}

// ==================== Status Badge ====================

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'GUELTIG':
      return (
        <Badge className="bg-green-100 text-green-800 gap-1" variant="secondary">
          <CheckCircle className="h-3 w-3" />
          Gueltig
        </Badge>
      );
    case 'LAEUFT_BALD_AB':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 gap-1" variant="secondary">
          <Clock className="h-3 w-3" />
          Laeuft bald ab
        </Badge>
      );
    case 'ABGELAUFEN':
      return (
        <Badge className="bg-red-100 text-red-800 gap-1" variant="secondary">
          <XCircle className="h-3 w-3" />
          Abgelaufen
        </Badge>
      );
    default:
      return null;
  }
}

// ==================== Hauptseite ====================

export default function TrainerLizenzenPage() {
  const benutzer = useBenutzer();
  const istAdmin = benutzer && ['SUPERADMIN', 'ADMIN'].includes(benutzer.rolle);

  const [lizenzen, setLizenzen] = useState<Lizenz[]>([]);
  const [ablaufend, setAblaufend] = useState<Lizenz[]>([]);
  const [laed, setLaed] = useState(true);
  const [fehler, setFehler] = useState('');

  // Dialog
  const [dialogOffen, setDialogOffen] = useState(false);
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);
  const [formular, setFormular] = useState({
    bezeichnung: '',
    ausstellerVerband: '',
    lizenznummer: '',
    erhaltenAm: '',
    gueltigBis: '',
    dokumentUrl: '',
    notizen: '',
  });
  const [speichert, setSpeichert] = useState(false);

  const laden = useCallback(async () => {
    try {
      const [lizenzDaten, ablaufendDaten] = await Promise.all([
        apiClient.get<Lizenz[]>('/trainer-lizenzen'),
        apiClient.get<Lizenz[]>('/trainer-lizenzen/ablaufend'),
      ]);
      setLizenzen(lizenzDaten);
      setAblaufend(ablaufendDaten);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLaed(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const dialogOeffnen = (lizenz?: Lizenz) => {
    if (lizenz) {
      setBearbeitenId(lizenz.id);
      setFormular({
        bezeichnung: lizenz.bezeichnung,
        ausstellerVerband: lizenz.ausstellerVerband || '',
        lizenznummer: lizenz.lizenznummer || '',
        erhaltenAm: lizenz.erhaltenAm ? lizenz.erhaltenAm.slice(0, 10) : '',
        gueltigBis: lizenz.gueltigBis ? lizenz.gueltigBis.slice(0, 10) : '',
        dokumentUrl: lizenz.dokumentUrl || '',
        notizen: lizenz.notizen || '',
      });
    } else {
      setBearbeitenId(null);
      setFormular({
        bezeichnung: '',
        ausstellerVerband: '',
        lizenznummer: '',
        erhaltenAm: '',
        gueltigBis: '',
        dokumentUrl: '',
        notizen: '',
      });
    }
    setDialogOffen(true);
  };

  const speichern = async () => {
    if (!formular.bezeichnung || !formular.erhaltenAm) return;
    setSpeichert(true);
    try {
      const daten = {
        bezeichnung: formular.bezeichnung,
        ausstellerVerband: formular.ausstellerVerband || undefined,
        lizenznummer: formular.lizenznummer || undefined,
        erhaltenAm: formular.erhaltenAm,
        gueltigBis: formular.gueltigBis || undefined,
        dokumentUrl: formular.dokumentUrl || undefined,
        notizen: formular.notizen || undefined,
      };

      if (bearbeitenId) {
        await apiClient.put(`/trainer-lizenzen/${bearbeitenId}`, daten);
      } else {
        await apiClient.post('/trainer-lizenzen', daten);
      }

      setDialogOffen(false);
      await laden();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSpeichert(false);
    }
  };

  const loeschen = async (id: string) => {
    if (!confirm('Lizenz wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/trainer-lizenzen/${id}`);
      await laden();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Loeschen');
    }
  };

  const formatDatum = (d: string | null) => {
    if (!d) return 'Unbefristet';
    return new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const trainerName = (lizenz: Lizenz) => {
    if (lizenz.user?.profile) {
      return `${lizenz.user.profile.firstName} ${lizenz.user.profile.lastName}`;
    }
    return lizenz.user?.email || 'Unbekannt';
  };

  if (laed) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Trainer-Lizenzen</h1>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (fehler) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Trainer-Lizenzen</h1>
        <Card>
          <CardContent className="py-10 text-center text-red-600">
            {fehler}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trainer-Lizenzen</h1>
          <p className="text-muted-foreground">
            Qualifikationen und Lizenzen verwalten
          </p>
        </div>
        <Button onClick={() => dialogOeffnen()} className="gap-2">
          <Plus className="h-4 w-4" />
          Neue Lizenz
        </Button>
      </div>

      {/* Warnungs-Banner fuer ablaufende Lizenzen */}
      {ablaufend.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  {ablaufend.length} Lizenz{ablaufend.length !== 1 ? 'en' : ''} laufen in
                  den naechsten 3 Monaten ab oder sind bereits abgelaufen
                </p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                  {ablaufend.slice(0, 5).map((l) => (
                    <li key={l.id}>
                      {trainerName(l)}: {l.bezeichnung} (bis{' '}
                      {formatDatum(l.gueltigBis)})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lizenzen-Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Alle Lizenzen ({lizenzen.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lizenzen.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Noch keine Lizenzen erfasst.</p>
              <p className="text-sm mt-1">
                Klicken Sie auf &quot;Neue Lizenz&quot;, um eine Qualifikation hinzuzufuegen.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    {istAdmin && (
                      <th className="pb-3 pr-4 font-medium">Trainer</th>
                    )}
                    <th className="pb-3 pr-4 font-medium">Lizenz</th>
                    <th className="pb-3 pr-4 font-medium">Verband</th>
                    <th className="pb-3 pr-4 font-medium">Lizenznummer</th>
                    <th className="pb-3 pr-4 font-medium">Erhalten am</th>
                    <th className="pb-3 pr-4 font-medium">Gueltig bis</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {lizenzen.map((lizenz) => (
                    <tr key={lizenz.id} className="border-b last:border-0">
                      {istAdmin && (
                        <td className="py-3 pr-4">{trainerName(lizenz)}</td>
                      )}
                      <td className="py-3 pr-4 font-medium">
                        {lizenz.bezeichnung}
                      </td>
                      <td className="py-3 pr-4">
                        {lizenz.ausstellerVerband || '-'}
                      </td>
                      <td className="py-3 pr-4">
                        {lizenz.lizenznummer || '-'}
                      </td>
                      <td className="py-3 pr-4">
                        {formatDatum(lizenz.erhaltenAm)}
                      </td>
                      <td className="py-3 pr-4">
                        {formatDatum(lizenz.gueltigBis)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={lizenz.status} />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dialogOeffnen(lizenz)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loeschen(lizenz.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Neue Lizenz / Bearbeiten */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {bearbeitenId ? 'Lizenz bearbeiten' : 'Neue Lizenz anlegen'}
            </DialogTitle>
            <DialogDescription>
              {bearbeitenId
                ? 'Aendern Sie die Lizenz-Daten.'
                : 'Erfassen Sie eine neue Trainer-Qualifikation.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bezeichnung">Bezeichnung *</Label>
              <Input
                id="bezeichnung"
                placeholder="z.B. C-Lizenz Fussball, Uebungsleiter-C"
                value={formular.bezeichnung}
                onChange={(e) =>
                  setFormular({ ...formular, bezeichnung: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="verband">Verband</Label>
                <Input
                  id="verband"
                  placeholder="z.B. WFV, DOSB"
                  value={formular.ausstellerVerband}
                  onChange={(e) =>
                    setFormular({ ...formular, ausstellerVerband: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lizenznummer">Lizenznummer</Label>
                <Input
                  id="lizenznummer"
                  placeholder="z.B. WFV-2024-1234"
                  value={formular.lizenznummer}
                  onChange={(e) =>
                    setFormular({ ...formular, lizenznummer: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="erhaltenAm">Erhalten am *</Label>
                <Input
                  id="erhaltenAm"
                  type="date"
                  value={formular.erhaltenAm}
                  onChange={(e) =>
                    setFormular({ ...formular, erhaltenAm: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="gueltigBis">Gueltig bis</Label>
                <Input
                  id="gueltigBis"
                  type="date"
                  value={formular.gueltigBis}
                  onChange={(e) =>
                    setFormular({ ...formular, gueltigBis: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leer = Unbefristet
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="dokumentUrl">Dokument-URL</Label>
              <Input
                id="dokumentUrl"
                placeholder="https://..."
                value={formular.dokumentUrl}
                onChange={(e) =>
                  setFormular({ ...formular, dokumentUrl: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="notizen">Notizen</Label>
              <Textarea
                id="notizen"
                placeholder="Optionale Anmerkungen..."
                value={formular.notizen}
                onChange={(e) =>
                  setFormular({ ...formular, notizen: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={speichern}
                disabled={
                  speichert || !formular.bezeichnung || !formular.erhaltenAm
                }
              >
                {speichert
                  ? 'Speichert...'
                  : bearbeitenId
                    ? 'Aktualisieren'
                    : 'Anlegen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
