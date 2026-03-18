'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  FileText,
  ToggleLeft,
  ToggleRight,
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

interface Vorlage {
  id: string;
  name: string;
  type: string;
}

interface WorkflowVorlage {
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
  emailBetreff: string | null;
  emailText: string | null;
  istAktiv: boolean;
  vorlagen: WorkflowVorlage[];
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

const FORMTYP_LABEL: Record<string, string> = {
  MITGLIEDSANTRAG: 'Mitgliedsantrag',
  EINVERSTAENDNIS: 'Einverstaendnis',
  DATENSCHUTZ: 'Datenschutz',
  SONSTIGES: 'Sonstiges',
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDaten[]>([]);
  const [vorlagen, setVorlagen] = useState<Vorlage[]>([]);
  const [ladend, setLadend] = useState(true);

  // Dialog
  const [dialogOffen, setDialogOffen] = useState(false);
  const [bearbeitungsId, setBearbeitungsId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [gewaehlteTemplates, setGewaehlteTemplates] = useState<string[]>([]);
  const [gewaehlteSportarten, setGewaehlteSportarten] = useState<string[]>([]);
  const [emailBetreff, setEmailBetreff] = useState('');
  const [emailText, setEmailText] = useState('');
  const [speichernd, setSpeichernd] = useState(false);

  const datenLaden = useCallback(async () => {
    try {
      const [workflowDaten, vorlagenDaten] = await Promise.all([
        apiClient.get<WorkflowDaten[]>('/workflows'),
        apiClient.get<Vorlage[]>('/formulare/vorlagen'),
      ]);
      setWorkflows(workflowDaten);
      setVorlagen(vorlagenDaten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleNeu = () => {
    setBearbeitungsId(null);
    setName('');
    setBeschreibung('');
    setGewaehlteTemplates([]);
    setGewaehlteSportarten([]);
    setEmailBetreff('');
    setEmailText('');
    setDialogOffen(true);
  };

  const handleBearbeiten = (wf: WorkflowDaten) => {
    setBearbeitungsId(wf.id);
    setName(wf.name);
    setBeschreibung(wf.beschreibung || '');
    setGewaehlteTemplates(wf.templateIds);
    setGewaehlteSportarten(wf.sportarten);
    setEmailBetreff(wf.emailBetreff || '');
    setEmailText(wf.emailText || '');
    setDialogOffen(true);
  };

  const handleSpeichern = async () => {
    if (!name || gewaehlteTemplates.length === 0) return;
    setSpeichernd(true);
    try {
      const daten = {
        name,
        beschreibung: beschreibung || undefined,
        templateIds: gewaehlteTemplates,
        sportarten: gewaehlteSportarten,
        emailBetreff: emailBetreff || undefined,
        emailText: emailText || undefined,
      };

      if (bearbeitungsId) {
        await apiClient.put(`/workflows/${bearbeitungsId}`, daten);
      } else {
        await apiClient.post('/workflows', daten);
      }
      setDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setSpeichernd(false);
    }
  };

  const handleAktivToggle = async (wf: WorkflowDaten) => {
    try {
      await apiClient.put(`/workflows/${wf.id}`, { istAktiv: !wf.istAktiv });
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Workflow wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/workflows/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleTemplateToggle = (templateId: string) => {
    setGewaehlteTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId],
    );
  };

  const handleSportartToggle = (sportart: string) => {
    setGewaehlteSportarten((prev) =>
      prev.includes(sportart)
        ? prev.filter((s) => s !== sportart)
        : [...prev, sportart],
    );
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Workflows werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Workflows</h1>
            <p className="text-muted-foreground">
              Einladungs-Pakete fuer verschiedene Anwendungsfaelle
            </p>
          </div>
        </div>
        <Button onClick={handleNeu}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Workflow
        </Button>
      </div>

      {/* Erklaerung */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Was sind Workflows?</p>
        <p>
          Ein Workflow ist ein vorgefertigtes Paket aus Formularen und
          Sportarten. Statt bei jeder Einladung die Formulare einzeln
          auszuwaehlen, waehlt der Trainer einfach den passenden Workflow —
          z.B. &quot;Neues Mitglied Fussball&quot; oder &quot;Neues Mitglied
          Handball&quot;.
        </p>
      </div>

      {/* Workflows */}
      {workflows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-1">Noch keine Workflows erstellt</p>
          <p className="text-sm">
            Erstellen Sie Ihren ersten Workflow, damit Trainer per Knopfdruck
            Einladungen mit den richtigen Formularen versenden koennen.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <Card
              key={wf.id}
              className={`transition-opacity ${!wf.istAktiv ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{wf.name}</CardTitle>
                  <Badge variant={wf.istAktiv ? 'default' : 'secondary'}>
                    {wf.istAktiv ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                {wf.beschreibung && (
                  <p className="text-sm text-muted-foreground">
                    {wf.beschreibung}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Formulare */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Formulare
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {wf.vorlagen.map((v) => (
                      <Badge key={v.id} variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {v.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sportarten */}
                {wf.sportarten.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Sportarten
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {wf.sportarten.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {SPORTARTEN_LABEL[s] || s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aktionen */}
                <div className="flex gap-1 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBearbeiten(wf)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAktivToggle(wf)}
                  >
                    {wf.istAktiv ? (
                      <ToggleRight className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5 mr-1" />
                    )}
                    {wf.istAktiv ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoeschen(wf.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Workflow erstellen/bearbeiten */}
      <Dialog open={dialogOffen} onOpenChange={setDialogOffen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bearbeitungsId ? 'Workflow bearbeiten' : 'Neuen Workflow erstellen'}
            </DialogTitle>
            <DialogDescription>
              Stellen Sie ein Paket aus Formularen und Sportarten zusammen.
              Trainer koennen diesen Workflow dann per Knopfdruck verwenden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Neues Mitglied Fussball"
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="z.B. Alle Unterlagen fuer neue Fussball-Mitglieder"
              />
            </div>

            {/* Formulare */}
            <div className="space-y-2">
              <Label>Formulare *</Label>
              <p className="text-xs text-muted-foreground">
                Welche Formulare sollen bei diesem Workflow versendet werden?
              </p>
              {vorlagen.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 border rounded-lg">
                  Noch keine Formularvorlagen vorhanden. Erstellen Sie zuerst
                  Vorlagen unter Formulare.
                </p>
              ) : (
                <div className="space-y-2">
                  {vorlagen.map((v) => (
                    <label
                      key={v.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        gewaehlteTemplates.includes(v.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={gewaehlteTemplates.includes(v.id)}
                        onChange={() => handleTemplateToggle(v.id)}
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
              )}
            </div>

            {/* Sportarten */}
            <div className="space-y-2">
              <Label>Sportarten (vorbelegt)</Label>
              <p className="text-xs text-muted-foreground">
                Diese Sportarten werden automatisch beim Mitglied gesetzt
              </p>
              <div className="flex flex-wrap gap-2">
                {SPORTARTEN.map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 cursor-pointer text-sm transition-colors ${
                      gewaehlteSportarten.includes(s)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={gewaehlteSportarten.includes(s)}
                      onChange={() => handleSportartToggle(s)}
                      className="rounded border-gray-300"
                    />
                    {SPORTARTEN_LABEL[s]}
                  </label>
                ))}
              </div>
            </div>

            {/* E-Mail Anpassung */}
            <div className="space-y-2">
              <Label>E-Mail-Betreff (optional)</Label>
              <Input
                value={emailBetreff}
                onChange={(e) => setEmailBetreff(e.target.value)}
                placeholder="Standard: Einladung zum [Vereinsname]"
              />
            </div>

            <div className="space-y-2">
              <Label>E-Mail-Text (optional)</Label>
              <Textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Optionaler eigener Text in der Einladungs-E-Mail..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSpeichern}
                disabled={!name || gewaehlteTemplates.length === 0 || speichernd}
              >
                {speichernd
                  ? 'Wird gespeichert...'
                  : bearbeitungsId
                    ? 'Speichern'
                    : 'Workflow erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
