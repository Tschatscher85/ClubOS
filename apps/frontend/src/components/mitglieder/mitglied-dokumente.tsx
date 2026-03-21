'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Download,
  Camera,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { useBenutzer } from '@/hooks/use-auth';

interface MitgliedDokumentData {
  id: string;
  name: string;
  beschreibung: string | null;
  dateiUrl: string;
  dateiGroesse: number;
  dateiTyp: string;
  kategorie: string;
  istFamilienantrag: boolean;
  hochgeladenVon: string;
  erstelltAm: string;
}

interface MitgliedDokumenteProps {
  memberId: string;
  mitgliedName: string;
}

const KATEGORIE_LABELS: Record<string, string> = {
  MITGLIEDSANTRAG: 'Mitgliedsantrag',
  BEITRITTSERKLAERUNG: 'Beitrittserklärung',
  KUENDIGUNG: 'Kündigung',
  EINVERSTAENDNIS: 'Einverständnis',
  AENDERUNGSANTRAG: 'Änderungsantrag',
  SONSTIGES: 'Sonstiges',
};

function formatGroesse(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function MitgliedDokumente({ memberId, mitgliedName }: MitgliedDokumenteProps) {
  const benutzer = useBenutzer();
  const [dokumente, setDokumente] = useState<MitgliedDokumentData[]>([]);
  const [ladend, setLadend] = useState(true);
  const [uploadOffen, setUploadOffen] = useState(false);
  const [uploadLadend, setUploadLadend] = useState(false);
  const [name, setName] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [kategorie, setKategorie] = useState('MITGLIEDSANTRAG');
  const [istFamilienantrag, setIstFamilienantrag] = useState(false);
  const [uploadFortschritt, setUploadFortschritt] = useState({ aktuell: 0, gesamt: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const istAdmin = benutzer && ['TRAINER', 'ADMIN', 'SUPERADMIN'].includes(benutzer.rolle);

  const datenLaden = useCallback(async () => {
    try {
      const result = await apiClient.get<MitgliedDokumentData[]>(
        `/mitglieder/${memberId}/dokumente`,
      );
      setDokumente(result);
    } catch {
      // Kein Zugriff oder keine Dokumente
    } finally {
      setLadend(false);
    }
  }, [memberId]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleUpload = async (dateien: FileList | null) => {
    if (!dateien || dateien.length === 0) return;
    setUploadLadend(true);
    setUploadFortschritt({ aktuell: 0, gesamt: dateien.length });

    for (let i = 0; i < dateien.length; i++) {
      setUploadFortschritt({ aktuell: i + 1, gesamt: dateien.length });
      const formData = new FormData();
      formData.append('datei', dateien[i]);
      formData.append('name', name || dateien[i].name.replace(/\.[^.]+$/, ''));
      formData.append('kategorie', kategorie);
      if (beschreibung) formData.append('beschreibung', beschreibung);
      formData.append('istFamilienantrag', istFamilienantrag ? 'true' : 'false');

      try {
        const storeJson = localStorage.getItem('auth-storage');
        const accessToken = storeJson ? JSON.parse(storeJson).state?.accessToken : null;
        await fetch(`${API_BASE_URL}/mitglieder/${memberId}/dokumente`, {
          method: 'POST',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          body: formData,
        });
      } catch (error) {
        console.error('Upload-Fehler:', error);
      }
    }

    setUploadLadend(false);
    setUploadFortschritt({ aktuell: 0, gesamt: 0 });
    setUploadOffen(false);
    setName('');
    setBeschreibung('');
    setKategorie('MITGLIEDSANTRAG');
    setIstFamilienantrag(false);
    datenLaden();
  };

  const handleLoeschen = async (dokumentId: string) => {
    if (!confirm('Dokument wirklich löschen?')) return;
    try {
      await apiClient.delete(`/mitglieder/dokumente/${dokumentId}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const handleDownload = (dokument: MitgliedDokumentData) => {
    window.open(`${API_BASE_URL}${dokument.dateiUrl}`, '_blank');
  };

  const istPdf = (typ: string) => typ === 'application/pdf';
  const istBild = (typ: string) => typ.startsWith('image/');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumente & Anträge
          </CardTitle>
          {istAdmin && (
            <Button variant="outline" size="sm" onClick={() => setUploadOffen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Dokument hochladen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {ladend ? (
          <p className="text-sm text-muted-foreground animate-pulse">Dokumente werden geladen...</p>
        ) : dokumente.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              Keine Dokumente vorhanden.
            </p>
            {istAdmin && (
              <p className="text-xs text-muted-foreground mt-1">
                Laden Sie alte Papieranträge als Scan oder Foto hoch.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {dokumente.map((dok) => (
              <div
                key={dok.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-md bg-muted p-2 shrink-0">
                  {istPdf(dok.dateiTyp) ? (
                    <FileText className="h-5 w-5 text-red-500" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{dok.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">
                      {KATEGORIE_LABELS[dok.kategorie] || dok.kategorie}
                    </Badge>
                    {dok.istFamilienantrag && (
                      <Badge variant="outline" className="text-[10px]">
                        <Users className="h-2.5 w-2.5 mr-0.5" />
                        Familienantrag
                      </Badge>
                    )}
                    <span>{formatGroesse(dok.dateiGroesse)}</span>
                    <span>{formatDatum(dok.erstelltAm)}</span>
                  </div>
                  {dok.beschreibung && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {dok.beschreibung}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(dok)}
                    title="Herunterladen / Anzeigen"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {istAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleLoeschen(dok.id)}
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Upload-Dialog */}
      <Dialog open={uploadOffen} onOpenChange={setUploadOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokument zu {mitgliedName} hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Bezeichnung</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Mitgliedsantrag 2019"
              />
            </div>

            <div className="space-y-2">
              <Label>Kategorie</Label>
              <select
                className="w-full border rounded-md p-2 text-sm"
                value={kategorie}
                onChange={(e) => setKategorie(e.target.value)}
              >
                {Object.entries(KATEGORIE_LABELS).map(([wert, label]) => (
                  <option key={wert} value={wert}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Beschreibung (optional)</Label>
              <Input
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="z.B. Originalantrag von 2019, handschriftlich"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer rounded-md border p-3 hover:bg-muted/50">
              <input
                type="checkbox"
                checked={istFamilienantrag}
                onChange={(e) => setIstFamilienantrag(e.target.checked)}
                className="rounded border-gray-300 mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">Familienantrag</span>
                <p className="text-xs text-muted-foreground">
                  Wenn aktiviert, können auch verknüpfte Familienmitglieder (Kinder, Partner)
                  dieses Dokument einsehen.
                </p>
              </div>
            </label>

            {/* Upload-Bereich: Datei oder Kamera */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files); }}
              >
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs font-medium">PDF oder Bild</p>
                <p className="text-[10px] text-muted-foreground">Datei auswählen</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </div>

              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs font-medium">Kamera / Scan</p>
                <p className="text-[10px] text-muted-foreground">Direkt fotografieren</p>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              PDF, PNG, JPG oder WebP — max. 20 MB pro Datei — mehrere Dateien möglich
            </p>

            {uploadLadend && (
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: uploadFortschritt.gesamt > 0
                        ? `${(uploadFortschritt.aktuell / uploadFortschritt.gesamt) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Datei {uploadFortschritt.aktuell} von {uploadFortschritt.gesamt} wird hochgeladen...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
