'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  FileText,
  Plus,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Upload,
  Loader2,
  Sparkles,
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
import { API_BASE_URL } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

interface FormularFeld {
  name: string;
  label: string;
  typ: string;
  pflicht: boolean;
  optionen?: string[];
}

interface Vorlage {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  fields: FormularFeld[];
  _count?: { submissions: number };
}

interface Einreichung {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  daten: Record<string, unknown>;
  signatureUrl?: string;
  kommentar?: string;
  template: { name: string; type: string };
}

const TYP_LABEL: Record<string, string> = {
  MITGLIEDSANTRAG: 'Mitgliedsantrag',
  EINVERSTAENDNIS: 'Einverstaendnis',
  DATENSCHUTZ: 'Datenschutz',
  SONSTIGES: 'Sonstiges',
};

const STATUS_FARBE: Record<string, string> = {
  EINGEREICHT: 'bg-orange-100 text-orange-800',
  IN_PRUEFUNG: 'bg-blue-100 text-blue-800',
  GENEHMIGT: 'bg-green-100 text-green-800',
  ABGELEHNT: 'bg-red-100 text-red-800',
  ARCHIVIERT: 'bg-gray-100 text-gray-800',
};

const STATUS_LABEL: Record<string, string> = {
  EINGEREICHT: 'Eingereicht',
  IN_PRUEFUNG: 'In Pruefung',
  GENEHMIGT: 'Genehmigt',
  ABGELEHNT: 'Abgelehnt',
  ARCHIVIERT: 'Archiviert',
};

