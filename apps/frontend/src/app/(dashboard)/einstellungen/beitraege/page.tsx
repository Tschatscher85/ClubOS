'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface MitgliedErmaessigung {
  id: string;
  vorname: string;
  nachname: string;
  beitragsart: string;
  betrag: number;
  ermaessigung: string;
  prozent: number;
  nachweisStatus: 'AUSSTEHEND' | 'EINGEREICHT' | 'GEPRUEFT' | 'ABGELEHNT' | 'ABGELAUFEN';
}

const NACHWEIS_STATUS_CONFIG: Record<
  string,
  { label: string; klasse: string }
> = {
  AUSSTEHEND: {
    label: 'Ausstehend',
    klasse: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  EINGEREICHT: {
    label: 'Eingereicht',
    klasse: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  GEPRUEFT: {
    label: 'Geprueft',
    klasse: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  ABGELEHNT: {
    label: 'Abgelehnt',
    klasse: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  ABGELAUFEN: {
    label: 'Abgelaufen',
    klasse: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

export default function BeitraegePage() {
  const { benutzer } = useAuth();
  const [mitglieder, setMitglieder] = useState<MitgliedErmaessigung[]>([]);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');
  const [erinnerungLadend, setErinnerungLadend] = useState(false);

  const istAdmin = benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  useEffect(() => {
    const laden = async () => {
      setLadend(true);
      try {
        const result = await apiClient.get<MitgliedErmaessigung[]>(
          '/mitglieder/ermaessigungen-uebersicht',
        );
        setMitglieder(result);
      } catch {
        setFehler('Fehler beim Laden der Ermaessigungsuebersicht.');
      } finally {
        setLadend(false);
      }
    };
    laden();
  }, []);

  const handleErinnerungenSenden = async () => {
    if (!confirm('Erinnerungen an alle Mitglieder mit ausstehendem Nachweis senden?')) return;
    setErinnerungLadend(true);
    setFehler('');
    setErfolg('');
    try {
      const result = await apiClient.post<{ gesendet: number }>(
        '/mitglieder/nachweis-erinnerungen',
        {},
      );
      setErfolg(`${result.gesendet} Erinnerung(en) erfolgreich gesendet.`);
      setTimeout(() => setErfolg(''), 5000);
    } catch (error) {
      setFehler(
        error instanceof Error ? error.message : 'Fehler beim Senden der Erinnerungen.',
      );
    } finally {
      setErinnerungLadend(false);
    }
  };

  const ausstehendAnzahl = mitglieder.filter(
    (m) => m.nachweisStatus === 'AUSSTEHEND' || m.nachweisStatus === 'ABGELAUFEN',
  ).length;

  const formatBetrag = (betrag: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(betrag);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/einstellungen">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurueck
          </Button>
        </Link>
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Beitraege & Ermaessigungen</h1>
          <p className="text-muted-foreground">Uebersicht aller Mitglieder mit Ermaessigungen</p>
        </div>
      </div>

      {fehler && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{fehler}</div>
      )}
      {erfolg && (
        <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md p-3">{erfolg}</div>
      )}

      {/* Aktionen */}
      {istAdmin && ausstehendAnzahl > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {ausstehendAnzahl} Mitglied(er) mit ausstehendem oder abgelaufenem Nachweis
                </p>
                <p className="text-sm text-muted-foreground">
                  Senden Sie Erinnerungen per E-Mail an alle betroffenen Mitglieder.
                </p>
              </div>
              <Button
                onClick={handleErinnerungenSenden}
                disabled={erinnerungLadend}
              >
                <Send className="h-4 w-4 mr-2" />
                {erinnerungLadend ? 'Wird gesendet...' : 'Erinnerungen senden'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Ermaessigungsuebersicht</CardTitle>
          <CardDescription>
            Alle Mitglieder mit Ermaessigungen und deren Nachweis-Status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ladend ? (
            <p className="text-muted-foreground">Wird geladen...</p>
          ) : mitglieder.length === 0 ? (
            <p className="text-muted-foreground">Keine Mitglieder mit Ermaessigungen vorhanden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Beitragsart</th>
                    <th className="text-right py-3 px-2 font-medium">Betrag</th>
                    <th className="text-left py-3 px-2 font-medium">Ermaessigung</th>
                    <th className="text-right py-3 px-2 font-medium">Prozent</th>
                    <th className="text-left py-3 px-2 font-medium">Nachweis-Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mitglieder.map((mitglied) => {
                    const statusConfig =
                      NACHWEIS_STATUS_CONFIG[mitglied.nachweisStatus] ||
                      NACHWEIS_STATUS_CONFIG.AUSSTEHEND;
                    return (
                      <tr key={mitglied.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">
                          {mitglied.vorname} {mitglied.nachname}
                        </td>
                        <td className="py-3 px-2">{mitglied.beitragsart}</td>
                        <td className="py-3 px-2 text-right">
                          {formatBetrag(mitglied.betrag)}
                        </td>
                        <td className="py-3 px-2">{mitglied.ermaessigung}</td>
                        <td className="py-3 px-2 text-right">{mitglied.prozent}%</td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.klasse}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
