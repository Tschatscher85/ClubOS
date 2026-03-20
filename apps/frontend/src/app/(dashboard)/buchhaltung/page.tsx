'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  Plus,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { sportartLabel } from '@/lib/sportarten';

interface Rechnung {
  id: string;
  rechnungsNr: string;
  betrag: number;
  beschreibung: string;
  faelligAm: string;
  bezahltAm: string | null;
  status: string;
  memberId: string;
}

interface Beitrag {
  id: string;
  name: string;
  betrag: number;
  intervall: string;
  sportart: string | null;
}

interface Statistik {
  offen: number;
  bezahlt: number;
  ueberfaellig: number;
  gesamtOffen: number;
  gesamtBezahlt: number;
}

interface SportartUebersicht {
  sportart: string;
  mitglieder: number;
  monatsSoll: number;
}

interface KlassenUebersicht {
  klasse: string;
  mitglieder: number;
  betrag: number;
  monatsSoll: number;
}

interface BeitragsUebersicht {
  monatsSoll: number;
  jahresSoll: number;
  anzahlMitglieder: number;
  anzahlOhneBeitrag: number;
  nachSportart: SportartUebersicht[];
  nachKlasse: KlassenUebersicht[];
}

const formatBetrag = (betrag: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(betrag);
};

const STATUS_FARBE: Record<string, string> = {
  OFFEN: 'bg-orange-100 text-orange-800',
  BEZAHLT: 'bg-green-100 text-green-800',
  UEBERFAELLIG: 'bg-red-100 text-red-800',
  STORNIERT: 'bg-gray-100 text-gray-800',
};

const STATUS_LABEL: Record<string, string> = {
  OFFEN: 'Offen',
  BEZAHLT: 'Bezahlt',
  UEBERFAELLIG: 'Ueberfaellig',
  STORNIERT: 'Storniert',
};

