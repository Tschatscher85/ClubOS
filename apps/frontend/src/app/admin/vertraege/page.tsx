'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  FileText,
  Send,
  Trash2,
  Copy,
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  Edit2,
  Eye,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
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
  DialogFooter,
} from '@/components/ui/dialog';

interface VertragUebersicht {
  id: string;
  titel: string;
  version: number;
  erstelltAm: string;
  updatedAt: string;
  einladungenGesamt: number;
  unterschriebenAnzahl: number;
}

interface VertragEinladung {
  id: string;
  vertragId: string;
  email: string;
  name: string;
  token: string;
  unterschriebenAm: string | null;
  unterschriftDaten: string | null;
  ipAdresse: string | null;
  erstelltAm: string;
}

interface VertragDetail {
  id: string;
  titel: string;
  inhalt: string;
  version: number;
  erstelltVon: string;
  erstelltAm: string;
  updatedAt: string;
  einladungen: VertragEinladung[];
}

export default function VertraegePage() {
  const router = useRouter();
  const benutzer = useBenutzer();
  const { accessToken, profilLaden } = useAuthStore();
  const [bereit, setBereit] = useState(false);
  const [laden, setLaden] = useState(true);
  const [vertraege, setVertraege] = useState<VertragUebersicht[]>([]);

  // Erweiterter Vertrag (Detail geladen)
  const [erweiterteIds, setErweiterteIds] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Record<string, VertragDetail>>({});

  // Erstellen/Bearbeiten Dialog
  const [editorDialog, setEditorDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitel, setEditTitel] = useState('');
  const [editInhalt, setEditInhalt] = useState('');
  const [speichernLadend, setSpeichernLadend] = useState(false);

  // Einladen Dialog
  const [einladenDialog, setEinladenDialog] = useState<string | null>(null);
  const [einladenName, setEinladenName] = useState('');
  const [einladenEmail, setEinladenEmail] = useState('');
  const [einladenLadend, setEinladenLadend] = useState(false);

  // Detail-Ansicht Dialog
  const [detailDialog, setDetailDialog] = useState<VertragDetail | null>(null);

  // Kopiert-Feedback
  const [kopiertId, setKopiertId] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    if (!accessToken) {
      router.replace('/anmelden');
      return;
    }
    profilLaden().finally(() => setBereit(true));
  }, [accessToken, router, profilLaden]);

  const datenLaden = useCallback(async () => {
    try {
      const v = await apiClient.get<VertragUebersicht[]>('/admin/vertraege');
      setVertraege(v);
    } catch (err) {
      console.error('Vertraege laden fehlgeschlagen:', err);
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    if (!bereit) return;
    if (benutzer && benutzer.rolle !== 'SUPERADMIN') {
      router.push('/dashboard');
      return;
    }
    if (benutzer) {
      datenLaden();
    }
  }, [bereit, benutzer, router, datenLaden]);

  const detailLaden = async (id: string) => {
    try {
      const d = await apiClient.get<VertragDetail>(`/admin/vertraege/${id}`);
      setDetails((prev) => ({ ...prev, [id]: d }));
    } catch (err) {
      console.error('Detail laden fehlgeschlagen:', err);
    }
  };

  const toggleErweitert = (id: string) => {
    setErweiterteIds((prev) => {
      const neu = new Set(prev);
      if (neu.has(id)) {
        neu.delete(id);
      } else {
        neu.add(id);
        if (!details[id]) {
          detailLaden(id);
        }
      }
      return neu;
    });
  };

  const vertragSpeichern = async () => {
    if (!editTitel.trim() || !editInhalt.trim()) return;
    setSpeichernLadend(true);
    try {
      if (editId) {
        await apiClient.put(`/admin/vertraege/${editId}`, {
          titel: editTitel,
          inhalt: editInhalt,
        });
      } else {
        await apiClient.post('/admin/vertraege', {
          titel: editTitel,
          inhalt: editInhalt,
        });
      }
      setEditorDialog(false);
      setEditId(null);
      setEditTitel('');
      setEditInhalt('');
      datenLaden();
      // Details-Cache invalidieren
      if (editId) {
        detailLaden(editId);
      }
    } catch (err) {
      console.error('Vertrag speichern fehlgeschlagen:', err);
    } finally {
      setSpeichernLadend(false);
    }
  };

  const vertragLoeschen = async (id: string) => {
    if (!confirm('Vertrag wirklich loeschen? Alle Einladungen werden ebenfalls geloescht.')) return;
    try {
      await apiClient.delete(`/admin/vertraege/${id}`);
      datenLaden();
      setErweiterteIds((prev) => {
        const neu = new Set(prev);
        neu.delete(id);
        return neu;
      });
    } catch (err) {
      console.error('Vertrag loeschen fehlgeschlagen:', err);
    }
  };

  const personEinladen = async () => {
    if (!einladenDialog || !einladenName.trim() || !einladenEmail.trim()) return;
    setEinladenLadend(true);
    try {
      await apiClient.post(`/admin/vertraege/${einladenDialog}/einladen`, {
        name: einladenName,
        email: einladenEmail,
      });
      setEinladenDialog(null);
      setEinladenName('');
      setEinladenEmail('');
      detailLaden(einladenDialog);
      datenLaden();
    } catch (err) {
      console.error('Einladen fehlgeschlagen:', err);
    } finally {
      setEinladenLadend(false);
    }
  };

  const einladungEntfernen = async (einladungId: string, vertragId: string) => {
    if (!confirm('Einladung wirklich entfernen?')) return;
    try {
      await apiClient.delete(`/admin/vertraege/einladung/${einladungId}`);
      detailLaden(vertragId);
      datenLaden();
    } catch (err) {
      console.error('Einladung entfernen fehlgeschlagen:', err);
    }
  };

  const linkKopieren = (token: string, einladungId: string) => {
    const url = `${window.location.origin}/vertrag/${token}`;
    navigator.clipboard.writeText(url);
    setKopiertId(einladungId);
    setTimeout(() => setKopiertId(null), 2000);
  };

  const bearbeitenOeffnen = (vertrag: VertragDetail) => {
    setEditId(vertrag.id);
    setEditTitel(vertrag.titel);
    setEditInhalt(vertrag.inhalt);
    setEditorDialog(true);
  };

  if (!bereit || !benutzer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (benutzer.rolle !== 'SUPERADMIN') return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Vertraege & NDAs
              </h1>
              <p className="text-sm text-muted-foreground">
                Vertraege erstellen und zur Unterschrift versenden
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditId(null);
              setEditTitel('');
              setEditInhalt('');
              setEditorDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Vertrag
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-4">
        {laden ? (
          <div className="text-center text-muted-foreground py-12">Laden...</div>
        ) : vertraege.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Noch keine Vertraege erstellt</p>
              <p className="text-sm mt-1">Erstellen Sie Ihren ersten Vertrag oder NDA.</p>
            </CardContent>
          </Card>
        ) : (
          vertraege.map((vertrag) => {
            const istErweitert = erweiterteIds.has(vertrag.id);
            const detail = details[vertrag.id];
            const alleUnterschrieben =
              vertrag.einladungenGesamt > 0 &&
              vertrag.unterschriebenAnzahl === vertrag.einladungenGesamt;

            return (
              <Card key={vertrag.id}>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleErweitert(vertrag.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {istErweitert ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base">{vertrag.titel}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Version {vertrag.version} &middot;{' '}
                          {new Date(vertrag.erstelltAm).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {vertrag.einladungenGesamt > 0 ? (
                        <Badge
                          variant={alleUnterschrieben ? 'default' : 'secondary'}
                          className={
                            alleUnterschrieben
                              ? 'bg-green-100 text-green-800'
                              : ''
                          }
                        >
                          {vertrag.unterschriebenAnzahl}/{vertrag.einladungenGesamt} unterschrieben
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Keine Einladungen
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          vertragLoeschen(vertrag.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {istErweitert && (
                  <CardContent className="border-t pt-4 space-y-4">
                    {!detail ? (
                      <div className="text-sm text-muted-foreground">Laden...</div>
                    ) : (
                      <>
                        {/* Aktionen */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => bearbeitenOeffnen(detail)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Bearbeiten
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailDialog(detail)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Vertrag ansehen
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setEinladenDialog(detail.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Person einladen
                          </Button>
                        </div>

                        {/* Einladungen */}
                        {detail.einladungen.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Noch niemand eingeladen.
                          </p>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-left p-3 font-medium">Name</th>
                                  <th className="text-left p-3 font-medium">E-Mail</th>
                                  <th className="text-left p-3 font-medium">Status</th>
                                  <th className="text-right p-3 font-medium">Aktionen</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {detail.einladungen.map((einl) => (
                                  <tr key={einl.id} className="hover:bg-muted/20">
                                    <td className="p-3 font-medium">{einl.name}</td>
                                    <td className="p-3 text-muted-foreground">{einl.email}</td>
                                    <td className="p-3">
                                      {einl.unterschriebenAm ? (
                                        <span className="flex items-center gap-1 text-green-700">
                                          <Check className="h-4 w-4" />
                                          Unterschrieben am{' '}
                                          {new Date(einl.unterschriebenAm).toLocaleDateString(
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
                                      ) : (
                                        <span className="flex items-center gap-1 text-amber-600">
                                          <Clock className="h-4 w-4" />
                                          Ausstehend
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex gap-1 justify-end">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          title="Link kopieren"
                                          onClick={() => linkKopieren(einl.token, einl.id)}
                                        >
                                          {kopiertId === einl.id ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-red-600 hover:text-red-700"
                                          title="Einladung entfernen"
                                          onClick={() =>
                                            einladungEntfernen(einl.id, detail.id)
                                          }
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
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </main>

      {/* Erstellen/Bearbeiten Dialog */}
      <Dialog open={editorDialog} onOpenChange={setEditorDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Vertrag bearbeiten' : 'Neuen Vertrag erstellen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={editTitel}
                onChange={(e) => setEditTitel(e.target.value)}
                placeholder="z.B. NDA Vereinbase Partner"
              />
            </div>
            <div className="space-y-2">
              <Label>Vertragsinhalt</Label>
              <Textarea
                value={editInhalt}
                onChange={(e) => setEditInhalt(e.target.value)}
                placeholder="Vertragstext hier eingeben... (HTML wird unterstuetzt)"
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Sie koennen HTML-Tags verwenden fuer Formatierung (z.B. &lt;b&gt;,
                &lt;h3&gt;, &lt;ul&gt;, &lt;p&gt;).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={vertragSpeichern}
              disabled={speichernLadend || !editTitel.trim() || !editInhalt.trim()}
            >
              {speichernLadend ? 'Speichern...' : editId ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Einladen Dialog */}
      <Dialog open={!!einladenDialog} onOpenChange={() => setEinladenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Person zur Unterschrift einladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={einladenName}
                onChange={(e) => setEinladenName(e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={einladenEmail}
                onChange={(e) => setEinladenEmail(e.target.value)}
                placeholder="person@beispiel.de"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Die Person erhaelt eine E-Mail mit einem Link zum Lesen und Unterschreiben des
              Vertrags.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEinladenDialog(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={personEinladen}
              disabled={einladenLadend || !einladenName.trim() || !einladenEmail.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {einladenLadend ? 'Senden...' : 'Einladung senden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail-Ansicht Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailDialog?.titel}</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Version {detailDialog.version}</span>
                <span>&middot;</span>
                <span>
                  Erstellt am{' '}
                  {new Date(detailDialog.erstelltAm).toLocaleDateString('de-DE')}
                </span>
              </div>
              <div
                className="prose prose-sm max-w-none border rounded-lg p-6 bg-white dark:bg-muted/20"
                dangerouslySetInnerHTML={{ __html: detailDialog.inhalt }}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>
              Schliessen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
