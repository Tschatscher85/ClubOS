'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, CheckCheck, Mail, Copy, Check, Workflow, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MitgliederTabelle } from '@/components/mitglieder/mitglieder-tabelle';
import { MitgliedFormular } from '@/components/mitglieder/mitglied-formular';
import { apiClient } from '@/lib/api-client';

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  memberNumber: string;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  sport: string[];
  parentEmail: string | null;
  status: string;
  joinDate: string;
  userId?: string | null;
}

interface Statistik {
  gesamt: number;
  aktiv: number;
  ausstehend: number;
  sportartenVerteilung?: Record<string, number>;
}

interface Vorlage {
  id: string;
  name: string;
  type: string;
}

interface WorkflowDaten {
  id: string;
  name: string;
  beschreibung: string | null;
  templateIds: string[];
  sportarten: string[];
  istAktiv: boolean;
  vorlagen: Array<{ id: string; name: string; type: string }>;
}

interface EinladungAntwort {
  link: string;
}

const SPORTARTEN_OPTIONEN = [
  { value: '', label: 'Alle Sportarten' },
  { value: 'FUSSBALL', label: 'Fussball' },
  { value: 'HANDBALL', label: 'Handball' },
  { value: 'BASKETBALL', label: 'Basketball' },
  { value: 'FOOTBALL', label: 'Football' },
  { value: 'TENNIS', label: 'Tennis' },
  { value: 'TURNEN', label: 'Turnen' },
  { value: 'SCHWIMMEN', label: 'Schwimmen' },
  { value: 'LEICHTATHLETIK', label: 'Leichtathletik' },
  { value: 'SONSTIGES', label: 'Sonstiges' },
];

const STATUS_OPTIONEN = [
  { value: '', label: 'Alle Status' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'PENDING', label: 'Ausstehend' },
  { value: 'INACTIVE', label: 'Inaktiv' },
  { value: 'CANCELLED', label: 'Ausgetreten' },
];

const FORMTYP_LABEL: Record<string, string> = {
  MITGLIEDSANTRAG: 'Mitgliedsantrag',
  EINVERSTAENDNIS: 'Einverstaendniserklaerung',
  DATENSCHUTZ: 'Datenschutzerklaerung',
  SONSTIGES: 'Sonstiges',
};