function labelZuName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function FormularePage() {
  const { benutzer } = useAuth();
  const [vorlagen, setVorlagen] = useState<Vorlage[]>([]);
  const [einreichungen, setEinreichungen] = useState<Einreichung[]>([]);
  const [ladend, setLadend] = useState(true);
  const [neueVorlageOffen, setNeueVorlageOffen] = useState(false);
  const [detailEinreichung, setDetailEinreichung] = useState<Einreichung | null>(null);

  // PDF-Upload Dialog
  const [uploadOffen, setUploadOffen] = useState(false);
  const [uploadDatei, setUploadDatei] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadTyp, setUploadTyp] = useState('MITGLIEDSANTRAG');
  const [uploadLadend, setUploadLadend] = useState(false);
  const [uploadFehler, setUploadFehler] = useState('');
  const [erkannteFelder, setErkannteFelder] = useState<FormularFeld[] | null>(null);
  const [uploadErfolg, setUploadErfolg] = useState(false);
  const dateiInputRef = useRef<HTMLInputElement>(null);

  // Neue Vorlage Formular
  const [vorlageName, setVorlageName] = useState('');
  const [vorlageTyp, setVorlageTyp] = useState('');
  const [vorlageFelder, setVorlageFelder] = useState<
    Array<{ label: string; typ: string; pflicht: boolean }>
  >([]);
  const [vorlageSpeichern, setVorlageSpeichern] = useState(false);

  // Detail-Dialog
  const [statusKommentar, setStatusKommentar] = useState('');
  const [statusAendernd, setStatusAendernd] = useState(false);

  const vorlagenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Vorlage[]>('/formulare/vorlagen');
      setVorlagen(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Vorlagen:', error);
    }
  }, []);

  const einreichungenLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Einreichung[]>('/formulare/einreichungen');
      setEinreichungen(daten);
    } catch (error) {
      console.error('Fehler beim Laden der Einreichungen:', error);
    }
  }, []);

  const datenLaden = useCallback(async () => {
    setLadend(true);
    await Promise.all([vorlagenLaden(), einreichungenLaden()]);
    setLadend(false);
  }, [vorlagenLaden, einreichungenLaden]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  // ==================== Manuelle Vorlage ====================

  const handleFeldHinzufuegen = useCallback(() => {
    setVorlageFelder((prev) => [...prev, { label: '', typ: 'text', pflicht: false }]);
  }, []);

  const handleFeldEntfernen = useCallback((index: number) => {
    setVorlageFelder((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFeldAendern = useCallback(
    (index: number, key: string, value: string | boolean) => {
      setVorlageFelder((prev) =>
        prev.map((feld, i) => (i === index ? { ...feld, [key]: value } : feld)),
      );
    },
    [],
  );

  const handleVorlageErstellen = useCallback(async () => {
    if (!vorlageName || !vorlageTyp) return;
    setVorlageSpeichern(true);
    try {
      const felder = vorlageFelder.map((f) => ({
        name: labelZuName(f.label),
        label: f.label,
        typ: f.typ,
        pflicht: f.pflicht,
      }));
      await apiClient.post('/formulare/vorlagen', {
        name: vorlageName,
        typ: vorlageTyp,
        felder,
      });
      setNeueVorlageOffen(false);
      setVorlageName('');
      setVorlageTyp('');
      setVorlageFelder([]);
      await vorlagenLaden();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    } finally {
      setVorlageSpeichern(false);
    }
  }, [vorlageName, vorlageTyp, vorlageFelder, vorlagenLaden]);

  // ==================== PDF Upload + KI ====================

  const handleUploadOeffnen = useCallback(() => {
    setUploadOffen(true);
    setUploadDatei(null);
    setUploadName('');
    setUploadTyp('MITGLIEDSANTRAG');
    setUploadLadend(false);
    setUploadFehler('');
    setErkannteFelder(null);
    setUploadErfolg(false);
  }, []);

  const handleDateiAuswahl = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei) return;

    if (datei.type !== 'application/pdf') {
      setUploadFehler('Bitte nur PDF-Dateien hochladen.');
      return;
    }

    if (datei.size > 10 * 1024 * 1024) {
      setUploadFehler('Datei darf maximal 10 MB gross sein.');
      return;
    }

    setUploadDatei(datei);
    setUploadFehler('');

    // Name aus Dateiname ableiten, falls noch leer
    if (!uploadName) {
      const nameOhneEndung = datei.name.replace(/\.pdf$/i, '');
      setUploadName(nameOhneEndung);
    }
  }, [uploadName]);

  const handlePdfAnalysieren = useCallback(async () => {
    if (!uploadDatei || !uploadName) return;

    setUploadLadend(true);
    setUploadFehler('');
    setErkannteFelder(null);

    try {
      const formData = new FormData();
      formData.append('datei', uploadDatei);
      formData.append('name', uploadName);

      const authState = JSON.parse(localStorage.getItem('clubos-auth') || '{}');
      const token = authState?.state?.accessToken;
      const response = await fetch(
        `${API_BASE_URL}/formulare/vorlagen/ki-konvertierung`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const fehlerDaten = await response.json().catch(() => null);
        throw new Error(
          fehlerDaten?.message || `Fehler ${response.status}: Analyse fehlgeschlagen.`,
        );
      }

      const ergebnis = await response.json();
      setErkannteFelder(ergebnis.felder);
      setUploadErfolg(true);
    } catch (error) {
      setUploadFehler(
        error instanceof Error ? error.message : 'Fehler bei der KI-Analyse.',
      );
    } finally {
      setUploadLadend(false);
    }
  }, [uploadDatei, uploadName]);

  const handleErkanntesFeldAendern = useCallback(
    (index: number, key: string, value: string | boolean) => {
      setErkannteFelder((prev) => {
        if (!prev) return prev;
        return prev.map((feld, i) =>
          i === index ? { ...feld, [key]: value } : feld,
        );
      });
    },
    [],
  );

  const handleErkanntesFeldEntfernen = useCallback((index: number) => {
    setErkannteFelder((prev) => {
      if (!prev) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleErkanntesFeldHinzufuegen = useCallback(() => {
    setErkannteFelder((prev) => [
      ...(prev || []),
      { name: '', label: '', typ: 'text', pflicht: false },
    ]);
  }, []);

  // ==================== Einreichung Status ====================

  const handleStatusAendern = useCallback(
    async (id: string, status: string) => {
      setStatusAendernd(true);
      try {
        await apiClient.put(`/formulare/einreichungen/${id}/status`, {
          status,
          kommentar: statusKommentar || undefined,
        });
        setDetailEinreichung(null);
        setStatusKommentar('');
        await einreichungenLaden();
      } catch (error) {
        console.error('Fehler beim Statuswechsel:', error);
      } finally {
        setStatusAendernd(false);
      }
    },
    [statusKommentar, einreichungenLaden],
  );

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Formulare werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Formulare</h1>
          <p className="text-muted-foreground">
            Vorlagen verwalten und Einreichungen pruefen
          </p>
        </div>
      </div>

      <Tabs defaultValue="vorlagen">
        <TabsList>
          <TabsTrigger value="vorlagen">Vorlagen</TabsTrigger>
          <TabsTrigger value="einreichungen">
            Einreichungen
            {einreichungen.filter((e) => e.status === 'EINGEREICHT').length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs px-1.5">
                {einreichungen.filter((e) => e.status === 'EINGEREICHT').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Vorlagen */}
        <TabsContent value="vorlagen" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleUploadOeffnen}>
              <Upload className="h-4 w-4 mr-2" />
              PDF hochladen (KI)
            </Button>
            <Button onClick={() => setNeueVorlageOffen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Manuell erstellen
            </Button>
          </div>

          {/* Erklaerung */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">So funktioniert es:</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Laden Sie Ihr bestehendes PDF-Formular hoch (Mitgliedsantrag, EWE, Datenschutz...)</li>
                  <li>Die KI erkennt automatisch alle Felder im Formular</li>
                  <li>Sie pruefen und passen die erkannten Felder an</li>
                  <li>Die digitale Vorlage wird gespeichert und kann Einladungen zugewiesen werden</li>
                  <li>Mitglieder fuellen das Formular online aus und unterschreiben digital</li>
                </ol>
              </div>
            </div>
          </div>

          {vorlagen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Noch keine Vorlagen erstellt. Laden Sie Ihr erstes PDF hoch oder erstellen Sie eine Vorlage manuell.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vorlagen.map((vorlage) => (
                <Card key={vorlage.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{vorlage.name}</CardTitle>
                      <Badge variant={vorlage.isActive ? 'default' : 'secondary'}>
                        {vorlage.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Badge variant="outline">
                        {TYP_LABEL[vorlage.type] || vorlage.type}
                      </Badge>
                      <span>{vorlage.fields?.length || 0} Felder</span>
                    </div>
                    {vorlage._count && (
                      <p className="text-xs text-muted-foreground">
                        {vorlage._count.submissions} Einreichungen
                      </p>
                    )}
                    <div className="mt-3">
                      <Link href={`/formulare/${vorlage.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Formular oeffnen
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Einreichungen */}
        <TabsContent value="einreichungen" className="space-y-4">
          {einreichungen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Noch keine Einreichungen vorhanden.
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Antragsteller</th>
                    <th className="text-left p-3 font-medium">Formular</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {einreichungen.map((einreichung) => (
                    <tr
                      key={einreichung.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => {
                        setDetailEinreichung(einreichung);
                        setStatusKommentar('');
                      }}
                    >
                      <td className="p-3">{einreichung.email}</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {einreichung.template.name}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_FARBE[einreichung.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {STATUS_LABEL[einreichung.status] || einreichung.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(einreichung.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== Dialog: PDF Upload + KI ==================== */}
      <Dialog open={uploadOffen} onOpenChange={setUploadOffen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              PDF-Formular hochladen
            </DialogTitle>
            <DialogDescription>
              Laden Sie Ihr bestehendes PDF-Formular hoch. Die KI erkennt
              automatisch alle Felder und erstellt eine digitale Vorlage.
            </DialogDescription>
          </DialogHeader>

          {uploadErfolg && erkannteFelder ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {erkannteFelder.length} Felder erkannt und Vorlage
                    &quot;{uploadName}&quot; erstellt!
                  </span>
                </div>
              </div>

              {/* Erkannte Felder anzeigen und bearbeiten */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Erkannte Felder</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleErkanntesFeldHinzufuegen}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Feld
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pruefen und passen Sie die Felder bei Bedarf an
                </p>

                {erkannteFelder.map((feld, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-2 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={feld.label}
                        onChange={(e) =>
                          handleErkanntesFeldAendern(index, 'label', e.target.value)
                        }
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Typ</Label>
                      <Select
                        value={feld.typ}
                        onChange={(e) =>
                          handleErkanntesFeldAendern(index, 'typ', e.target.value)
                        }
                      >
                        <option value="text">Text</option>
                        <option value="email">E-Mail</option>
                        <option value="date">Datum</option>
                        <option value="select">Auswahl</option>
                        <option value="checkbox">Checkbox</option>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pb-1">
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feld.pflicht}
                          onChange={(e) =>
                            handleErkanntesFeldAendern(index, 'pflicht', e.target.checked)
                          }
                          className="rounded"
                        />
                        Pflicht
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleErkanntesFeldEntfernen(index)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => {
                  setUploadOffen(false);
                  vorlagenLaden();
                }}>
                  Fertig
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Datei-Upload */}
              <div className="space-y-2">
                <Label>PDF-Datei *</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    uploadDatei
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={() => dateiInputRef.current?.click()}
                >
                  <input
                    ref={dateiInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleDateiAuswahl}
                  />
                  {uploadDatei ? (
                    <div className="space-y-1">
                      <FileText className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-green-800">
                        {uploadDatei.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {(uploadDatei.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        PDF hier ablegen oder klicken zum Auswaehlen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Max. 10 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name der Vorlage *</Label>
                  <Input
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="z.B. Mitgliedsantrag 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Typ *</Label>
                  <Select
                    value={uploadTyp}
                    onChange={(e) => setUploadTyp(e.target.value)}
                  >
                    <option value="MITGLIEDSANTRAG">Mitgliedsantrag</option>
                    <option value="EINVERSTAENDNIS">Einverstaendniserklaerung</option>
                    <option value="DATENSCHUTZ">Datenschutzerklaerung</option>
                    <option value="SONSTIGES">Sonstiges</option>
                  </Select>
                </div>
              </div>

              {uploadFehler && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {uploadFehler}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setUploadOffen(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handlePdfAnalysieren}
                  disabled={!uploadDatei || !uploadName || uploadLadend}
                >
                  {uploadLadend ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      KI analysiert PDF...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      PDF analysieren
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== Dialog: Manuelle Vorlage ==================== */}
      <Dialog open={neueVorlageOffen} onOpenChange={setNeueVorlageOffen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Formularvorlage</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Vorlage manuell — Feld fuer Feld.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={vorlageName}
                onChange={(e) => setVorlageName(e.target.value)}
                placeholder="z.B. Mitgliedsantrag 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={vorlageTyp} onChange={(e) => setVorlageTyp(e.target.value)}>
                <option value="">Typ waehlen...</option>
                <option value="MITGLIEDSANTRAG">Mitgliedsantrag</option>
                <option value="EINVERSTAENDNIS">Einverstaendniserklaerung</option>
                <option value="DATENSCHUTZ">Datenschutzerklaerung</option>
                <option value="SONSTIGES">Sonstiges</option>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Felder</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFeldHinzufuegen}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Feld hinzufuegen
                </Button>
              </div>

              {vorlageFelder.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Noch keine Felder. Fuegen Sie Felder hinzu, die im Formular
                  erscheinen sollen.
                </p>
              )}

              {vorlageFelder.map((feld, index) => (
                <div
                  key={index}
                  className="flex items-end gap-2 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={feld.label}
                      onChange={(e) =>
                        handleFeldAendern(index, 'label', e.target.value)
                      }
                      placeholder="z.B. Vorname"
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Label className="text-xs">Typ</Label>
                    <Select
                      value={feld.typ}
                      onChange={(e) => handleFeldAendern(index, 'typ', e.target.value)}
                    >
                      <option value="text">Text</option>
                      <option value="email">E-Mail</option>
                      <option value="date">Datum</option>
                      <option value="select">Auswahl</option>
                      <option value="checkbox">Checkbox</option>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feld.pflicht}
                        onChange={(e) =>
                          handleFeldAendern(index, 'pflicht', e.target.checked)
                        }
                        className="rounded"
                      />
                      Pflicht
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleFeldEntfernen(index)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setNeueVorlageOffen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleVorlageErstellen}
                disabled={!vorlageName || !vorlageTyp || vorlageSpeichern}
              >
                {vorlageSpeichern ? 'Wird erstellt...' : 'Vorlage erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Dialog: Einreichung Detail ==================== */}
      <Dialog
        open={detailEinreichung !== null}
        onOpenChange={(offen) => {
          if (!offen) {
            setDetailEinreichung(null);
            setStatusKommentar('');
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Einreichung pruefen</DialogTitle>
            <DialogDescription>
              {detailEinreichung?.template.name} von {detailEinreichung?.email}
            </DialogDescription>
          </DialogHeader>

          {detailEinreichung && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    STATUS_FARBE[detailEinreichung.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {STATUS_LABEL[detailEinreichung.status] || detailEinreichung.status}
                </span>
              </div>

              {/* Eingereichte Daten */}
              <div className="space-y-2">
                <Label>Eingereichte Daten</Label>
                <div className="rounded-lg border p-4 space-y-2">
                  {detailEinreichung.daten &&
                    Object.entries(detailEinreichung.daten).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">
                          {key}:
                        </span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Unterschrift */}
              {detailEinreichung.signatureUrl && (
                <div className="space-y-2">
                  <Label>Unterschrift</Label>
                  <div className="rounded-lg border p-4 bg-white">
                    <img
                      src={detailEinreichung.signatureUrl}
                      alt="Unterschrift"
                      className="max-h-32"
                    />
                  </div>
                </div>
              )}

              {/* Kommentar */}
              {detailEinreichung.kommentar && (
                <div className="space-y-2">
                  <Label>Bisheriger Kommentar</Label>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted">
                    {detailEinreichung.kommentar}
                  </p>
                </div>
              )}

              {/* Admin-Kommentar */}
              <div className="space-y-2">
                <Label>Kommentar (optional)</Label>
                <Textarea
                  value={statusKommentar}
                  onChange={(e) => setStatusKommentar(e.target.value)}
                  placeholder="Anmerkungen zur Entscheidung..."
                  rows={3}
                />
              </div>

              {/* Status-Aktionen */}
              <div className="flex flex-wrap gap-2 pt-2">
                {detailEinreichung.status !== 'IN_PRUEFUNG' && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleStatusAendern(detailEinreichung.id, 'IN_PRUEFUNG')
                    }
                    disabled={statusAendernd}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Pruefung
                  </Button>
                )}
                {detailEinreichung.status !== 'GENEHMIGT' && (
                  <Button
                    onClick={() =>
                      handleStatusAendern(detailEinreichung.id, 'GENEHMIGT')
                    }
                    disabled={statusAendernd}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Genehmigen
                  </Button>
                )}
                {detailEinreichung.status !== 'ABGELEHNT' && (
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleStatusAendern(detailEinreichung.id, 'ABGELEHNT')
                    }
                    disabled={statusAendernd}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Ablehnen
                  </Button>
                )}
                {detailEinreichung.status !== 'ARCHIVIERT' && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleStatusAendern(detailEinreichung.id, 'ARCHIVIERT')
                    }
                    disabled={statusAendernd}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archivieren
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
