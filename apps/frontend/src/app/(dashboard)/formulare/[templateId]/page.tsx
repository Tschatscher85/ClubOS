'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { UnterschriftPad } from '@/components/unterschrift/unterschrift-pad';
import { apiClient } from '@/lib/api-client';
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

  // Formular-Daten
  const [email, setEmail] = useState('');
  const [formDaten, setFormDaten] = useState<Record<string, string | boolean>>({});
  const [signatureUrl, setSignatureUrl] = useState('');

  const vorlageLaden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Vorlage>(`/formulare/vorlagen/${templateId}`);
      setVorlage(daten);
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
                  {feld.typ === 'select' && feld.optionen ? (
                    <Select
                      value={(formDaten[feld.name] as string) || ''}
                      onChange={(e) => handleFeldAendern(feld.name, e.target.value)}
                    >
                      <option value="">Bitte waehlen...</option>
                      {feld.optionen.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Select>
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
