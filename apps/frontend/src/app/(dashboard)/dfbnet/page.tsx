'use client';

import { useState, useCallback } from 'react';
import {
  Database,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';

interface ImportErgebnis {
  importiert: number;
  uebersprungen: number;
  fehler: string[];
}

export default function DfbnetPage() {
  const [datei, setDatei] = useState<File | null>(null);
  const [importiert, setImportiert] = useState(false);
  const [ergebnis, setErgebnis] = useState<ImportErgebnis | null>(null);
  const [ladend, setLadend] = useState(false);
  const [fehlerMeldung, setFehlerMeldung] = useState<string | null>(null);
  const [dragAktiv, setDragAktiv] = useState(false);

  const token = useAuthStore((s) => s.accessToken);

  const dateiAuswaehlen = useCallback(
    (ausgewaehlteDatei: File) => {
      if (!ausgewaehlteDatei.name.toLowerCase().endsWith('.csv')) {
        setFehlerMeldung(
          'Nur CSV-Dateien werden unterstuetzt. Bitte waehlen Sie eine .csv-Datei.',
        );
        return;
      }
      if (ausgewaehlteDatei.size > 5 * 1024 * 1024) {
        setFehlerMeldung(
          'Die Datei ist zu gross. Maximale Dateigroesse: 5 MB.',
        );
        return;
      }
      setDatei(ausgewaehlteDatei);
      setFehlerMeldung(null);
      setErgebnis(null);
      setImportiert(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragAktiv(false);
      const abgelegteDatei = e.dataTransfer.files[0];
      if (abgelegteDatei) {
        dateiAuswaehlen(abgelegteDatei);
      }
    },
    [dateiAuswaehlen],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragAktiv(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragAktiv(false);
  }, []);

  const csvImportieren = async () => {
    if (!datei) return;

    setLadend(true);
    setFehlerMeldung(null);

    try {
      const formData = new FormData();
      formData.append('datei', datei);

      const antwort = await fetch(`${API_BASE_URL}/dfbnet/importieren`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!antwort.ok) {
        const fehlerDaten = await antwort.json().catch(() => null);
        throw new Error(
          fehlerDaten?.message || `Serverfehler: ${antwort.status}`,
        );
      }

      const daten: ImportErgebnis = await antwort.json();
      setErgebnis(daten);
      setImportiert(true);
    } catch (fehler) {
      setFehlerMeldung(
        fehler instanceof Error
          ? fehler.message
          : 'Ein unbekannter Fehler ist aufgetreten.',
      );
    } finally {
      setLadend(false);
    }
  };

  const csvExportieren = async () => {
    setLadend(true);
    setFehlerMeldung(null);

    try {
      const antwort = await fetch(`${API_BASE_URL}/dfbnet/exportieren`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!antwort.ok) {
        throw new Error(`Serverfehler: ${antwort.status}`);
      }

      const blob = await antwort.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dfbnet-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (fehler) {
      setFehlerMeldung(
        fehler instanceof Error
          ? fehler.message
          : 'Export fehlgeschlagen.',
      );
    } finally {
      setLadend(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">DFBnet Import/Export</h1>
          <p className="text-muted-foreground">
            Mitgliederdaten zwischen Vereinbase und DFBnet austauschen
          </p>
        </div>
      </div>

      {/* Info-Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex gap-3 pt-6">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Hinweis zum DFBnet</p>
            <p>
              DFBnet bietet keine öffentliche API an. Der Datenaustausch
              erfolgt ausschliesslich ueber CSV-Dateien (Semikolon-getrennt).
              Exportieren Sie Ihre Mitgliederdaten im DFBnet unter{' '}
              <span className="font-medium">
                Verein &rarr; Mitglieder &rarr; Export
              </span>{' '}
              als CSV-Datei und laden Sie diese hier hoch.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fehlermeldung */}
      {fehlerMeldung && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">{fehlerMeldung}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFehlerMeldung(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              CSV importieren
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Laden Sie eine DFBnet-CSV-Datei hoch, um Mitglieder in Vereinbase zu
              importieren. Bestehende Mitglieder (gleicher Name und
              Geburtsdatum) werden uebersprungen.
            </p>

            {/* Drag & Drop Bereich */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragAktiv
                  ? 'border-primary bg-primary/5'
                  : datei
                    ? 'border-green-400 bg-green-50'
                    : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files?.[0]) {
                    dateiAuswaehlen(target.files[0]);
                  }
                };
                input.click();
              }}
            >
              {datei ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-green-600" />
                  <p className="text-sm font-medium">{datei.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(datei.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    CSV-Datei hierher ziehen
                  </p>
                  <p className="text-xs text-muted-foreground">
                    oder klicken zum Auswaehlen (max. 5 MB)
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={csvImportieren}
              disabled={!datei || ladend}
              className="w-full"
            >
              {ladend ? 'Wird importiert...' : 'Importieren'}
            </Button>

            {/* Import-Ergebnis */}
            {importiert && ergebnis && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Import abgeschlossen</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Importiert: {ergebnis.importiert} Mitglieder</p>
                    <p>
                      Uebersprungen (Duplikate): {ergebnis.uebersprungen}
                    </p>
                    {ergebnis.fehler.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-orange-700">
                          Fehler ({ergebnis.fehler.length}):
                        </p>
                        <ul className="list-disc list-inside text-xs text-orange-600 mt-1 max-h-32 overflow-y-auto">
                          {ergebnis.fehler.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              CSV exportieren
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exportieren Sie alle aktiven Mitglieder als DFBnet-kompatible
              CSV-Datei. Die Datei kann direkt im DFBnet importiert werden.
            </p>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium">Enthaltene Felder:</h4>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>Vorname, Nachname</span>
                <span>Geburtsdatum</span>
                <span>Adresse (Strasse, PLZ, Ort)</span>
                <span>Telefon, E-Mail</span>
                <span>Eintrittsdatum</span>
                <span>Abteilung (Sportart)</span>
                <span>Mitgliedsnummer</span>
              </div>
            </div>

            <Button
              onClick={csvExportieren}
              disabled={ladend}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {ladend ? 'Wird exportiert...' : 'CSV herunterladen'}
            </Button>

            {/* Anleitung */}
            <div className="rounded-lg bg-muted p-4">
              <h4 className="text-sm font-medium mb-2">
                Anleitung: CSV im DFBnet importieren
              </h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>CSV-Datei ueber den Button oben herunterladen</li>
                <li>Im DFBnet anmelden und zu &quot;Verein&quot; navigieren</li>
                <li>&quot;Mitglieder&quot; &rarr; &quot;Import&quot; waehlen</li>
                <li>Heruntergeladene CSV-Datei auswaehlen</li>
                <li>Feldzuordnung pruefen und Import starten</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