export default function MitgliederInhalt() {
  const router = useRouter();
  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const [bearbeitungsMitglied, setBearbeitungsMitglied] =
    useState<Mitglied | null>(null);

  // Filter
  const [suchbegriff, setSuchbegriff] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');

  // Einladung Dialog
  const [einladungOffen, setEinladungOffen] = useState(false);
  const [einladungVorname, setEinladungVorname] = useState('');
  const [einladungNachname, setEinladungNachname] = useState('');
  const [einladungEmail, setEinladungEmail] = useState('');
  const [einladungGeburtsdatum, setEinladungGeburtsdatum] = useState('');
  const [einladungSportarten, setEinladungSportarten] = useState<string[]>([]);
  const [einladungTemplateIds, setEinladungTemplateIds] = useState<string[]>([]);
  const [einladungVorlagen, setEinladungVorlagen] = useState<Vorlage[]>([]);
  const [einladungSendend, setEinladungSendend] = useState(false);
  const [einladungLink, setEinladungLink] = useState('');
  const [einladungErfolg, setEinladungErfolg] = useState(false);
  const [linkKopiert, setLinkKopiert] = useState(false);

  // Workflow
  const [workflows, setWorkflows] = useState<WorkflowDaten[]>([]);
  const [gewaehlterWorkflow, setGewaehlterWorkflow] = useState<string>('');
  const [einladungModus, setEinladungModus] = useState<'workflow' | 'manuell'>('workflow');

  // Batch-Freigabe Dialog
  const [freigabeDialogOffen, setFreigabeDialogOffen] = useState(false);
  const [freigabeLadend, setFreigabeLadend] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const [mitgliederDaten, statistikDaten] = await Promise.all([
        apiClient.get<Mitglied[]>('/mitglieder'),
        apiClient.get<Statistik>('/mitglieder/statistik'),
      ]);
      setMitglieder(mitgliederDaten);
      setStatistik(statistikDaten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const gefilterteMitglieder = useMemo(() => {
    return mitglieder.filter((m) => {
      if (suchbegriff) {
        const sucheLower = suchbegriff.toLowerCase();
        const nameMatch =
          m.firstName.toLowerCase().includes(sucheLower) ||
          m.lastName.toLowerCase().includes(sucheLower) ||
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(sucheLower) ||
          (m.email && m.email.toLowerCase().includes(sucheLower));
        if (!nameMatch) return false;
      }

      if (statusFilter && m.status !== statusFilter) return false;
      if (sportFilter && !m.sport.includes(sportFilter)) return false;

      return true;
    });
  }, [mitglieder, suchbegriff, statusFilter, sportFilter]);

  const ausstehendeMitglieder = useMemo(
    () => mitglieder.filter((m) => m.status === 'PENDING'),
    [mitglieder],
  );

  const handleBearbeiten = (mitglied: Mitglied) => {
    setBearbeitungsMitglied(mitglied);
    setFormularOffen(true);
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Mitglied wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/mitglieder/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  const handleFormularSchliessen = () => {
    setFormularOffen(false);
    setBearbeitungsMitglied(null);
  };

  const handleBatchFreigeben = async () => {
    setFreigabeLadend(true);
    try {
      const ids = ausstehendeMitglieder.map((m) => m.id);
      await apiClient.post('/mitglieder/batch-freigeben', { ids });
      setFreigabeDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler bei der Batch-Freigabe:', error);
    } finally {
      setFreigabeLadend(false);
    }
  };

  const handleEinladungOeffnen = async () => {
    setEinladungOffen(true);
    setEinladungErfolg(false);
    setEinladungLink('');
    setEinladungVorname('');
    setEinladungNachname('');
    setEinladungEmail('');
    setEinladungGeburtsdatum('');
    setEinladungSportarten([]);
    setEinladungTemplateIds([]);
    setGewaehlterWorkflow('');
    setEinladungModus('workflow');
    setLinkKopiert(false);
    try {
      const [vorlagen, workflowDaten] = await Promise.all([
        apiClient.get<Vorlage[]>('/formulare/vorlagen'),
        apiClient.get<WorkflowDaten[]>('/workflows'),
      ]);
      setEinladungVorlagen(vorlagen);
      setWorkflows(workflowDaten.filter((w) => w.istAktiv));
      // Falls keine Workflows vorhanden, direkt auf manuell wechseln
      if (workflowDaten.filter((w) => w.istAktiv).length === 0) {
        setEinladungModus('manuell');
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      setEinladungModus('manuell');
    }
  };

  const handleWorkflowAuswahl = (workflowId: string) => {
    setGewaehlterWorkflow(workflowId);
    const wf = workflows.find((w) => w.id === workflowId);
    if (wf) {
      setEinladungTemplateIds(wf.templateIds);
      setEinladungSportarten(wf.sportarten);
    }
  };

  const handleEinladungTemplateToggle = (templateId: string) => {
    setEinladungTemplateIds((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId],
    );
  };

  const handleEinladungSportartToggle = (sportart: string) => {
    setEinladungSportarten((prev) =>
      prev.includes(sportart)
        ? prev.filter((s) => s !== sportart)
        : [...prev, sportart],
    );
  };

  const handleEinladungSenden = async () => {
    if (!einladungVorname || !einladungNachname || !einladungEmail) return;
    setEinladungSendend(true);
    try {
      const antwort = await apiClient.post<EinladungAntwort>('/einladungen', {
        vorname: einladungVorname,
        nachname: einladungNachname,
        email: einladungEmail,
        templateIds: einladungTemplateIds.length > 0 ? einladungTemplateIds : undefined,
        sportarten: einladungSportarten.length > 0 ? einladungSportarten : undefined,
        geburtsdatum: einladungGeburtsdatum || undefined,
        workflowId: gewaehlterWorkflow || undefined,
      });
      setEinladungLink(antwort.link);
      setEinladungErfolg(true);
    } catch (error) {
      console.error('Fehler beim Senden der Einladung:', error);
    } finally {
      setEinladungSendend(false);
    }
  };

  const handleLinkKopieren = async () => {
    try {
      await navigator.clipboard.writeText(einladungLink);
      setLinkKopiert(true);
      setTimeout(() => setLinkKopiert(false), 2000);
    } catch {
      console.error('Link konnte nicht kopiert werden');
    }
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Mitglieder werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aktionen */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleEinladungOeffnen}>
          <Mail className="h-4 w-4 mr-2" />
          Mitglied einladen
        </Button>
        <Button onClick={() => setFormularOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Direkt anlegen
        </Button>
      </div>

      {/* Statistik-Karten */}
      {statistik && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gesamt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistik.gesamt}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktiv
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistik.aktiv}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ausstehend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {statistik.ausstehend}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sportarten-Verteilung */}
      {statistik?.sportartenVerteilung && Object.keys(statistik.sportartenVerteilung).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statistik.sportartenVerteilung).map(([sport, anzahl]) => (
            <Badge key={sport} variant="secondary" className="text-sm">
              {SPORTARTEN_OPTIONEN.find((o) => o.value === sport)?.label || sport}: {anzahl}
            </Badge>
          ))}
        </div>
      )}

      {/* Filter-Leiste */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Name oder E-Mail suchen..."
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44"
        >
          {STATUS_OPTIONEN.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="w-full sm:w-48"
        >
          {SPORTARTEN_OPTIONEN.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        {ausstehendeMitglieder.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setFreigabeDialogOffen(true)}
            className="whitespace-nowrap"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Ausstehende freigeben ({ausstehendeMitglieder.length})
          </Button>
        )}
      </div>

      {/* Tabelle */}
      <MitgliederTabelle
        mitglieder={gefilterteMitglieder}
        onBearbeiten={handleBearbeiten}
        onLoeschen={handleLoeschen}
        onKlick={(id) => router.push(`/mitglieder/${id}`)}
      />

      {/* Formular-Dialog */}
      <MitgliedFormular
        offen={formularOffen}
        onSchliessen={handleFormularSchliessen}
        onGespeichert={datenLaden}
        mitglied={bearbeitungsMitglied}
      />

      {/* Batch-Freigabe Bestaetigungsdialog */}
      <Dialog open={freigabeDialogOffen} onOpenChange={setFreigabeDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ausstehende Mitglieder freigeben</DialogTitle>
            <DialogDescription>
              Moechten Sie wirklich alle {ausstehendeMitglieder.length}{' '}
              ausstehenden Mitglieder freigeben? Diese werden als aktive
              Mitglieder markiert und erhalten automatisch einen Login.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setFreigabeDialogOffen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleBatchFreigeben} disabled={freigabeLadend}>
              {freigabeLadend
                ? 'Wird freigegeben...'
                : `${ausstehendeMitglieder.length} Mitglieder freigeben`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Einladung Dialog */}
      <Dialog open={einladungOffen} onOpenChange={setEinladungOffen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mitglied einladen</DialogTitle>
            <DialogDescription>
              Senden Sie eine Einladung per E-Mail. Das Mitglied fuellt die
              Unterlagen (Antrag, Einverstaendnis, Datenschutz) selbst aus und unterschreibt digital.
            </DialogDescription>
          </DialogHeader>

          {einladungErfolg ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  Einladung gesendet! Der Link wurde per E-Mail verschickt.
                  {einladungTemplateIds.length > 0 && (
                    <span className="block mt-1 font-normal">
                      {einladungTemplateIds.length} Formular(e) muessen ausgefuellt und unterschrieben werden.
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Einladungslink</Label>
                <div className="flex gap-2">
                  <Input
                    value={einladungLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLinkKopieren}
                  >
                    {linkKopiert ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEinladungOffen(false)}
                >
                  Schliessen
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Workflow-Auswahl oder Manuell */}
              {workflows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant={einladungModus === 'workflow' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEinladungModus('workflow')}
                    >
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Workflow verwenden
                    </Button>
                    <Button
                      variant={einladungModus === 'manuell' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setEinladungModus('manuell');
                        setGewaehlterWorkflow('');
                      }}
                    >
                      Manuell
                    </Button>
                  </div>
                </div>
              )}

              {/* Workflow-Auswahl */}
              {einladungModus === 'workflow' && workflows.length > 0 && (
                <div className="space-y-2">
                  <Label>Workflow-Paket *</Label>
                  <div className="space-y-2">
                    {workflows.map((wf) => (
                      <label
                        key={wf.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          gewaehlterWorkflow === wf.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="workflow"
                          checked={gewaehlterWorkflow === wf.id}
                          onChange={() => handleWorkflowAuswahl(wf.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{wf.name}</div>
                          {wf.beschreibung && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {wf.beschreibung}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {wf.vorlagen.map((v) => (
                              <Badge key={v.id} variant="secondary" className="text-xs">
                                {v.name}
                              </Badge>
                            ))}
                          </div>
                          {wf.sportarten.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {wf.sportarten.map((s) => (
                                <Badge key={s} variant="outline" className="text-xs">
                                  {SPORTARTEN_OPTIONEN.find((o) => o.value === s)?.label || s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Persoenliche Daten */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vorname *</Label>
                  <Input
                    value={einladungVorname}
                    onChange={(e) => setEinladungVorname(e.target.value)}
                    placeholder="Max"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nachname *</Label>
                  <Input
                    value={einladungNachname}
                    onChange={(e) => setEinladungNachname(e.target.value)}
                    placeholder="Mustermann"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-Mail *</Label>
                <Input
                  type="email"
                  value={einladungEmail}
                  onChange={(e) => setEinladungEmail(e.target.value)}
                  placeholder="max@beispiel.de"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Geburtsdatum</Label>
                <Input
                  type="date"
                  value={einladungGeburtsdatum}
                  onChange={(e) => setEinladungGeburtsdatum(e.target.value)}
                />
              </div>

              {/* Manuelle Auswahl nur im Manuell-Modus */}
              {einladungModus === 'manuell' && (
                <>
                  {/* Sportarten-Auswahl */}
                  <div className="space-y-2">
                    <Label>Sportarten</Label>
                    <div className="flex flex-wrap gap-2">
                      {SPORTARTEN_OPTIONEN.filter((o) => o.value).map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 cursor-pointer text-sm transition-colors ${
                            einladungSportarten.includes(opt.value)
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={einladungSportarten.includes(opt.value)}
                            onChange={() => handleEinladungSportartToggle(opt.value)}
                            className="rounded border-gray-300"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Formulare-Auswahl */}
                  {einladungVorlagen.length > 0 && (
                    <div className="space-y-2">
                      <Label>Formulare zum Ausfuellen</Label>
                      <p className="text-xs text-muted-foreground">
                        Waehlen Sie alle Formulare, die ausgefuellt und unterschrieben werden muessen
                      </p>
                      <div className="space-y-2">
                        {einladungVorlagen.map((v) => (
                          <label
                            key={v.id}
                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                              einladungTemplateIds.includes(v.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={einladungTemplateIds.includes(v.id)}
                              onChange={() => handleEinladungTemplateToggle(v.id)}
                              className="rounded border-gray-300"
                            />
                            <div>
                              <div className="font-medium text-sm">{v.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {FORMTYP_LABEL[v.type] || v.type}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEinladungOffen(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleEinladungSenden}
                  disabled={
                    !einladungVorname ||
                    !einladungNachname ||
                    !einladungEmail ||
                    (einladungModus === 'workflow' && !gewaehlterWorkflow) ||
                    einladungSendend
                  }
                >
                  {einladungSendend ? 'Wird gesendet...' : 'Einladung senden'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
