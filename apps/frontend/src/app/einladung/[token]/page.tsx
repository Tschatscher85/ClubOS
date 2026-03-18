'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UnterschriftPad } from '@/components/unterschrift/unterschrift-pad';
import { API_BASE_URL } from '@/lib/constants';

interface FormularFeld {
  name: string;
  label: string;
  typ: 'text' | 'email' | 'date' | 'select' | 'checkbox';
  pflicht: boolean;
  optionen?: string[];
}

interface Template {
  id: string;
  name: string;
  type: string;
  fields: FormularFeld[];
}

interface EinladungDaten {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  templateIds: string[];
  sportarten: string[];
  geburtsdatum: string | null;
  status: string;
  tenant: {
    name: string;
    logo: string | null;
    primaryColor: string;
  } | null;
  templates: Template[];
}

interface FormularDaten {
  [feldName: string]: unknown;
}

const FORMTYP_LABEL: Record<string, string> = {
  MITGLIEDSANTRAG: 'Mitgliedsantrag',
  EINVERSTAENDNIS: 'Einverstaendniserklaerung',
  DATENSCHUTZ: 'Datenschutzerklaerung',
  SONSTIGES: 'Sonstiges',
};

export default function EinladungSeite() {
  const params = useParams();
  const token = params.token as string;

  const [einladung, setEinladung] = useState<EinladungDaten | null>(null);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');

  // Formular-Zustand pro Template
  const [formularDaten, setFormularDaten] = useState<Record<string, FormularDaten>>({});
  const [unterschriften, setUnterschriften] = useState<Record<string, string>>({});
  const [aktuellesFormular, setAktuellesFormular] = useState(0);
  const [erledigteFormulare, setErledigteFormulare] = useState<string[]>([]);
  const [einreichend, setEinreichend] = useState(false);
  const [alleErledigt, setAlleErledigt] = useState(false);

  const einladungLaden = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/einladungen/token/${token}`,
      );
      if (!response.ok) {
        throw new Error('Einladung nicht gefunden oder abgelaufen.');
      }
      const daten = await response.json();
      setEinladung(daten);

      // Formular-Daten initialisieren
      const initialDaten: Record<string, FormularDaten> = {};
      for (const template of daten.templates) {
        const felder: FormularDaten = {};
        for (const feld of template.fields as FormularFeld[]) {
          felder[feld.name] = feld.typ === 'checkbox' ? false : '';
        }
        // Vorausfuellen mit bekannten Daten
        felder['vorname'] = daten.vorname || '';
        felder['nachname'] = daten.nachname || '';
        felder['email'] = daten.email || '';
        if (daten.geburtsdatum) {
          felder['geburtsdatum'] = daten.geburtsdatum;
        }
        initialDaten[template.id] = felder;
      }
      setFormularDaten(initialDaten);
    } catch (err) {
      setFehler(
        err instanceof Error ? err.message : 'Fehler beim Laden der Einladung.',
      );
    } finally {
      setLadend(false);
    }
  }, [token]);

  useEffect(() => {
    einladungLaden();
  }, [einladungLaden]);

  const handleFeldAendern = (templateId: string, feldName: string, wert: unknown) => {
    setFormularDaten((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [feldName]: wert,
      },
    }));
  };

  const handleUnterschrift = (templateId: string, signatureUrl: string) => {
    setUnterschriften((prev) => ({
      ...prev,
      [templateId]: signatureUrl,
    }));
  };

  const handleFormularEinreichen = async () => {
    if (!einladung) return;

    const template = einladung.templates[aktuellesFormular];
    if (!template) return;

    // Pflichtfelder pruefen
    for (const feld of template.fields as FormularFeld[]) {
      if (feld.pflicht) {
        const wert = formularDaten[template.id]?.[feld.name];
        if (!wert && wert !== false) {
          setFehler(`Bitte fuellen Sie das Feld "${feld.label}" aus.`);
          return;
        }
      }
    }

    // Unterschrift pruefen
    if (!unterschriften[template.id]) {
      setFehler('Bitte unterschreiben Sie das Formular.');
      return;
    }

    setEinreichend(true);
    setFehler('');

    try {
      await fetch(
        `${API_BASE_URL}/formulare/vorlagen/${template.id}/einreichen`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: einladung.email,
            daten: {
              ...formularDaten[template.id],
              sportarten: einladung.sportarten,
            },
            signatureUrl: unterschriften[template.id],
          }),
        },
      );

      const neueErledigte = [...erledigteFormulare, template.id];
      setErledigteFormulare(neueErledigte);

      // Naechstes Formular oder fertig
      if (aktuellesFormular < einladung.templates.length - 1) {
        setAktuellesFormular(aktuellesFormular + 1);
      } else {
        // Alle Formulare erledigt — Einladung als ausgefuellt markieren
        await fetch(
          `${API_BASE_URL}/einladungen/token/${token}/ausgefuellt`,
          { method: 'POST' },
        );
        setAlleErledigt(true);
      }
    } catch (err) {
      setFehler('Fehler beim Einreichen. Bitte versuchen Sie es erneut.');
    } finally {
      setEinreichend(false);
    }
  };

  if (ladend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Einladung wird geladen...
        </div>
      </div>
    );
  }

  if (fehler && !einladung) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Einladung ungueltig</p>
            <p className="text-muted-foreground">{fehler}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!einladung) return null;

  // Keine Formulare zugewiesen
  if (einladung.templates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">
              Willkommen, {einladung.vorname}!
            </p>
            <p className="text-muted-foreground">
              Ihre Einladung zum{' '}
              <strong>{einladung.tenant?.name}</strong> wurde registriert.
              Der Verein wird sich bei Ihnen melden.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Alle Formulare erledigt
  if (alleErledigt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <p className="text-xl font-semibold mb-2">
                Alle Unterlagen eingereicht!
              </p>
              <p className="text-muted-foreground">
                Vielen Dank, {einladung.vorname}! Ihre {einladung.templates.length} Formulare
                wurden erfolgreich eingereicht und unterschrieben. Der{' '}
                <strong>{einladung.tenant?.name}</strong> wird Ihre Anmeldung
                pruefen.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              {einladung.templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{t.name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {FORMTYP_LABEL[t.type] || t.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aktuellesTemplate = einladung.templates[aktuellesFormular];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Vereins-Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            {einladung.tenant?.name}
          </h1>
          <p className="text-muted-foreground">
            Anmeldung fuer {einladung.vorname} {einladung.nachname}
          </p>
        </div>

        {/* Fortschritt */}
        {einladung.templates.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Formular {aktuellesFormular + 1} von {einladung.templates.length}
              </span>
              <span className="font-medium">
                {erledigteFormulare.length} erledigt
              </span>
            </div>
            <div className="flex gap-1">
              {einladung.templates.map((t, i) => (
                <div
                  key={t.id}
                  className={`h-2 flex-1 rounded-full ${
                    erledigteFormulare.includes(t.id)
                      ? 'bg-green-500'
                      : i === aktuellesFormular
                        ? 'bg-primary'
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1 mt-2">
              {einladung.templates.map((t, i) => (
                <div key={t.id} className="flex-1 text-center">
                  <span
                    className={`text-xs ${
                      i === aktuellesFormular ? 'font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {FORMTYP_LABEL[t.type] || t.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aktuelles Formular */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>{aktuellesTemplate.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {FORMTYP_LABEL[aktuellesTemplate.type] || aktuellesTemplate.type} —
                  bitte ausfuellen und unterschreiben
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formularfelder */}
            {(aktuellesTemplate.fields as FormularFeld[]).map((feld) => (
              <div key={feld.name} className="space-y-2">
                <Label htmlFor={`${aktuellesTemplate.id}-${feld.name}`}>
                  {feld.label} {feld.pflicht && '*'}
                </Label>

                {feld.typ === 'text' && (
                  <Input
                    id={`${aktuellesTemplate.id}-${feld.name}`}
                    value={(formularDaten[aktuellesTemplate.id]?.[feld.name] as string) || ''}
                    onChange={(e) =>
                      handleFeldAendern(aktuellesTemplate.id, feld.name, e.target.value)
                    }
                    required={feld.pflicht}
                  />
                )}

                {feld.typ === 'email' && (
                  <Input
                    id={`${aktuellesTemplate.id}-${feld.name}`}
                    type="email"
                    value={(formularDaten[aktuellesTemplate.id]?.[feld.name] as string) || ''}
                    onChange={(e) =>
                      handleFeldAendern(aktuellesTemplate.id, feld.name, e.target.value)
                    }
                    required={feld.pflicht}
                  />
                )}

                {feld.typ === 'date' && (
                  <Input
                    id={`${aktuellesTemplate.id}-${feld.name}`}
                    type="date"
                    value={(formularDaten[aktuellesTemplate.id]?.[feld.name] as string) || ''}
                    onChange={(e) =>
                      handleFeldAendern(aktuellesTemplate.id, feld.name, e.target.value)
                    }
                    required={feld.pflicht}
                  />
                )}

                {feld.typ === 'select' && feld.optionen && (
                  <Select
                    id={`${aktuellesTemplate.id}-${feld.name}`}
                    value={(formularDaten[aktuellesTemplate.id]?.[feld.name] as string) || ''}
                    onChange={(e) =>
                      handleFeldAendern(aktuellesTemplate.id, feld.name, e.target.value)
                    }
                  >
                    <option value="">Bitte waehlen</option>
                    {feld.optionen.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                )}

                {feld.typ === 'checkbox' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!formularDaten[aktuellesTemplate.id]?.[feld.name]}
                      onChange={(e) =>
                        handleFeldAendern(
                          aktuellesTemplate.id,
                          feld.name,
                          e.target.checked,
                        )
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{feld.label}</span>
                  </label>
                )}
              </div>
            ))}

            {/* Unterschrift */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-base font-semibold">
                Unterschrift *
              </Label>
              <p className="text-sm text-muted-foreground">
                Bitte unterschreiben Sie dieses Formular
              </p>
              {unterschriften[aktuellesTemplate.id] ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-green-800">
                      Unterschrift gespeichert
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUnterschriften((prev) => {
                        const kopie = { ...prev };
                        delete kopie[aktuellesTemplate.id];
                        return kopie;
                      })
                    }
                  >
                    Erneut unterschreiben
                  </Button>
                </div>
              ) : (
                <UnterschriftPad
                  onGespeichert={(url) =>
                    handleUnterschrift(aktuellesTemplate.id, url)
                  }
                />
              )}
            </div>

            {/* Fehler */}
            {fehler && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {fehler}
              </div>
            )}

            {/* Absenden */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleFormularEinreichen}
                disabled={einreichend}
                className="min-w-[200px]"
              >
                {einreichend
                  ? 'Wird eingereicht...'
                  : aktuellesFormular < einladung.templates.length - 1
                    ? 'Speichern & Weiter'
                    : 'Alle Formulare einreichen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
