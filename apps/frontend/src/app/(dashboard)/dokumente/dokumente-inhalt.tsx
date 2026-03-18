'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  Download,
  Trash2,
  FileText,
  FileImage,
  File,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { API_BASE_URL } from '@/lib/constants';

interface Dokument {
  id: string;
  name: string;
  beschreibung?: string;
  kategorie: string;
  ordner?: string;
  dateiUrl: string;
  dateiGroesse: number;
  dateiTyp: string;
  createdAt: string;
}

const KATEGORIEN = [
  'Alle',
  'MITGLIEDSANTRAG',
  'VERTRAG',
  'RECHNUNG',
  'PROTOKOLL',
  'TRAININGSPLAN',
  'SATZUNG',
  'DATENSCHUTZ',
  'SONSTIGES',
] as const;

const KATEGORIE_LABEL: Record<string, string> = {
  MITGLIEDSANTRAG: 'Mitgliedsantrag',
  VERTRAG: 'Vertrag',
  RECHNUNG: 'Rechnung',
  PROTOKOLL: 'Protokoll',
  TRAININGSPLAN: 'Trainingsplan',
  SATZUNG: 'Satzung',
  DATENSCHUTZ: 'Datenschutz',
  SONSTIGES: 'Sonstiges',
};

const KATEGORIE_FARBE: Record<string, string> = {
  MITGLIEDSANTRAG: 'bg-blue-100 text-blue-800',
  VERTRAG: 'bg-purple-100 text-purple-800',
  RECHNUNG: 'bg-green-100 text-green-800',
  PROTOKOLL: 'bg-yellow-100 text-yellow-800',
  TRAININGSPLAN: 'bg-orange-100 text-orange-800',
  SATZUNG: 'bg-red-100 text-red-800',
  DATENSCHUTZ: 'bg-gray-100 text-gray-800',
  SONSTIGES: 'bg-slate-100 text-slate-800',
};

function dateiIcon(typ: string) {
  if (typ.includes('pdf')) return <FileText className="h-10 w-10 text-red-500" />;
  if (typ.includes('image')) return <FileImage className="h-10 w-10 text-blue-500" />;
  if (typ.includes('spreadsheet') || typ.includes('excel') || typ.includes('csv'))
    return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
  return <File className="h-10 w-10 text-gray-500" />;
}

