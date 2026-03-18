'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, FileText, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

// ==================== Typen ====================

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

// ==================== Signatur-Canvas Komponente ====================

function SignaturCanvas({
  onGespeichert,
}: {
  onGespeichert: (datenUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zeichnet, setZeichnet] = useState(false);
  const [hatInhalt, setHatInhalt] = useState(false);

  const getKoordinaten = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const zeichnenStarten = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const coords = getKoordinaten(e);
      if (!coords) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      setZeichnet(true);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    },
    [getKoordinaten],
  );

  const zeichnen = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!zeichnet) return;
      const coords = getKoordinaten(e);
      if (!coords) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setHatInhalt(true);
    },
    [zeichnet, getKoordinaten],
  );

  const zeichnenStoppen = useCallback(() => {
    setZeichnet(false);
  }, []);

  const loeschen = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHatInhalt(false);
  }, []);

  const speichern = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hatInhalt) return;
    const dataUrl = canvas.toDataURL('image/png');
    onGespeichert(dataUrl);
  }, [hatInhalt, onGespeichert]);

  // Canvas initialisieren
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Touch-Scrolling verhindern
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const verhindern = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener('touchstart', verhindern, { passive: false });
    canvas.addEventListener('touchmove', verhindern, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', verhindern);
      canvas.removeEventListener('touchmove', verhindern);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full cursor-crosshair rounded-md border border-gray-300 touch-none"
          style={{ maxWidth: '400px' }}
          onMouseDown={zeichnenStarten}
          onMouseMove={zeichnen}
          onMouseUp={zeichnenStoppen}
          onMouseLeave={zeichnenStoppen}
          onTouchStart={zeichnenStarten}
          onTouchMove={zeichnen}
          onTouchEnd={zeichnenStoppen}
        />
        {!hatInhalt && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-gray-400">Hier unterschreiben</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={loeschen}
          className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Loeschen
        </button>
        <button
          type="button"
          onClick={speichern}
          disabled={!hatInhalt}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Unterschrift speichern
        </button>
      </div>
    </div>
  );
}

// ==================== Hauptseite ====================

