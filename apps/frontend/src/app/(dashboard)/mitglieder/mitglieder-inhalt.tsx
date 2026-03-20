'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, CheckCheck, Mail, Copy, Check, Workflow, Zap, Download, Upload, Printer, Cake } from 'lucide-react';
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
import { sportartenLaden, sportartLabel } from '@/lib/sportarten';

interface TeamInfo {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
}

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
  teamMembers?: Array<{ team: TeamInfo }>;
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
  const [rollenFilter, setRollenFilter] = useState('');
  const [geburtstagsMonat, setGeburtstagsMonat] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [eintrittAb, setEintrittAb] = useState('');
  const [eintrittBis, setEintrittBis] = useState('');

  // CSV Import
  const [importDialogOffen, setImportDialogOffen] = useState(false);
  const [importDaten, setImportDaten] = useState<string[][]>([]);
  const [importLadend, setImportLadend] = useState(false);

  // Sportarten-Optionen (dynamisch geladen)
  const [sportartenOptionen, setSportartenOptionen] = useState<{ value: string; label: string }[]>([{ value: '', label: 'Alle Sportarten' }]);

  // Rollen-Daten
  const [rollenMap, setRollenMap] = useState<Record<string, { vereinsRollen: string[]; farben: Record<string, string> }>>({});
  const [verfuegbareRollen, setVerfuegbareRollen] = useState<string[]>([]);

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
      const [mitgliederDaten, statistikDaten, benutzerDaten, vorlagenDaten, sportartenDaten] = await Promise.all([
        apiClient.get<Mitglied[]>('/mitglieder'),
        apiClient.get<Statistik>('/mitglieder/statistik'),
        apiClient.get<{ id: string; vereinsRollen: string[] }[]>('/benutzer/verwaltung/liste').catch(() => []),
        apiClient.get<{ name: string; farbe: string | null }[]>('/rollen-vorlagen').catch(() => []),
        sportartenLaden(),
      ]);
      setMitglieder(mitgliederDaten);
      setStatistik(statistikDaten);

      // Sportarten-Optionen aufbauen
      setSportartenOptionen([
        { value: '', label: 'Alle Sportarten' },
        ...sportartenDaten.map((s) => ({
          value: s.istVordefiniert ? s.name.toUpperCase().replace(/[^A-Z]/g, '') || s.name : s.name,
          label: s.name,
        })),
      ]);

      // Rollen-Map aufbauen: userId → { vereinsRollen, farben }
      const farbenMap: Record<string, string> = {};
      for (const v of vorlagenDaten) {
        farbenMap[v.name] = v.farbe || '#64748b';
      }
      const map: Record<string, { vereinsRollen: string[]; farben: Record<string, string> }> = {};
      const alleRollen = new Set<string>();
      for (const b of benutzerDaten) {
        map[b.id] = { vereinsRollen: b.vereinsRollen || [], farben: farbenMap };
        for (const r of b.vereinsRollen || []) alleRollen.add(r);
      }
      setRollenMap(map);
      setVerfuegbareRollen(Array.from(alleRollen).sort());
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
      if (teamFilter && m.teamMembers) {
        const hatTeam = m.teamMembers.some((tm) => tm.team.id === teamFilter);
        if (!hatTeam) return false;
      } else if (teamFilter && !m.teamMembers) {
        return false;
      }

      if (rollenFilter && m.userId) {
        const rollen = rollenMap[m.userId]?.vereinsRollen || [];
        if (!rollen.includes(rollenFilter)) return false;
      } else if (rollenFilter && !m.userId) {
        return false;
      }

      // Geburtstags-Monat Filter
      if (geburtstagsMonat && m.birthDate) {
        const monat = new Date(m.birthDate).getMonth() + 1;
        if (monat !== parseInt(geburtstagsMonat)) return false;
      } else if (geburtstagsMonat && !m.birthDate) {
        return false;
      }

      // Eintritts-Zeitraum Filter
      if (eintrittAb) {
        const ab = new Date(eintrittAb);
        if (new Date(m.joinDate) < ab) return false;
      }
      if (eintrittBis) {
        const bis = new Date(eintrittBis);
        bis.setHours(23, 59, 59, 999);
        if (new Date(m.joinDate) > bis) return false;
      }

      return true;
    });
  }, [mitglieder, suchbegriff, statusFilter, sportFilter, teamFilter, rollenFilter, rollenMap, geburtstagsMonat, eintrittAb, eintrittBis]);

  // Team-Optionen aus den Mitglied-Daten extrahieren
  const teamOptionen = useMemo(() => {
    const teams = new Map<string, string>();
    for (const m of mitglieder) {
      for (const tm of m.teamMembers || []) {
        teams.set(tm.team.id, `${tm.team.name} (${tm.team.ageGroup})`);
      }
    }
    return Array.from(teams.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [mitglieder]);

  const ausstehendeMitglieder = useMemo(
    () => mitglieder.filter((m) => m.status === 'PENDING'),
    [mitglieder],
  );

  const handleBearbeiten = (mitglied: Mitglied) => {
    setBearbeitungsMitglied(mitglied);
    setFormularOffen(true);
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Mitglied wirklich löschen?')) return;
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

  const handleExport = () => {
    const header = 'Nr;Name;E-Mail;Geburtsdatum;Telefon;Adresse;Sportarten;Status;Eintritt\n';
    const rows = gefilterteMitglieder.map(m =>
      `${m.memberNumber};${m.firstName} ${m.lastName};${m.email || ''};${m.birthDate ? new Date(m.birthDate).toLocaleDateString('de-DE') : ''};${m.phone || ''};${m.address || ''};${m.sport.join(',')};${m.status};${new Date(m.joinDate).toLocaleDateString('de-DE')}`
    ).join('\n');
    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mitglieder_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrucken = () => window.print();

  const handleImportDatei = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const zeilen = text.split('\n').filter(z => z.trim());
      // Erste Zeile ist Header, Rest sind Daten
      const daten = zeilen.slice(1).map(z => z.split(';').map(f => f.trim()));
      setImportDaten(daten);
      setImportDialogOffen(true);
    };
    reader.readAsText(datei, 'utf-8');
    // Input zuruecksetzen damit gleiche Datei nochmal gewaehlt werden kann
    e.target.value = '';
  };

  const handleImportBestaetigen = async () => {
    setImportLadend(true);
    try {
      for (const zeile of importDaten) {
        const [nr, name, email, geburtsdatum, telefon, adresse, sportarten, status] = zeile;
        const nameParts = (name || '').split(' ');
        const vorname = nameParts[0] || '';
        const nachname = nameParts.slice(1).join(' ') || '';
        // Datum von dd.mm.yyyy nach yyyy-mm-dd
        let birthDate: string | undefined;
        if (geburtsdatum) {
          const parts = geburtsdatum.split('.');
          if (parts.length === 3) {
            birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        await apiClient.post('/mitglieder', {
          firstName: vorname,
          lastName: nachname,
          email: email || undefined,
          birthDate: birthDate || undefined,
          phone: telefon || undefined,
          address: adresse || undefined,
          sport: sportarten ? sportarten.split(',').map(s => s.trim()) : [],
          status: status || 'ACTIVE',
        });
      }
      setImportDialogOffen(false);
      setImportDaten([]);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Import:', error);
    } finally {
      setImportLadend(false);
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
              {sportartLabel(sport)}: {anzahl}
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
          {sportartenOptionen.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        {verfuegbareRollen.length > 0 && (
          <Select
            value={rollenFilter}
            onChange={(e) => setRollenFilter(e.target.value)}
            className="w-full sm:w-44"
          >
            <option value="">Alle Rollen</option>
            {verfuegbareRollen.map((rolle) => (
              <option key={rolle} value={rolle}>{rolle}</option>
            ))}
          </Select>
        )}
        {teamOptionen.length > 0 && (
          <Select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="">Alle Teams</option>
            {teamOptionen.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </Select>
        )}
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

      {/* Erweiterte Filter + Aktionen */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select
          value={geburtstagsMonat}
          onChange={(e) => setGeburtstagsMonat(e.target.value)}
          className="w-full sm:w-52"
        >
          <option value="">Geburtstage (alle)</option>
          <option value="1">Januar</option>
          <option value="2">Februar</option>
          <option value="3">Maerz</option>
          <option value="4">April</option>
          <option value="5">Mai</option>
          <option value="6">Juni</option>
          <option value="7">Juli</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">Oktober</option>
          <option value="11">November</option>
          <option value="12">Dezember</option>
        </Select>
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Eintritt ab</Label>
          <Input
            type="date"
            value={eintrittAb}
            onChange={(e) => setEintrittAb(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">bis</Label>
          <Input
            type="date"
            value={eintrittBis}
            onChange={(e) => setEintrittBis(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            CSV Export
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              CSV Import
              <input
                type="file"
                accept=".csv"
                onChange={handleImportDatei}
                className="hidden"
              />
            </label>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDrucken}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
        </div>
      </div>

      {/* Tabelle */}
      <div data-print-bereich>
        <MitgliederTabelle
          mitglieder={gefilterteMitglieder}
          rollenMap={rollenMap}
          onBearbeiten={handleBearbeiten}
          onLoeschen={handleLoeschen}
          onKlick={(id) => router.push(`/mitglieder/${id}`)}
        />
      </div>

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

      {/* CSV Import Dialog */}
      <Dialog open={importDialogOffen} onOpenChange={setImportDialogOffen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>CSV Import - Vorschau</DialogTitle>
            <DialogDescription>
              {importDaten.length} Datensaetze erkannt. Bitte pruefen Sie die Daten vor dem Import.
              Erwartetes Format: Nr;Name;E-Mail;Geburtsdatum;Telefon;Adresse;Sportarten;Status
            </DialogDescription>
          </DialogHeader>
          {importDaten.length > 0 && (
            <div className="max-h-60 overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Nr</th>
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">E-Mail</th>
                    <th className="px-2 py-1 text-left">Geburtsdatum</th>
                    <th className="px-2 py-1 text-left">Sport</th>
                  </tr>
                </thead>
                <tbody>
                  {importDaten.map((zeile, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{zeile[0] || '-'}</td>
                      <td className="px-2 py-1">{zeile[1] || '-'}</td>
                      <td className="px-2 py-1">{zeile[2] || '-'}</td>
                      <td className="px-2 py-1">{zeile[3] || '-'}</td>
                      <td className="px-2 py-1">{zeile[6] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setImportDialogOffen(false); setImportDaten([]); }}>
              Abbrechen
            </Button>
            <Button onClick={handleImportBestaetigen} disabled={importLadend}>
              {importLadend ? 'Wird importiert...' : `${importDaten.length} Mitglieder importieren`}
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
                                  {sportartLabel(s)}
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
                      {sportartenOptionen.filter((o) => o.value).map((opt) => (
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