function dateiGroesseFormatieren(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DokumenteInhalt() {
  const { benutzer } = useAuth();
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [ordnerListe, setOrdnerListe] = useState<string[]>([]);
  const [ladend, setLadend] = useState(true);
  const [uploadOffen, setUploadOffen] = useState(false);

  const [filterKategorie, setFilterKategorie] = useState('Alle');
  const [filterOrdner, setFilterOrdner] = useState('Alle');
  const [suchbegriff, setSuchbegriff] = useState('');

  const [uploadDatei, setUploadDatei] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadBeschreibung, setUploadBeschreibung] = useState('');
  const [uploadKategorie, setUploadKategorie] = useState('SONSTIGES');
  const [uploadOrdnerWert, setUploadOrdnerWert] = useState('');
  const [uploadLadend, setUploadLadend] = useState(false);
  const dateiInputRef = useRef<HTMLInputElement>(null);

  const datenLaden = useCallback(async () => {
    setLadend(true);
    try {
      const params = new URLSearchParams();
      if (filterKategorie !== 'Alle') params.set('kategorie', filterKategorie);
      if (filterOrdner !== 'Alle') params.set('ordner', filterOrdner);
      const query = params.toString() ? `?${params.toString()}` : '';

      const [dokumenteDaten, ordnerDaten] = await Promise.all([
        apiClient.get<Dokument[]>(`/dokumente${query}`),
        apiClient.get<string[]>('/dokumente/ordner'),
      ]);
      setDokumente(dokumenteDaten);
      setOrdnerListe(ordnerDaten);
    } catch (error) {
      console.error('Fehler beim Laden der Dokumente:', error);
    } finally {
      setLadend(false);
    }
  }, [filterKategorie, filterOrdner]);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleDateiAuswaehlen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei) return;
    if (datei.size > 20 * 1024 * 1024) {
      alert('Datei ist zu gross. Maximale Groesse: 20 MB.');
      return;
    }
    setUploadDatei(datei);
    if (!uploadName) {
      setUploadName(datei.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleHochladen = async () => {
    if (!uploadDatei || !uploadName || !uploadKategorie) return;
    setUploadLadend(true);
    try {
      const formData = new FormData();
      formData.append('datei', uploadDatei);
      formData.append('name', uploadName);
      if (uploadBeschreibung) formData.append('beschreibung', uploadBeschreibung);
      formData.append('kategorie', uploadKategorie);
      if (uploadOrdnerWert) formData.append('ordner', uploadOrdnerWert);

      const res = await fetch(`${API_BASE_URL}/dokumente`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.nachricht || 'Upload fehlgeschlagen.');
      }

      setUploadOffen(false);
      setUploadDatei(null);
      setUploadName('');
      setUploadBeschreibung('');
      setUploadKategorie('SONSTIGES');
      setUploadOrdnerWert('');
      if (dateiInputRef.current) dateiInputRef.current.value = '';
      await datenLaden();
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Hochladen.');
    } finally {
      setUploadLadend(false);
    }
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Dokument wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/dokumente/${id}`);
      await datenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  const gefilterteDokumente = dokumente.filter((dok) => {
    if (!suchbegriff) return true;
    const term = suchbegriff.toLowerCase();
    return (
      dok.name.toLowerCase().includes(term) ||
      dok.beschreibung?.toLowerCase().includes(term)
    );
  });

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Dokumente werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Dokumenten-Ablage</h1>
            <p className="text-muted-foreground">{dokumente.length} Dokumente</p>
          </div>
        </div>
        <Button onClick={() => setUploadOffen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Dokument hochladen
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select
            value={filterKategorie}
            onChange={(e) => setFilterKategorie(e.target.value)}
          >
            {KATEGORIEN.map((kat) => (
              <option key={kat} value={kat}>
                {kat === 'Alle' ? 'Alle Kategorien' : KATEGORIE_LABEL[kat] || kat}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <Select
            value={filterOrdner}
            onChange={(e) => setFilterOrdner(e.target.value)}
          >
            <option value="Alle">Alle Ordner</option>
            {ordnerListe.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </Select>
        </div>
        <div className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              placeholder="Dokument suchen..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Dokumente-Liste */}
      {gefilterteDokumente.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {dokumente.length === 0
            ? 'Noch keine Dokumente hochgeladen.'
            : 'Keine Dokumente fuer die ausgewaehlten Filter gefunden.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gefilterteDokumente.map((dok) => (
            <Card key={dok.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">{dateiIcon(dok.dateiTyp)}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-medium text-sm truncate">{dok.name}</h3>
                    {dok.beschreibung && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {dok.beschreibung}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          KATEGORIE_FARBE[dok.kategorie] || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {KATEGORIE_LABEL[dok.kategorie] || dok.kategorie}
                      </span>
                      {dok.ordner && (
                        <Badge variant="outline" className="text-xs">{dok.ordner}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>{dateiGroesseFormatieren(dok.dateiGroesse)}</span>
                      <span>
                        {new Date(dok.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex gap-1 pt-2">
                      <a href={`${API_BASE_URL}${dok.dateiUrl}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Herunterladen
                        </Button>
                      </a>
                      {istAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => handleLoeschen(dok.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Dokument hochladen */}
      <Dialog open={uploadOffen} onOpenChange={setUploadOffen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
            <DialogDescription>
              Laden Sie ein Dokument hoch (max. 20 MB).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Datei</Label>
              <Input ref={dateiInputRef} type="file" onChange={handleDateiAuswaehlen} />
              {uploadDatei && (
                <p className="text-xs text-muted-foreground">
                  {uploadDatei.name} ({dateiGroesseFormatieren(uploadDatei.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Dokumentname"
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung (optional)</Label>
              <Textarea
                value={uploadBeschreibung}
                onChange={(e) => setUploadBeschreibung(e.target.value)}
                placeholder="Kurze Beschreibung des Dokuments..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select
                value={uploadKategorie}
                onChange={(e) => setUploadKategorie(e.target.value)}
              >
                {KATEGORIEN.filter((k) => k !== 'Alle').map((kat) => (
                  <option key={kat} value={kat}>
                    {KATEGORIE_LABEL[kat] || kat}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ordner (optional)</Label>
              <Input
                value={uploadOrdnerWert}
                onChange={(e) => setUploadOrdnerWert(e.target.value)}
                placeholder="z.B. 2026/Vertraege"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadOffen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleHochladen}
                disabled={!uploadDatei || !uploadName || !uploadKategorie || uploadLadend}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadLadend ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
