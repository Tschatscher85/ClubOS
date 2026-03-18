'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, Save, Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import Link from 'next/link';

interface Vereinsdaten {
  // Vereinsregister
  vrNummer: string;
  amtsgericht: string;
  gruendungsjahr: string;
  // Adresse
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  bundesland: string;
  telefon: string;
  email: string;
  webseite: string;
  // Vorstand
  ersterVorsitzender: string;
  zweiterVorsitzender: string;
  kassenwart: string;
  schriftfuehrer: string;
  jugendleiter: string;
  // Versicherungen
  haftpflichtVersicherung: string;
  haftpflichtPolicennr: string;
  haftpflichtAblaufdatum: string;
  unfallVersicherung: string;
  unfallPolicennr: string;
  unfallAblaufdatum: string;
  // Finanzen
  steuernummer: string;
  iban: string;
  bic: string;
  bankname: string;
  gemeinnuetzigkeit: boolean;
  gemeinnuetzigkeitSeit: string;
  // Verbaende
  verbaende: string;
}

const LEERE_DATEN: Vereinsdaten = {
  vrNummer: '',
  amtsgericht: '',
  gruendungsjahr: '',
  strasse: '',
  hausnummer: '',
  plz: '',
  ort: '',
  bundesland: '',
  telefon: '',
  email: '',
  webseite: '',
  ersterVorsitzender: '',
  zweiterVorsitzender: '',
  kassenwart: '',
  schriftfuehrer: '',
  jugendleiter: '',
  haftpflichtVersicherung: '',
  haftpflichtPolicennr: '',
  haftpflichtAblaufdatum: '',
  unfallVersicherung: '',
  unfallPolicennr: '',
  unfallAblaufdatum: '',
  steuernummer: '',
  iban: '',
  bic: '',
  bankname: '',
  gemeinnuetzigkeit: false,
  gemeinnuetzigkeitSeit: '',
  verbaende: '',
};