export default function EinladungOeffentlichSeite() {
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

  // Einladung oeffentlich laden
  const einladungLaden = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/einladungen/token/oeffentlich/${token}`,
      );
      if (!response.ok) {
        const daten = await response.json().catch(() => null);
        throw new Error(
          daten?.message || 'Einladung nicht gefunden oder abgelaufen.',
        );
      }
      const daten = await response.json();
      setEinladung(daten);

      // Formulardaten initialisieren
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

  const handleUnterschrift = (templateId: string, datenUrl: string) => {
    setUnterschriften((prev) => ({
      ...prev,
      [templateId]: datenUrl,
    }));
  };

  // Alle Formulare auf einmal einreichen
  const handleAlleEinreichen = async () => {
    if (!einladung) return;

    // Pflichtfelder fuer aktuelles Formular pruefen
    const template = einladung.templates[aktuellesFormular];
    if (template) {
      for (const feld of template.fields as FormularFeld[]) {
        if (feld.pflicht) {
          const wert = formularDaten[template.id]?.[feld.name];
          if (!wert && wert !== false) {
            setFehler(`Bitte fuellen Sie das Feld "${feld.label}" aus.`);
            return;
          }
        }
      }

      if (!unterschriften[template.id]) {
        setFehler('Bitte unterschreiben Sie das Formular.');
        return;
      }
    }

    // Wenn nicht letztes Formular, zum naechsten wechseln
    if (aktuellesFormular < einladung.templates.length - 1) {
      setErledigteFormulare((prev) => [...prev, template.id]);
      setAktuellesFormular(aktuellesFormular + 1);
      setFehler('');
      return;
    }

    // Letztes Formular — alle einreichen
    setEinreichend(true);
    setFehler('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/einladungen/token/oeffentlich/${token}/einreichen`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: einladung.email,
            formulardaten: formularDaten,
            unterschriften,
            sportarten: einladung.sportarten,
          }),
        },
      );

      if (!response.ok) {
        const daten = await response.json().catch(() => null);
        throw new Error(daten?.message || 'Fehler beim Einreichen.');
      }

      setAlleErledigt(true);
    } catch (err) {
      setFehler(
        err instanceof Error ? err.message : 'Fehler beim Einreichen. Bitte versuchen Sie es erneut.',
      );
    } finally {
      setEinreichend(false);
    }
  };

  // ==================== Rendering ====================

  if (ladend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Einladung wird geladen...
        </div>
      </div>
    );
  }

  if (fehler && !einladung) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4 rounded-lg border bg-white p-6 text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Einladung ungueltig</p>
          <p className="text-gray-500">{fehler}</p>
        </div>
      </div>
    );
  }

  if (!einladung) return null;

  // Keine Formulare zugewiesen
  if (einladung.templates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4 rounded-lg border bg-white p-6 text-center shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">
            Willkommen, {einladung.vorname}!
          </p>
          <p className="text-gray-500">
            Ihre Einladung zum{' '}
            <strong>{einladung.tenant?.name}</strong> wurde registriert.
            Der Verein wird sich bei Ihnen melden.
          </p>
        </div>
      </div>
    );
  }

  // Alle Formulare erledigt — Erfolgsmeldung
  if (alleErledigt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4 rounded-lg border bg-white p-6 text-center shadow-sm space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
          <div>
            <p className="text-xl font-semibold mb-2">
              Alle Unterlagen eingereicht!
            </p>
            <p className="text-gray-500">
              Vielen Dank, {einladung.vorname}! Ihre{' '}
              {einladung.templates.length} Formulare wurden erfolgreich
              eingereicht und unterschrieben. Der{' '}
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
                <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {FORMTYP_LABEL[t.type] || t.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const aktuellesTemplate = einladung.templates[aktuellesFormular];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Vereins-Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{einladung.tenant?.name}</h1>
          <p className="text-gray-500">
            Digitaler Mitgliedsantrag fuer {einladung.vorname}{' '}
            {einladung.nachname}
          </p>
        </div>

        {/* Fortschritt */}
        {einladung.templates.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">
                Formular {aktuellesFormular + 1} von{' '}
                {einladung.templates.length}
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
                        ? 'bg-blue-600'
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
                      i === aktuellesFormular
                        ? 'font-medium'
                        : 'text-gray-400'
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
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">
                  {aktuellesTemplate.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {FORMTYP_LABEL[aktuellesTemplate.type] ||
                    aktuellesTemplate.type}{' '}
                  — bitte ausfuellen und unterschreiben
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Formularfelder */}
            {(aktuellesTemplate.fields as FormularFeld[]).map((feld) => (
              <div key={feld.name} className="space-y-1.5">
                <label
                  htmlFor={`${aktuellesTemplate.id}-${feld.name}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  {feld.label} {feld.pflicht && <span className="text-red-500">*</span>}
                </label>

                {feld.typ === 'text' && (
                  <input
                    id={`${aktuellesTemplate.id}-${feld.name}`}
                    type="text"
                    value={
                      (formularDaten[aktuellesTemplate.id]?.[feld.name] as string) || ''
                    }
                    onChange={(e) =>
                      handleFeldAendern(aktuellesTemplate.id, feld.name, e.target.value)
                    }
                    required={feld.pflicht}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}

                {feld.typ === 'email' && (
                  <input
                    id={`${aktuellesTemplate.id}-${feld.name}`}
                    type="email"
                    value={
                      (formularDaten[aktuellesTemplate.id]?.[feld.name] as string) || ''
                    }
                    onChange={(e) =>
                      handleFeldAendern(aktuellesTemplate.id, feld.name, e.target.value)
                    }
                    required={feld.pflicht}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}

                {feld.typ === 'date' && (
                  <input
                    id={`${aktuellesTemplate.id}-${feld.name}`}
                    type="date"
                    value={
                      (formularDaten[aktuellesTemplate.id]?.[feld.name] as string) || ''
                    }
                    onChange={(e) =>
                      handleFeldAendern(aktuellesTemplate.id, feld.name, e.target.value)
                    }
                    required={feld.pflicht}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}

                {feld.typ === 'select' && feld.optionen && (
                  <select
                    id={`${aktuellesTemplate.id}-${feld.name}`}
                    value={
                      (formularDaten[aktuellesTemplate.id]?.[feld.name] as string) || ''
                    }
                    onChange={(e) =>
                      handleFeldAendern(aktuellesTemplate.id, feld.name, e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Bitte waehlen</option>
                    {feld.optionen.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
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
                    <span className="text-sm text-gray-700">{feld.label}</span>
                  </label>
                )}
              </div>
            ))}

            {/* Unterschrift */}
            <div className="space-y-2 pt-4 border-t">
              <label className="block text-base font-semibold text-gray-900">
                Unterschrift <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500">
                Bitte unterschreiben Sie dieses Formular mit der Maus oder dem
                Finger
              </p>
              {unterschriften[aktuellesTemplate.id] ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-green-800">
                      Unterschrift gespeichert
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setUnterschriften((prev) => {
                        const kopie = { ...prev };
                        delete kopie[aktuellesTemplate.id];
                        return kopie;
                      })
                    }
                    className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Erneut unterschreiben
                  </button>
                </div>
              ) : (
                <SignaturCanvas
                  onGespeichert={(url) =>
                    handleUnterschrift(aktuellesTemplate.id, url)
                  }
                />
              )}
            </div>

            {/* Fehler */}
            {fehler && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {fehler}
              </div>
            )}

            {/* Absenden */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleAlleEinreichen}
                disabled={einreichend}
                className="min-w-[200px] rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {einreichend
                  ? 'Wird eingereicht...'
                  : aktuellesFormular < einladung.templates.length - 1
                    ? 'Speichern & Weiter'
                    : 'Alle Formulare einreichen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
