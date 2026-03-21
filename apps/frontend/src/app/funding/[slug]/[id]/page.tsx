'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Coins,
  Heart,
  Target,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/constants';

// ==================== Typen ====================

interface FundingSpende {
  id: string;
  betrag: number;
  spenderName: string | null;
  anonym: boolean;
  nachricht: string | null;
  erstelltAm: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
}

interface FundingProjekt {
  id: string;
  titel: string;
  beschreibung: string;
  bildUrl: string | null;
  zielBetrag: number;
  aktuellerBetrag: number;
  laufzeitBis: string;
  status: string;
  spenden: FundingSpende[];
  _count: { spenden: number };
}

function fortschrittProzent(aktuell: number, ziel: number): number {
  if (ziel <= 0) return 0;
  return Math.min(100, Math.round((aktuell / ziel) * 100));
}

function restlicheTage(laufzeitBis: string): number {
  const diff = new Date(laufzeitBis).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ==================== Seite ====================

export default function PublicFundingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [projekt, setProjekt] = useState<FundingProjekt | null>(null);
  const [laden, setLaden] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespendet, setGespendet] = useState(false);

  // Spendenformular
  const [betrag, setBetrag] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [anonym, setAnonym] = useState(false);
  const [spendenLaden, setSpendenLaden] = useState(false);

  useEffect(() => {
    const laden_ = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/funding/public/${slug}/${id}`,
        );
        if (!res.ok) {
          throw new Error('Projekt nicht gefunden');
        }
        const data = await res.json();
        setTenant(data.tenant);
        setProjekt(data.projekt);
      } catch {
        setFehler('Projekt nicht gefunden oder nicht oeffentlich.');
      } finally {
        setLaden(false);
      }
    };
    laden_();
  }, [slug, id]);

  const spendeAbgeben = async () => {
    if (!betrag || parseFloat(betrag) <= 0) return;
    setSpendenLaden(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/funding/public/${slug}/${id}/spenden`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            betrag: parseFloat(betrag),
            spenderName: anonym ? undefined : name || undefined,
            spenderEmail: email || undefined,
            anonym,
            nachricht: nachricht || undefined,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Fehler beim Spenden');
      }
      setGespendet(true);
      // Daten neu laden
      const res2 = await fetch(
        `${API_BASE_URL}/funding/public/${slug}/${id}`,
      );
      if (res2.ok) {
        const data = await res2.json();
        setProjekt(data.projekt);
      }
    } catch (err) {
      setFehler(
        err instanceof Error ? err.message : 'Fehler beim Spenden',
      );
    } finally {
      setSpendenLaden(false);
    }
  };

  if (laden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Laden...</div>
      </div>
    );
  }

  if (fehler && !projekt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Coins className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Projekt nicht gefunden
          </h1>
          <p className="text-gray-500">{fehler}</p>
        </div>
      </div>
    );
  }

  if (!projekt || !tenant) return null;

  const prozent = fortschrittProzent(
    projekt.aktuellerBetrag,
    projekt.zielBetrag,
  );
  const tage = restlicheTage(projekt.laufzeitBis);
  const primaerFarbe = tenant.primaryColor || '#1a56db';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div
        className="relative py-16 px-4"
        style={{ backgroundColor: primaerFarbe }}
      >
        <div className="max-w-3xl mx-auto text-center text-white">
          {tenant.logo && (
            <img
              src={`${API_BASE_URL}${tenant.logo}`}
              alt={tenant.name}
              className="h-16 w-16 mx-auto mb-4 rounded-full bg-white/20 object-contain"
            />
          )}
          <p className="text-white/80 text-sm mb-2">{tenant.name}</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {projekt.titel}
          </h1>
          <p className="text-lg text-white/90 max-w-xl mx-auto">
            {projekt.beschreibung}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8">
        {/* Fortschritts-Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>{projekt.aktuellerBetrag.toFixed(2)} EUR</span>
              <span className="text-muted-foreground">
                von {projekt.zielBetrag.toFixed(2)} EUR
              </span>
            </div>
            <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${prozent}%`,
                  backgroundColor: primaerFarbe,
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: primaerFarbe }}>
                  {prozent}%
                </div>
                <div className="text-xs text-gray-500">erreicht</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: primaerFarbe }}>
                  {projekt._count.spenden}
                </div>
                <div className="text-xs text-gray-500">Spender</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: primaerFarbe }}>
                  {tage}
                </div>
                <div className="text-xs text-gray-500">Tage uebrig</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Spendenformular */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5" style={{ color: primaerFarbe }} />
                Jetzt spenden
              </h2>

              {gespendet ? (
                <div className="text-center py-8">
                  <CheckCircle
                    className="h-16 w-16 mx-auto mb-4"
                    style={{ color: primaerFarbe }}
                  />
                  <h3 className="text-lg font-bold mb-2">
                    Vielen Dank fuer Ihre Spende!
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ihre Unterstuetzung hilft dem Verein, dieses Projekt zu
                    verwirklichen.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      setGespendet(false);
                      setBetrag('');
                      setName('');
                      setEmail('');
                      setNachricht('');
                      setAnonym(false);
                    }}
                  >
                    Weitere Spende
                  </Button>
                </div>
              ) : projekt.status === 'AKTIV' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Betrag (EUR) *</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={betrag}
                      onChange={(e) => setBetrag(e.target.value)}
                      placeholder="25.00"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[10, 25, 50, 100].map((b) => (
                      <Button
                        key={b}
                        variant="outline"
                        size="sm"
                        onClick={() => setBetrag(String(b))}
                        className="flex-1"
                      >
                        {b} EUR
                      </Button>
                    ))}
                  </div>
                  <div>
                    <Label>Name (optional)</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Max Mustermann"
                      disabled={anonym}
                    />
                  </div>
                  <div>
                    <Label>E-Mail (optional)</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="max@beispiel.de"
                    />
                  </div>
                  <div>
                    <Label>Nachricht (optional)</Label>
                    <Textarea
                      value={nachricht}
                      onChange={(e) => setNachricht(e.target.value)}
                      placeholder="Viel Erfolg!"
                      rows={2}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonym}
                      onChange={(e) => setAnonym(e.target.checked)}
                    />
                    Anonym spenden
                  </label>
                  {fehler && (
                    <p className="text-sm text-red-600">{fehler}</p>
                  )}
                  <Button
                    className="w-full"
                    onClick={spendeAbgeben}
                    disabled={spendenLaden || !betrag || parseFloat(betrag) <= 0}
                    style={{ backgroundColor: primaerFarbe }}
                  >
                    {spendenLaden
                      ? 'Wird gespendet...'
                      : `${betrag ? parseFloat(betrag).toFixed(2) : '0.00'} EUR spenden`}
                  </Button>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Dieses Projekt akzeptiert derzeit keine Spenden.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Letzte Spenden */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: primaerFarbe }} />
                Letzte Spenden
              </h2>
              {projekt.spenden.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Seien Sie der erste Spender!
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {projekt.spenden.map((spende) => (
                    <div
                      key={spende.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {spende.anonym
                            ? 'Anonym'
                            : spende.spenderName || 'Anonym'}
                        </div>
                        {spende.nachricht && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            &quot;{spende.nachricht}&quot;
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className="text-sm font-bold"
                          style={{ color: primaerFarbe }}
                        >
                          {spende.betrag.toFixed(2)} EUR
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(spende.erstelltAm).toLocaleDateString(
                            'de-DE',
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 mt-12 text-gray-400 text-sm">
        Powered by{' '}
        <a
          href="https://vereinbase.de"
          className="font-medium hover:text-gray-600"
        >
          Vereinbase
        </a>
      </div>
    </div>
  );
}
