'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, ArrowLeft, CheckCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { UnterschriftPad } from '@/components/unterschrift/unterschrift-pad';
import { AdressSuche } from '@/components/ui/adress-suche';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

interface MitgliedKurz {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  joinDate: string;
  sport: string[];
  memberNumber: string;
}

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
  fields: FormularFeld[];
}

const TYP_LABEL: Record<string, string> = {
  MITGLIEDSANTRAG: 'Mitgliedsantrag',
  EINVERSTAENDNIS: 'Einverstaendnis',
  DATENSCHUTZ: 'Datenschutz',
  SONSTIGES: 'Sonstiges',
};

export default function FormularAusfuellenPage() {
  const params = useParams();
  const router = useRouter();
  const { benutzer } = useAuth();
  const templateId = params.templateId as string;

  const [vorlage, setVorlage] = useState<Vorlage | null>(null);
  const [ladend, setLadend] = useState(true);
  const [absenden, setAbsenden] = useState(false);
  const [erfolg, setErfolg] = useState(false);

  // Mitglieder fuer Vorauswahl
  const [mitglieder, setMitglieder] = useState<MitgliedKurz[]>([]);
  const [gewaehltesMitglied, setGewaehltesMitglied] = useState('');

  // Formular-Daten
  const [email, setEmail] = useState('');
  const [formDaten, setFormDaten] = useState<Record<string, string | boolean>>({});
  const [signatureUrl, setSignatureUrl] = useState('');

  const vorlageLaden = useCallback(async () => {
    try {
      const [daten, mitgliederDaten] = await Promise.all([
        apiClient.get<Vorlage>(`/formulare/vorlagen/${templateId}`),
        apiClient.get<MitgliedKurz[]>('/mitglieder').catch(() => []),
      ]);
      setVorlage(daten);
      setMitglieder(mitgliederDaten);
    } catch (error) {
      console.error('Fehler beim Laden der Vorlage:', error);
    } finally {
      setLadend(false);
    }
  }, [templateId]);

  useEffect(() => {
    vorlageLaden();
  }, [vorlageLaden]);

  useEffect(() => {
    if (benutzer?.email) {
      setEmail(benutzer.email);
    }
  }, [benutzer]);

  // Mitglied vorauswählen -> Felder ausfüllen
  const handleMitgliedVorauswahl = useCallback((mitgliedId: string) => {
    setGewaehltesMitglied(mitgliedId);
    if (!mitgliedId) return;
    const m = mitglieder.find((mg) => mg.id === mitgliedId);
    if (!m) return;

    // E-Mail setzen
    if (m.email) setEmail(m.email);

    // Adresse aufteilen (Format: "Strasse, PLZ Ort" oder "Strasse")
    let strasse = '';
    let plz = '';
    let ort = '';
    if (m.address) {
      const teile = m.address.split(',').map((t) => t.trim());
      strasse = teile[0] || '';
      if (teile[1]) {
        const plzOrt = teile[1].match(/^(\d{4,5})\s*(.*)$/);
        if (plzOrt) {
          plz = plzOrt[1];
          ort = plzOrt[2] || '';
        } else {
          ort = teile[1];
        }
      }
    }

    // Geburtsdatum formatieren
    let gebDatum = '';
    if (m.birthDate) {
      gebDatum = m.birthDate.split('T')[0];
    }

    // Felder intelligent mappen (verschiedene Feldnamen beruecksichtigen)
    const neueFormDaten: Record<string, string | boolean> = { ...formDaten };
    const feldMap: Record<string, string> = {
      // Name-Felder
      name: m.lastName,
      nachname: m.lastName,
      lastname: m.lastName,
      last_name: m.lastName,
      vorname: m.firstName,
      firstname: m.firstName,
      first_name: m.firstName,
      // Kontakt
      email: m.email || '',
      email_adresse: m.email || '',
      e_mail_adresse: m.email || '',
      telefon: m.phone || '',
      phone: m.phone || '',
      // Adresse
      strasse: strasse,
      strasse_hausnummer: strasse,
      str: strasse,
      plz: plz,
      postleitzahl: plz,
      ort: ort,
      wohnort: ort,
      stadt: ort,
      // Datum
      geb_datum: gebDatum,
      geburtsdatum: gebDatum,
      geburtstag: gebDatum,
      birth_date: gebDatum,
      eintrittsdatum: m.joinDate ? m.joinDate.split('T')[0] : '',
    };

    if (vorlage) {
      for (const feld of vorlage.fields) {
        const key = feld.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        for (const [pattern, wert] of Object.entries(feldMap)) {
          if (key.includes(pattern) && wert) {
            neueFormDaten[feld.name] = wert;
            break;
          }
        }
      }
    }

    setFormDaten(neueFormDaten);
  }, [mitglieder, formDaten, vorlage]);

  const handleFeldAendern = useCallback((name: string, value: string | boolean) => {
    setFormDaten((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAbsenden = useCallback(async () => {
    if (!email || !vorlage) return;

    // Pflichtfelder pruefen
    const fehlend = vorlage.fields.filter(
      (f) => f.pflicht && !formDaten[f.name] && formDaten[f.name] !== false,
    );
    if (fehlend.length > 0) {
      alert(
        `Bitte fuellen Sie folgende Pflichtfelder aus: ${fehlend
          .map((f) => f.label)
          .join(', ')}`,
      );
      return;
    }

    setAbsenden(true);
    try {
      await apiClient.post(`/formulare/vorlagen/${templateId}/einreichen`, {
        email,
        daten: formDaten,
        signatureUrl: signatureUrl || undefined,
      });
      setErfolg(true);
    } catch (error) {
      console.error('Fehler beim Einreichen:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Fehler beim Einreichen des Formulars.',
      );
    } finally {
      setAbsenden(false);
    }
  }, [email, vorlage, formDaten, signatureUrl, templateId]);

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Formular wird geladen...
        </div>
      </div>
    );
  }

  if (!vorlage) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Formularvorlage nicht gefunden.
        </p>
        <Link href="/formulare">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurueck zu Formulare
          </Button>
        </Link>
      </div>
    );
  }

  if (erfolg) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Antrag eingereicht</h2>
            <p className="text-muted-foreground">
              Ihr Antrag wurde erfolgreich eingereicht. Sie erhalten eine
              Bestaetigung per E-Mail.
            </p>
            <Link href="/formulare">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurueck zu Formulare
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/formulare">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{vorlage.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {TYP_LABEL[vorlage.type] || vorlage.type}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formular ausfuellen</CardTitle>
          <CardDescription>
            Bitte fuellen Sie alle Pflichtfelder (*) aus und unterschreiben Sie
            am Ende.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mitglied vorauswählen */}
          {mitglieder.length > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <Label className="flex items-center gap-2 text-primary font-medium">
                <UserCheck className="h-4 w-4" />
                Mitglied vorauswählen (optional)
              </Label>
              <Select
                value={gewaehltesMitglied}
                onChange={(e) => handleMitgliedVorauswahl(e.target.value)}
              >
                <option value="">-- Manuell ausfuellen --</option>
                {mitglieder.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.email || m.memberNumber})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Waehlen Sie ein bestehendes Mitglied um die Felder automatisch auszufuellen.
              </p>
            </div>
          )}

          {/* E-Mail (immer erforderlich) */}
          <div className="space-y-2">
            <Label>
              E-Mail-Adresse <span className="text-destructive">*</span>
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre@email.de"
              required
            />
          </div>

          {/* Dynamische Felder */}
          {vorlage.fields.map((feld) => (
            <div key={feld.name} className="space-y-2">
              {feld.typ === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formDaten[feld.name]}
                    onChange={(e) =>
                      handleFeldAendern(feld.name, e.target.checked)
                    }
                    className="rounded"
                  />
                  <span className="text-sm">
                    {feld.label}
                    {feld.pflicht && (
                      <span className="text-destructive"> *</span>
                    )}
                  </span>
                </label>
              ) : (
                <>
                  <Label>
                    {feld.label}
                    {feld.pflicht && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  {feld.typ === 'radio' && feld.optionen ? (
                    <div className="flex flex-wrap gap-4">
                      {feld.optionen.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={feld.name}
                            value={opt}
                            checked={(formDaten[feld.name] as string) === opt}
                            onChange={(e) => handleFeldAendern(feld.name, e.target.value)}
                            className="accent-primary"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : feld.typ === 'select' && feld.optionen ? (
                    <Select
                      value={(formDaten[feld.name] as string) || ''}
                      onChange={(e) => handleFeldAendern(feld.name, e.target.value)}
                    >
                      <option value="">Bitte waehlen...</option>
                      {feld.optionen.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Select>
                  ) : /strasse|adresse|street|address/i.test(feld.name) ? (
                    <AdressSuche
                      value={(formDaten[feld.name] as string) || ''}
                      onChange={(val) => handleFeldAendern(feld.name, val)}
                      placeholder={feld.label}
                    />
                  ) : (
                    <Input
                      type={feld.typ === 'email' ? 'email' : feld.typ === 'date' ? 'date' : 'text'}
                      value={(formDaten[feld.name] as string) || ''}
                      onChange={(e) =>
                        handleFeldAendern(feld.name, e.target.value)
                      }
                      placeholder={feld.label}
                    />
                  )}
                </>
              )}
            </div>
          ))}

          {/* Unterschrift */}
          <div className="space-y-2">
            <Label>Digitale Unterschrift</Label>
            <UnterschriftPad
              onGespeichert={(dataUrl) => setSignatureUrl(dataUrl)}
            />
            {signatureUrl && (
              <p className="text-xs text-green-600">
                Unterschrift gespeichert
              </p>
            )}
          </div>

          {/* Absenden */}
          <Button
            onClick={handleAbsenden}
            disabled={!email || absenden}
            className="w-full"
            size="lg"
          >
            {absenden ? 'Wird eingereicht...' : 'Antrag einreichen'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
