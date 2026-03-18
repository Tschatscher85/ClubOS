'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wallet,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  Filter,
  Users,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

// ==================== Typen ====================

interface MitgliedKurz {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

interface Buchung {
  id: string;
  kasseId: string;
  memberId: string;
  betrag: number;
  grund: string;
  typ: 'STRAFE' | 'EINZAHLUNG' | 'AUSGABE';
  erstelltVon: string;
  erstelltAm: string;
  member: MitgliedKurz;
}

interface KassenDaten {
  id: string;
  teamId: string;
  stand: number;
  buchungen: Buchung[];
}

interface SaldoEintrag {
  memberId: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  strafen: number;
  einzahlungen: number;
  saldo: number;
}

interface KatalogEintrag {
  id: string;
  teamId: string;
  name: string;
  betrag: number;
}

interface TeamMitglied {
  id: string;
  memberId: string;
  member: MitgliedKurz;
}

interface TeamDaten {
  id: string;
  name: string;
  teamMembers: TeamMitglied[];
}

// ==================== Hilfsfunktionen ====================

function formatBetrag(betrag: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(betrag);
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TYP_LABEL: Record<string, string> = {
  STRAFE: 'Strafe',
  EINZAHLUNG: 'Einzahlung',
  AUSGABE: 'Ausgabe',
};

const TYP_FARBE: Record<string, string> = {
  STRAFE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  EINZAHLUNG: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  AUSGABE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

// ==================== Komponente ====================

export default function KassePage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  // Daten-State
  const [kasse, setKasse] = useState<KassenDaten | null>(null);
  const [saldo, setSaldo] = useState<SaldoEintrag[]>([]);
  const [katalog, setKatalog] = useState<KatalogEintrag[]>([]);
  const [teamMitglieder, setTeamMitglieder] = useState<TeamMitglied[]>([]);
  const [teamName, setTeamName] = useState('');
  const [ladend, setLadend] = useState(true);

  // Filter-State
  const [buchungenFilter, setBuchungenFilter] = useState<string>('ALLE');

  // Dialog-State
  const [strafeDialogOffen, setStrafeDialogOffen] = useState(false);
  const [einzahlungDialogOffen, setEinzahlungDialogOffen] = useState(false);
  const [ausgabeDialogOffen, setAusgabeDialogOffen] = useState(false);
  const [katalogDialogOffen, setKatalogDialogOffen] = useState(false);

  // Formular-State
  const [formMemberId, setFormMemberId] = useState('');
  const [formBetrag, setFormBetrag] = useState('');
  const [formGrund, setFormGrund] = useState('');
  const [formKatalogId, setFormKatalogId] = useState('');
  const [formKatalogName, setFormKatalogName] = useState('');
  const [formKatalogBetrag, setFormKatalogBetrag] = useState('');
  const [speichernLadend, setSpeichernLadend] = useState(false);

  // ==================== Daten laden ====================

  const kassenDatenLaden = useCallback(async () => {
    try {
      const [kassenDaten, saldoDaten, katalogDaten, teamDaten] =
        await Promise.all([
          apiClient.get<KassenDaten>(`/kasse/${teamId}`),
          apiClient.get<SaldoEintrag[]>(`/kasse/${teamId}/saldo`),
          apiClient.get<KatalogEintrag[]>(`/kasse/${teamId}/katalog`),
          apiClient.get<TeamDaten>(`/teams/${teamId}`),
        ]);

      setKasse(kassenDaten);
      setSaldo(saldoDaten);
      setKatalog(katalogDaten);
      setTeamMitglieder(teamDaten.teamMembers);
      setTeamName(teamDaten.name);
    } catch (error) {
      console.error('Fehler beim Laden der Kassendaten:', error);
    } finally {
      setLadend(false);
    }
  }, [teamId]);

  useEffect(() => {
    kassenDatenLaden();
  }, [kassenDatenLaden]);

  // ==================== Formular zuruecksetzen ====================

  const formularZuruecksetzen = () => {
    setFormMemberId('');
    setFormBetrag('');
    setFormGrund('');
    setFormKatalogId('');
    setFormKatalogName('');
    setFormKatalogBetrag('');
  };

  // ==================== Aktionen ====================

  const strafeVerhaengen = async () => {
    if (!formMemberId || (!formBetrag && !formKatalogId) || (!formGrund && !formKatalogId)) return;
    setSpeichernLadend(true);
    try {
      await apiClient.post(`/kasse/${teamId}/strafe`, {
        memberId: formMemberId,
        betrag: parseFloat(formBetrag) || 0,
        grund: formGrund || 'Strafe aus Katalog',
        katalogId: formKatalogId || undefined,
      });
      setStrafeDialogOffen(false);
      formularZuruecksetzen();
      kassenDatenLaden();
    } catch (error) {
      console.error('Fehler beim Verhaengen der Strafe:', error);
    } finally {
      setSpeichernLadend(false);
    }
  };

  const einzahlungBuchen = async () => {
    if (!formMemberId || !formBetrag || !formGrund) return;
    setSpeichernLadend(true);
    try {
      await apiClient.post(`/kasse/${teamId}/einzahlung`, {
        memberId: formMemberId,
        betrag: parseFloat(formBetrag),
        grund: formGrund,
      });
      setEinzahlungDialogOffen(false);
      formularZuruecksetzen();
      kassenDatenLaden();
    } catch (error) {
      console.error('Fehler beim Buchen der Einzahlung:', error);
    } finally {
      setSpeichernLadend(false);
    }
  };

  const ausgabeBuchen = async () => {
    if (!formMemberId || !formBetrag || !formGrund) return;
    setSpeichernLadend(true);
    try {
      await apiClient.post(`/kasse/${teamId}/ausgabe`, {
        memberId: formMemberId,
        betrag: parseFloat(formBetrag),
        grund: formGrund,
      });
      setAusgabeDialogOffen(false);
      formularZuruecksetzen();
      kassenDatenLaden();
    } catch (error) {
      console.error('Fehler beim Buchen der Ausgabe:', error);
    } finally {
      setSpeichernLadend(false);
    }
  };

  const katalogEintragErstellen = async () => {
    if (!formKatalogName || !formKatalogBetrag) return;
    setSpeichernLadend(true);
    try {
      await apiClient.post(`/kasse/${teamId}/katalog`, {
        name: formKatalogName,
        betrag: parseFloat(formKatalogBetrag),
      });
      setKatalogDialogOffen(false);
      formularZuruecksetzen();
      kassenDatenLaden();
    } catch (error) {
      console.error('Fehler beim Erstellen des Katalog-Eintrags:', error);
    } finally {
      setSpeichernLadend(false);
    }
  };

  const katalogEintragLoeschen = async (id: string) => {
    if (!confirm('Strafkatalog-Eintrag wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/kasse/${teamId}/katalog/${id}`);
      kassenDatenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  const strafeAusKatalog = (eintrag: KatalogEintrag) => {
    setFormKatalogId(eintrag.id);
    setFormGrund(eintrag.name);
    setFormBetrag(eintrag.betrag.toString());
    setStrafeDialogOffen(true);
  };

  // ==================== Gefilterte Buchungen ====================

  const gefilterteBuchungen = kasse?.buchungen.filter((b) => {
    if (buchungenFilter === 'ALLE') return true;
    return b.typ === buchungenFilter;
  }) ?? [];

  // ==================== Render ====================

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Kasse wird geladen...
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
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Mannschaftskasse</h1>
              <p className="text-sm text-muted-foreground">{teamName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kassenstand */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Aktueller Kassenstand
          </p>
          <p
            className={`text-4xl font-bold ${
              (kasse?.stand ?? 0) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatBetrag(kasse?.stand ?? 0)}
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          onClick={() => {
            formularZuruecksetzen();
            setStrafeDialogOffen(true);
          }}
        >
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="font-medium">Strafe</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
          onClick={() => {
            formularZuruecksetzen();
            setEinzahlungDialogOffen(true);
          }}
        >
          <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="font-medium">Einzahlung</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
          onClick={() => {
            formularZuruecksetzen();
            setAusgabeDialogOffen(true);
          }}
        >
          <Minus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <span className="font-medium">Ausgabe</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="buchungen">
        <TabsList>
          <TabsTrigger value="buchungen">Buchungen</TabsTrigger>
          <TabsTrigger value="saldo">
            <Users className="h-4 w-4 mr-1" />
            Saldo
          </TabsTrigger>
          <TabsTrigger value="katalog">
            <BookOpen className="h-4 w-4 mr-1" />
            Strafkatalog
          </TabsTrigger>
        </TabsList>

        {/* Tab: Buchungen */}
        <TabsContent value="buchungen">
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={buchungenFilter}
                onChange={(e) => setBuchungenFilter(e.target.value)}
                className="w-48"
              >
                <option value="ALLE">Alle Buchungen</option>
                <option value="STRAFE">Nur Strafen</option>
                <option value="EINZAHLUNG">Nur Einzahlungen</option>
                <option value="AUSGABE">Nur Ausgaben</option>
              </Select>
            </div>

            {/* Buchungsliste */}
            {gefilterteBuchungen.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Buchungen vorhanden.
              </div>
            ) : (
              <div className="space-y-2">
                {gefilterteBuchungen.map((buchung) => (
                  <Card key={buchung.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {buchung.member.firstName} {buchung.member.lastName}
                          </p>
                          <Badge
                            className={TYP_FARBE[buchung.typ]}
                          >
                            {TYP_LABEL[buchung.typ]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {buchung.grund}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDatum(buchung.erstelltAm)}
                        </p>
                      </div>
                      <p
                        className={`text-lg font-bold ${
                          buchung.typ === 'EINZAHLUNG'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {buchung.typ === 'EINZAHLUNG' ? '+' : '-'}
                        {formatBetrag(buchung.betrag)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Saldo pro Mitglied */}
        <TabsContent value="saldo">
          {saldo.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Buchungen vorhanden.
            </div>
          ) : (
            <div className="space-y-2">
              {saldo.map((eintrag) => (
                <Card key={eintrag.memberId}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">
                        {eintrag.firstName} {eintrag.lastName}
                      </p>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                        <span>Strafen: {formatBetrag(eintrag.strafen)}</span>
                        <span>Eingezahlt: {formatBetrag(eintrag.einzahlungen)}</span>
                      </div>
                    </div>
                    <p
                      className={`text-lg font-bold ${
                        eintrag.saldo >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatBetrag(eintrag.saldo)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Strafkatalog */}
        <TabsContent value="katalog">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  formularZuruecksetzen();
                  setKatalogDialogOffen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Neuer Eintrag
              </Button>
            </div>

            {katalog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch kein Strafkatalog angelegt. Erstellen Sie Eintraege, um
                Strafen schneller zu verhaengen.
              </div>
            ) : (
              <div className="space-y-2">
                {katalog.map((eintrag) => (
                  <Card key={eintrag.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{eintrag.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatBetrag(eintrag.betrag)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => strafeAusKatalog(eintrag)}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Anwenden
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => katalogEintragLoeschen(eintrag.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ==================== Dialoge ==================== */}

      {/* Dialog: Strafe verhaengen */}
      <Dialog open={strafeDialogOffen} onOpenChange={setStrafeDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strafe verhaengen</DialogTitle>
            <DialogDescription>
              Waehlen Sie ein Mitglied und geben Sie Betrag sowie Grund an.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mitglied</Label>
              <Select
                value={formMemberId}
                onChange={(e) => setFormMemberId(e.target.value)}
                className="mt-1"
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
            {katalog.length > 0 && (
              <div>
                <Label>Aus Strafkatalog (optional)</Label>
                <Select
                  value={formKatalogId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFormKatalogId(id);
                    if (id) {
                      const k = katalog.find((k) => k.id === id);
                      if (k) {
                        setFormBetrag(k.betrag.toString());
                        setFormGrund(k.name);
                      }
                    }
                  }}
                  className="mt-1"
                >
                  <option value="">Manuell eingeben...</option>
                  {katalog.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({formatBetrag(k.betrag)})
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label>Betrag (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formBetrag}
                onChange={(e) => setFormBetrag(e.target.value)}
                placeholder="5.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Grund</Label>
              <Input
                value={formGrund}
                onChange={(e) => setFormGrund(e.target.value)}
                placeholder="z.B. Zu spaet zum Training"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStrafeDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={strafeVerhaengen}
                disabled={
                  !formMemberId ||
                  (!formBetrag && !formKatalogId) ||
                  speichernLadend
                }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {speichernLadend ? 'Wird gespeichert...' : 'Strafe verhaengen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Einzahlung */}
      <Dialog
        open={einzahlungDialogOffen}
        onOpenChange={setEinzahlungDialogOffen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einzahlung buchen</DialogTitle>
            <DialogDescription>
              Erfassen Sie eine Einzahlung in die Mannschaftskasse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mitglied</Label>
              <Select
                value={formMemberId}
                onChange={(e) => setFormMemberId(e.target.value)}
                className="mt-1"
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
              <Label>Betrag (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formBetrag}
                onChange={(e) => setFormBetrag(e.target.value)}
                placeholder="10.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Grund</Label>
              <Input
                value={formGrund}
                onChange={(e) => setFormGrund(e.target.value)}
                placeholder="z.B. Strafenzahlung Mai"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEinzahlungDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={einzahlungBuchen}
                disabled={
                  !formMemberId || !formBetrag || !formGrund || speichernLadend
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {speichernLadend ? 'Wird gespeichert...' : 'Einzahlung buchen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ausgabe */}
      <Dialog open={ausgabeDialogOffen} onOpenChange={setAusgabeDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ausgabe buchen</DialogTitle>
            <DialogDescription>
              Erfassen Sie eine Ausgabe aus der Mannschaftskasse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mitglied (wer hat bezahlt)</Label>
              <Select
                value={formMemberId}
                onChange={(e) => setFormMemberId(e.target.value)}
                className="mt-1"
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
              <Label>Betrag (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formBetrag}
                onChange={(e) => setFormBetrag(e.target.value)}
                placeholder="25.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Grund</Label>
              <Input
                value={formGrund}
                onChange={(e) => setFormGrund(e.target.value)}
                placeholder="z.B. Getraenke fuer Mannschaftsabend"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setAusgabeDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={ausgabeBuchen}
                disabled={
                  !formMemberId || !formBetrag || !formGrund || speichernLadend
                }
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {speichernLadend ? 'Wird gespeichert...' : 'Ausgabe buchen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Neuer Strafkatalog-Eintrag */}
      <Dialog open={katalogDialogOffen} onOpenChange={setKatalogDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Strafkatalog-Eintrag</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Eintrag fuer den Strafkatalog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name der Strafe</Label>
              <Input
                value={formKatalogName}
                onChange={(e) => setFormKatalogName(e.target.value)}
                placeholder="z.B. Zu spaet zum Training"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Betrag (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formKatalogBetrag}
                onChange={(e) => setFormKatalogBetrag(e.target.value)}
                placeholder="5.00"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setKatalogDialogOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={katalogEintragErstellen}
                disabled={
                  !formKatalogName || !formKatalogBetrag || speichernLadend
                }
              >
                {speichernLadend ? 'Wird gespeichert...' : 'Eintrag erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