export default function VereinsdatenPage() {
  const { benutzer } = useAuth();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [daten, setDaten] = useState<Vereinsdaten>(LEERE_DATEN);
  const [ladend, setLadend] = useState(false);
  const [speichernd, setSpeichernd] = useState(false);
  const [erfolg, setErfolg] = useState('');
  const [fehler, setFehler] = useState('');
  const [satzungLadend, setSatzungLadend] = useState(false);
  const [freistellungLadend, setFreistellungLadend] = useState(false);
  const [uploadErfolg, setUploadErfolg] = useState('');
  const [uploadFehler, setUploadFehler] = useState('');
  const satzungInputRef = useRef<HTMLInputElement>(null);
  const freistellungInputRef = useRef<HTMLInputElement>(null);

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  useEffect(() => {
    const laden = async () => {
      setLadend(true);
      try {
        const result = await apiClient.get<Vereinsdaten>('/vereine/vereinsdaten');
        setDaten({ ...LEERE_DATEN, ...result });
      } catch {
        // Noch keine Daten vorhanden
      } finally {
        setLadend(false);
      }
    };
    laden();
  }, []);

  const handleSpeichern = async () => {
    setSpeichernd(true);
    setFehler('');
    setErfolg('');
    try {
      await apiClient.put('/vereine/vereinsdaten', daten);
      setErfolg('Vereinsdaten gespeichert.');
      setTimeout(() => setErfolg(''), 5000);
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Speichern der Vereinsdaten.',
      );
    } finally {
      setSpeichernd(false);
    }
  };

  const handleSatzungUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei) return;
    setSatzungLadend(true);
    setUploadFehler('');
    setUploadErfolg('');
    try {
      const formData = new FormData();
      formData.append('datei', datei);
      await fetch(`${API_BASE_URL}/vereine/satzung`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      setUploadErfolg('Satzung erfolgreich hochgeladen.');
      setTimeout(() => setUploadErfolg(''), 5000);
    } catch (error) {
      setUploadFehler(
        error instanceof Error ? error.message : 'Fehler beim Hochladen der Satzung.',
      );
    } finally {
      setSatzungLadend(false);
      if (satzungInputRef.current) satzungInputRef.current.value = '';
    }
  };

  const handleFreistellungUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0];
    if (!datei) return;
    setFreistellungLadend(true);
    setUploadFehler('');
    setUploadErfolg('');
    try {
      const formData = new FormData();
      formData.append('datei', datei);
      await fetch(`${API_BASE_URL}/vereine/gemeinnuetzigkeit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      setUploadErfolg('Freistellungsbescheid erfolgreich hochgeladen.');
      setTimeout(() => setUploadErfolg(''), 5000);
    } catch (error) {
      setUploadFehler(
        error instanceof Error ? error.message : 'Fehler beim Hochladen des Freistellungsbescheids.',
      );
    } finally {
      setFreistellungLadend(false);
      if (freistellungInputRef.current) freistellungInputRef.current.value = '';
    }
  };

  const aendern = (feld: keyof Vereinsdaten, wert: string | boolean) => {
    setDaten((prev) => ({ ...prev, [feld]: wert }));
  };

  if (!istAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Vereinsdaten</h1>
            <p className="text-muted-foreground">Kein Zugriff. Nur fuer Admins verfuegbar.</p>
          </div>
        </div>
      </div>
    );
  }

  if (ladend) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Vereinsdaten</h1>
            <p className="text-muted-foreground">Daten werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/einstellungen">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurueck
          </Button>
        </Link>
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Vereinsdaten</h1>
          <p className="text-muted-foreground">Detaillierte Vereinsinformationen verwalten</p>
        </div>
      </div>

      {/* Vereinsregister */}
      <Card>
        <CardHeader>
          <CardTitle>Vereinsregister</CardTitle>
          <CardDescription>Registrierungsdaten des Vereins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>VR-Nummer</Label>
              <Input
                value={daten.vrNummer}
                onChange={(e) => aendern('vrNummer', e.target.value)}
                placeholder="z.B. VR 12345"
              />
            </div>
            <div className="space-y-2">
              <Label>Amtsgericht</Label>
              <Input
                value={daten.amtsgericht}
                onChange={(e) => aendern('amtsgericht', e.target.value)}
                placeholder="z.B. Amtsgericht Stuttgart"
              />
            </div>
            <div className="space-y-2">
              <Label>Gruendungsjahr</Label>
              <Input
                value={daten.gruendungsjahr}
                onChange={(e) => aendern('gruendungsjahr', e.target.value)}
                placeholder="z.B. 1920"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
          <CardDescription>Vereinsanschrift und Kontaktdaten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Strasse</Label>
              <Input
                value={daten.strasse}
                onChange={(e) => aendern('strasse', e.target.value)}
                placeholder="Musterstrasse"
              />
            </div>
            <div className="space-y-2">
              <Label>Hausnummer</Label>
              <Input
                value={daten.hausnummer}
                onChange={(e) => aendern('hausnummer', e.target.value)}
                placeholder="1a"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>PLZ</Label>
              <Input
                value={daten.plz}
                onChange={(e) => aendern('plz', e.target.value)}
                placeholder="73033"
              />
            </div>
            <div className="space-y-2">
              <Label>Ort</Label>
              <Input
                value={daten.ort}
                onChange={(e) => aendern('ort', e.target.value)}
                placeholder="Goeppingen"
              />
            </div>
            <div className="space-y-2">
              <Label>Bundesland</Label>
              <Input
                value={daten.bundesland}
                onChange={(e) => aendern('bundesland', e.target.value)}
                placeholder="Baden-Wuerttemberg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={daten.telefon}
                onChange={(e) => aendern('telefon', e.target.value)}
                placeholder="+49 7161 12345"
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                value={daten.email}
                onChange={(e) => aendern('email', e.target.value)}
                placeholder="info@verein.de"
              />
            </div>
            <div className="space-y-2">
              <Label>Webseite</Label>
              <Input
                value={daten.webseite}
                onChange={(e) => aendern('webseite', e.target.value)}
                placeholder="https://www.verein.de"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vorstand */}
      <Card>
        <CardHeader>
          <CardTitle>Vorstand</CardTitle>
          <CardDescription>Vorstandsmitglieder des Vereins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>1. Vorsitzender</Label>
              <Input
                value={daten.ersterVorsitzender}
                onChange={(e) => aendern('ersterVorsitzender', e.target.value)}
                placeholder="Vorname Nachname"
              />
            </div>
            <div className="space-y-2">
              <Label>2. Vorsitzender</Label>
              <Input
                value={daten.zweiterVorsitzender}
                onChange={(e) => aendern('zweiterVorsitzender', e.target.value)}
                placeholder="Vorname Nachname"
              />
            </div>
            <div className="space-y-2">
              <Label>Kassenwart</Label>
              <Input
                value={daten.kassenwart}
                onChange={(e) => aendern('kassenwart', e.target.value)}
                placeholder="Vorname Nachname"
              />
            </div>
            <div className="space-y-2">
              <Label>Schriftfuehrer</Label>
              <Input
                value={daten.schriftfuehrer}
                onChange={(e) => aendern('schriftfuehrer', e.target.value)}
                placeholder="Vorname Nachname"
              />
            </div>
            <div className="space-y-2">
              <Label>Jugendleiter</Label>
              <Input
                value={daten.jugendleiter}
                onChange={(e) => aendern('jugendleiter', e.target.value)}
                placeholder="Vorname Nachname"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Versicherungen */}
      <Card>
        <CardHeader>
          <CardTitle>Versicherungen</CardTitle>
          <CardDescription>Vereinsversicherungen mit Policennummern und Ablaufdaten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Haftpflichtversicherung</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Versicherer</Label>
                <Input
                  value={daten.haftpflichtVersicherung}
                  onChange={(e) => aendern('haftpflichtVersicherung', e.target.value)}
                  placeholder="z.B. ARAG"
                />
              </div>
              <div className="space-y-2">
                <Label>Policennummer</Label>
                <Input
                  value={daten.haftpflichtPolicennr}
                  onChange={(e) => aendern('haftpflichtPolicennr', e.target.value)}
                  placeholder="Policennummer"
                />
              </div>
              <div className="space-y-2">
                <Label>Ablaufdatum</Label>
                <Input
                  type="date"
                  value={daten.haftpflichtAblaufdatum}
                  onChange={(e) => aendern('haftpflichtAblaufdatum', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3">Unfallversicherung</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Versicherer</Label>
                <Input
                  value={daten.unfallVersicherung}
                  onChange={(e) => aendern('unfallVersicherung', e.target.value)}
                  placeholder="z.B. ARAG"
                />
              </div>
              <div className="space-y-2">
                <Label>Policennummer</Label>
                <Input
                  value={daten.unfallPolicennr}
                  onChange={(e) => aendern('unfallPolicennr', e.target.value)}
                  placeholder="Policennummer"
                />
              </div>
              <div className="space-y-2">
                <Label>Ablaufdatum</Label>
                <Input
                  type="date"
                  value={daten.unfallAblaufdatum}
                  onChange={(e) => aendern('unfallAblaufdatum', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finanzen */}
      <Card>
        <CardHeader>
          <CardTitle>Finanzen</CardTitle>
          <CardDescription>Steuer- und Bankdaten des Vereins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Steuernummer</Label>
              <Input
                value={daten.steuernummer}
                onChange={(e) => aendern('steuernummer', e.target.value)}
                placeholder="z.B. 12/345/67890"
              />
            </div>
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input
                value={daten.iban}
                onChange={(e) => aendern('iban', e.target.value)}
                placeholder="DE89 3704 0044 0532 0130 00"
              />
            </div>
            <div className="space-y-2">
              <Label>BIC</Label>
              <Input
                value={daten.bic}
                onChange={(e) => aendern('bic', e.target.value)}
                placeholder="COBADEFFXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Bankname</Label>
              <Input
                value={daten.bankname}
                onChange={(e) => aendern('bankname', e.target.value)}
                placeholder="z.B. Volksbank Fils"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={daten.gemeinnuetzigkeit}
                  onChange={(e) => aendern('gemeinnuetzigkeit', e.target.checked)}
                  className="rounded border-input"
                />
                Als gemeinnuetzig anerkannt
              </Label>
            </div>
            {daten.gemeinnuetzigkeit && (
              <div className="space-y-2">
                <Label>Gemeinnuetzig seit</Label>
                <Input
                  type="date"
                  value={daten.gemeinnuetzigkeitSeit}
                  onChange={(e) => aendern('gemeinnuetzigkeitSeit', e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dokumente hochladen */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumente</CardTitle>
          <CardDescription>Satzung und Freistellungsbescheid hochladen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Satzung (PDF)</Label>
              <input
                ref={satzungInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleSatzungUpload}
              />
              <Button
                variant="outline"
                onClick={() => satzungInputRef.current?.click()}
                disabled={satzungLadend}
              >
                <Upload className="h-4 w-4 mr-2" />
                {satzungLadend ? 'Wird hochgeladen...' : 'Satzung hochladen'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Freistellungsbescheid (PDF)</Label>
              <input
                ref={freistellungInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFreistellungUpload}
              />
              <Button
                variant="outline"
                onClick={() => freistellungInputRef.current?.click()}
                disabled={freistellungLadend}
              >
                <Upload className="h-4 w-4 mr-2" />
                {freistellungLadend ? 'Wird hochgeladen...' : 'Freistellungsbescheid hochladen'}
              </Button>
            </div>
          </div>
          {uploadErfolg && (
            <span className="text-sm text-green-600">{uploadErfolg}</span>
          )}
          {uploadFehler && (
            <span className="text-sm text-destructive">{uploadFehler}</span>
          )}
        </CardContent>
      </Card>

      {/* Verbaende */}
      <Card>
        <CardHeader>
          <CardTitle>Verbaende</CardTitle>
          <CardDescription>Mitgliedschaften in Sportverbaenden</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Verbandsmitgliedschaften</Label>
            <Textarea
              value={daten.verbaende}
              onChange={(e) => aendern('verbaende', e.target.value)}
              placeholder="z.B. Wuerttembergischer Fussballverband (wfv)&#10;Schwaeibscher Turnerbund (STB)"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Speichern */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSpeichern} disabled={speichernd}>
          <Save className="h-4 w-4 mr-2" />
          {speichernd ? 'Speichern...' : 'Vereinsdaten speichern'}
        </Button>
        {erfolg && (
          <span className="text-sm text-green-600">{erfolg}</span>
        )}
        {fehler && (
          <span className="text-sm text-destructive">{fehler}</span>
        )}
      </div>
    </div>
  );
}