export default function BuchhaltungPage() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [beitraege, setBeitraege] = useState<Beitrag[]>([]);
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [beitragsUebersicht, setBeitragsUebersicht] = useState<BeitragsUebersicht | null>(null);
  const [ladend, setLadend] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Neue Rechnung
  const [rechnungOffen, setRechnungOffen] = useState(false);
  const [rBetrag, setRBetrag] = useState('');
  const [rBeschreibung, setRBeschreibung] = useState('');
  const [rMemberId, setRMemberId] = useState('');
  const [rFaellig, setRFaellig] = useState('');
  const [rSpeichernd, setRSpeichernd] = useState(false);

  // Neuer Beitrag
  const [beitragOffen, setBeitragOffen] = useState(false);
  const [bName, setBName] = useState('');
  const [bBetrag, setBBetrag] = useState('');
  const [bIntervall, setBIntervall] = useState('JAEHRLICH');
  const [bSpeichernd, setBSpeichernd] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const url = `/buchhaltung/rechnungen${statusFilter ? `?status=${statusFilter}` : ''}`;
      const [rechnungenDaten, beitraegeDaten, statistikDaten, uebersichtDaten] = await Promise.all([
        apiClient.get<Rechnung[]>(url),
        apiClient.get<Beitrag[]>('/buchhaltung/beitraege'),
        apiClient.get<Statistik>('/buchhaltung/statistik'),
        apiClient.get<BeitragsUebersicht>('/beitragsklassen/uebersicht').catch(() => null),
      ]);
      setRechnungen(rechnungenDaten);
      setBeitraege(beitraegeDaten);
      setStatistik(statistikDaten);
      if (uebersichtDaten) setBeitragsUebersicht(uebersichtDaten);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLadend(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleBezahlt = async (id: string) => {
    try {
      await apiClient.put(`/buchhaltung/rechnungen/${id}/bezahlt`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleStornieren = async (id: string) => {
    if (!confirm('Rechnung wirklich stornieren?')) return;
    try {
      await apiClient.put(`/buchhaltung/rechnungen/${id}/stornieren`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleDatevExport = async () => {
    try {
      const von = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const bis = new Date().toISOString().split('T')[0];
      const daten = await apiClient.get<string>(`/buchhaltung/datev-export?von=${von}&bis=${bis}`);
      const blob = new Blob([daten], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datev-export-${bis}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleRechnungErstellen = async () => {
    if (!rBetrag || !rBeschreibung || !rMemberId || !rFaellig) return;
    setRSpeichernd(true);
    try {
      await apiClient.post('/buchhaltung/rechnungen', {
        betrag: parseFloat(rBetrag),
        beschreibung: rBeschreibung,
        memberId: rMemberId,
        faelligAm: rFaellig,
      });
      setRechnungOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setRSpeichernd(false);
    }
  };

  const handleBeitragErstellen = async () => {
    if (!bName || !bBetrag) return;
    setBSpeichernd(true);
    try {
      await apiClient.post('/buchhaltung/beitraege', {
        name: bName,
        betrag: parseFloat(bBetrag),
        intervall: bIntervall,
      });
      setBeitragOffen(false);
      setBName('');
      setBBetrag('');
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setBSpeichernd(false);
    }
  };

  const handleBulkErstellen = async (beitragId: string) => {
    if (!confirm('Rechnungen für alle aktiven Mitglieder erstellen?')) return;
    try {
      await apiClient.post(`/buchhaltung/rechnungen/erstellen/${beitragId}`, {});
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Buchhaltung wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Buchhaltung</h1>
            <p className="text-muted-foreground">Rechnungen, Beitraege und DATEV-Export</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDatevExport}>
            <Download className="h-4 w-4 mr-2" />
            DATEV-Export
          </Button>
          <Button onClick={() => setRechnungOffen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Rechnung
          </Button>
        </div>
      </div>

      {/* Statistik */}
      {statistik && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Euro className="h-3.5 w-3.5" /> Offen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistik.gesamtOffen.toFixed(2)} EUR
              </div>
              <p className="text-xs text-muted-foreground">{statistik.offen} Rechnungen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Bezahlt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistik.gesamtBezahlt.toFixed(2)} EUR
              </div>
              <p className="text-xs text-muted-foreground">{statistik.bezahlt} Rechnungen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Ueberfaellig
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistik.ueberfaellig}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Beitragsvorlagen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{beitraege.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rechnungen">
        <TabsList>
          <TabsTrigger value="rechnungen">Rechnungen</TabsTrigger>
          <TabsTrigger value="beitraege">Beitragsvorlagen</TabsTrigger>
          <TabsTrigger value="mitgliedsbeitraege">Mitgliedsbeitraege</TabsTrigger>
        </TabsList>

        <TabsContent value="rechnungen" className="space-y-4">
          <div className="flex gap-2">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
              <option value="">Alle Status</option>
              <option value="OFFEN">Offen</option>
              <option value="BEZAHLT">Bezahlt</option>
              <option value="UEBERFAELLIG">Ueberfaellig</option>
              <option value="STORNIERT">Storniert</option>
            </Select>
          </div>

          {rechnungen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Keine Rechnungen vorhanden.</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Nr.</th>
                    <th className="text-left p-3 font-medium">Beschreibung</th>
                    <th className="text-left p-3 font-medium">Betrag</th>
                    <th className="text-left p-3 font-medium">Faellig</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {rechnungen.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-3 text-muted-foreground">{r.rechnungsNr}</td>
                      <td className="p-3">{r.beschreibung}</td>
                      <td className="p-3 font-medium">{r.betrag.toFixed(2)} EUR</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(r.faelligAm).toLocaleDateString('de-DE')}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_FARBE[r.status] || ''}`}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {r.status === 'OFFEN' && (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleBezahlt(r.id)}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Bezahlt
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleStornieren(r.id)}>
                              <XCircle className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="beitraege" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setBeitragOffen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Neue Beitragsvorlage
            </Button>
          </div>

          {beitraege.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Noch keine Beitragsvorlagen. Erstellen Sie z.B. &quot;Jahresbeitrag Erwachsene&quot;.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {beitraege.map((b) => (
                <Card key={b.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{b.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">{b.betrag.toFixed(2)} EUR</div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{b.intervall}</Badge>
                      {b.sportart && <Badge variant="outline">{b.sportart}</Badge>}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => handleBulkErstellen(b.id)}>
                      Rechnungen für alle Mitglieder erstellen
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mitgliedsbeitraege" className="space-y-4">
          {!beitragsUebersicht ? (
            <div className="text-center py-12 text-muted-foreground">
              Keine Beitragsklassen konfiguriert. Erstellen Sie unter Einstellungen &gt; Beitraege Ihre Beitragsklassen.
            </div>
          ) : (
            <>
              {/* Uebersicht-Karten */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" /> Monats-Soll
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatBetrag(beitragsUebersicht.monatsSoll)}
                    </div>
                    <p className="text-xs text-muted-foreground">Erwartete Beitraege pro Monat</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" /> Jahres-Soll
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatBetrag(beitragsUebersicht.jahresSoll)}
                    </div>
                    <p className="text-xs text-muted-foreground">Hochrechnung auf 12 Monate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Aktive Mitglieder
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{beitragsUebersicht.anzahlMitglieder}</div>
                    <p className="text-xs text-muted-foreground">Mit Beitragspflicht</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Ohne Beitrag
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {beitragsUebersicht.anzahlOhneBeitrag}
                    </div>
                    {beitragsUebersicht.anzahlOhneBeitrag > 0 && (
                      <Badge variant="secondary" className="text-xs mt-1 bg-orange-100 text-orange-800">
                        Beitragsklasse zuweisen
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Nach Sportart */}
              {beitragsUebersicht.nachSportart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Aufschluesselung nach Sportart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Sportart</th>
                            <th className="text-right p-3 font-medium">Mitglieder</th>
                            <th className="text-right p-3 font-medium">Monats-Soll</th>
                          </tr>
                        </thead>
                        <tbody>
                          {beitragsUebersicht.nachSportart.map((s) => (
                            <tr key={s.sportart} className="border-b last:border-0">
                              <td className="p-3">
                                <Badge variant="outline">
                                  {sportartLabel(s.sportart)}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">{s.mitglieder}</td>
                              <td className="p-3 text-right font-medium">{formatBetrag(s.monatsSoll)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Nach Beitragsklasse */}
              {beitragsUebersicht.nachKlasse.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Aufschluesselung nach Beitragsklasse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Klasse</th>
                            <th className="text-right p-3 font-medium">Mitglieder</th>
                            <th className="text-right p-3 font-medium">Betrag/Monat</th>
                            <th className="text-right p-3 font-medium">Monats-Soll</th>
                          </tr>
                        </thead>
                        <tbody>
                          {beitragsUebersicht.nachKlasse.map((k) => (
                            <tr key={k.klasse} className="border-b last:border-0">
                              <td className="p-3 font-medium">{k.klasse}</td>
                              <td className="p-3 text-right">{k.mitglieder}</td>
                              <td className="p-3 text-right">{formatBetrag(k.betrag)}</td>
                              <td className="p-3 text-right font-medium">{formatBetrag(k.monatsSoll)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Neue Rechnung */}
      <Dialog open={rechnungOffen} onOpenChange={setRechnungOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Rechnung</DialogTitle>
            <DialogDescription>Erstellen Sie eine Rechnung fuer ein Mitglied.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mitglied-ID *</Label>
              <Input value={rMemberId} onChange={(e) => setRMemberId(e.target.value)} placeholder="Mitglied-ID" />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung *</Label>
              <Input value={rBeschreibung} onChange={(e) => setRBeschreibung(e.target.value)} placeholder="z.B. Jahresbeitrag 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Betrag (EUR) *</Label>
                <Input type="number" step="0.01" value={rBetrag} onChange={(e) => setRBetrag(e.target.value)} placeholder="120.00" />
              </div>
              <div className="space-y-2">
                <Label>Faellig am *</Label>
                <Input type="date" value={rFaellig} onChange={(e) => setRFaellig(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRechnungOffen(false)}>Abbrechen</Button>
              <Button onClick={handleRechnungErstellen} disabled={!rBetrag || !rBeschreibung || !rMemberId || !rFaellig || rSpeichernd}>
                {rSpeichernd ? 'Wird erstellt...' : 'Rechnung erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Neue Beitragsvorlage */}
      <Dialog open={beitragOffen} onOpenChange={setBeitragOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Beitragsvorlage</DialogTitle>
            <DialogDescription>Erstellen Sie eine wiederverwendbare Beitragsvorlage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={bName} onChange={(e) => setBName(e.target.value)} placeholder="z.B. Jahresbeitrag Erwachsene" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Betrag (EUR) *</Label>
                <Input type="number" step="0.01" value={bBetrag} onChange={(e) => setBBetrag(e.target.value)} placeholder="120.00" />
              </div>
              <div className="space-y-2">
                <Label>Intervall *</Label>
                <Select value={bIntervall} onChange={(e) => setBIntervall(e.target.value)}>
                  <option value="MONATLICH">Monatlich</option>
                  <option value="QUARTALSWEISE">Quartalsweise</option>
                  <option value="JAEHRLICH">Jaehrlich</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBeitragOffen(false)}>Abbrechen</Button>
              <Button onClick={handleBeitragErstellen} disabled={!bName || !bBetrag || bSpeichernd}>
                {bSpeichernd ? 'Wird erstellt...' : 'Vorlage erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
