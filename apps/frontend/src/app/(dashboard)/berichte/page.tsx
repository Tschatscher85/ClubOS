'use client';

import { useState } from 'react';
import { FileBarChart, Download, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { API_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';

export default function BerichtePage() {
  const aktuellesJahr = new Date().getFullYear();
  const [jahr, setJahr] = useState(aktuellesJahr.toString());
  const [posterJahr, setPosterJahr] = useState(aktuellesJahr.toString());
  const [laed, setLaed] = useState(false);
  const [posterLaed, setPosterLaed] = useState(false);
  const { accessToken } = useAuthStore();

  const jahreOptionen = Array.from({ length: 4 }, (_, i) =>
    (aktuellesJahr - i).toString(),
  );

  const pdfHerunterladen = async (
    endpunkt: string,
    dateiname: string,
    setLadend: (v: boolean) => void,
  ) => {
    setLadend(true);
    try {
      const response = await fetch(`${API_BASE_URL}${endpunkt}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Herunterladen');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dateiname;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Fehler beim Erstellen des Berichts. Bitte versuchen Sie es erneut.');
    } finally {
      setLadend(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileBarChart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Berichte & Statistiken</h1>
          <p className="text-muted-foreground">
            Automatische Berichte fuer Foerderantraege und Verbandsmeldungen
          </p>
        </div>
      </div>

      {/* Jahresbericht Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Foerdermittel-Jahresbericht</CardTitle>
              <CardDescription>
                Automatischer Jahresbericht fuer Sportbund-Meldungen und
                kommunale Foerderantraege
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Der Jahresbericht enthaelt eine vollstaendige Uebersicht ueber
              Mitgliederentwicklung, Altersstruktur, Sportarten-Verteilung,
              Trainingsstatistiken und Veranstaltungen. Er wird als
              druckfertiges PDF erstellt.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Berichtsjahr</label>
                <Select
                  value={jahr}
                  onChange={(e) => setJahr(e.target.value)}
                  className="w-[180px]"
                >
                  {jahreOptionen.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                onClick={() =>
                  pdfHerunterladen(
                    `/berichte/jahresbericht?jahr=${jahr}`,
                    `Jahresbericht_${jahr}.pdf`,
                    setLaed,
                  )
                }
                disabled={laed}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {laed ? 'Wird erstellt...' : 'PDF herunterladen'}
              </Button>
            </div>

            <div className="mt-4 rounded-lg border bg-muted/50 p-4">
              <h4 className="text-sm font-medium mb-2">Inhalt des Berichts:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Vereinsdaten und Kontaktinformationen</li>
                <li>Mitgliederentwicklung (Zugaenge, Abgaenge, Nettoveraenderung)</li>
                <li>Altersstruktur der aktiven Mitglieder</li>
                <li>Sportarten-Verteilung</li>
                <li>Trainingsstatistik pro Team (Anzahl, Anwesenheitsquote)</li>
                <li>Veranstaltungsuebersicht (Turniere, Spiele, Sonstige)</li>
                <li>Zusammenfassung mit Kennzahlen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jahres-Statistik-Poster Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Image className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Jahres-Statistik-Poster</CardTitle>
              <CardDescription>
                Automatisch generiertes &quot;Vereinsjahr in Zahlen&quot; - ideal
                zum Teilen auf Social Media
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ein visuelles Poster im Querformat (A4) mit den wichtigsten
              Kennzahlen eures Vereinsjahres. Perfekt fuer die Mitgliederversammlung,
              Social Media oder die Vereinshomepage.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Jahr</label>
                <Select
                  value={posterJahr}
                  onChange={(e) => setPosterJahr(e.target.value)}
                  className="w-[180px]"
                >
                  {jahreOptionen.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                onClick={() =>
                  pdfHerunterladen(
                    `/berichte/jahresposter?jahr=${posterJahr}`,
                    `Vereinsjahr_${posterJahr}_Poster.pdf`,
                    setPosterLaed,
                  )
                }
                disabled={posterLaed}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {posterLaed ? 'Wird erstellt...' : 'Poster herunterladen'}
              </Button>
            </div>

            {/* Poster Vorschau */}
            <div className="mt-4 rounded-lg border bg-muted/30 p-6">
              <h4 className="text-sm font-medium mb-4">Vorschau:</h4>
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="text-center space-y-2">
                  <div className="h-2 w-full bg-primary rounded-t" />
                  <p className="text-lg font-bold text-primary">Vereinsname</p>
                  <p className="text-sm text-muted-foreground">
                    Unser Vereinsjahr {posterJahr} in Zahlen
                  </p>
                  <div className="h-px bg-primary/30 w-1/2 mx-auto my-3" />
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[
                      'Aktive Mitglieder',
                      'Teams',
                      'Trainingseinheiten',
                      'Spiele',
                      'Turniere',
                      'Anwesenheitsquote',
                      'Neue Mitglieder',
                      'Ehrenamtliche Std.',
                    ].map((label) => (
                      <div
                        key={label}
                        className="rounded bg-muted/50 p-2 text-center"
                      >
                        <p className="text-lg font-bold text-primary">--</p>
                        <p className="text-[10px] text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Powered by Vereinbase
                  </p>
                  <div className="h-2 w-full bg-primary rounded-b" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
