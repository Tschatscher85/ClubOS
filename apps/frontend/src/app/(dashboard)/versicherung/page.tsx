'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

// ==================== Typen ====================

interface VorhandeneVersicherung {
  typ: string;
  anbieter: string | null;
  policeNr: string | null;
  gueltigBis: string | null;
  status: 'aktiv' | 'laeuft_bald_ab' | 'abgelaufen' | 'unbekannt';
}

interface Empfehlung {
  typ: string;
  grund: string;
  prioritaet: 'hoch' | 'mittel' | 'niedrig';
  geschaetzteKosten?: string;
}

interface Warnung {
  typ: string;
  nachricht: string;
}

interface CheckErgebnis {
  vorhandeneVersicherungen: VorhandeneVersicherung[];
  empfehlungen: Empfehlung[];
  warnungen: Warnung[];
}

function statusBadge(status: string) {
  switch (status) {
    case 'aktiv':
      return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>;
    case 'laeuft_bald_ab':
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          Laeuft bald ab
        </Badge>
      );
    case 'abgelaufen':
      return <Badge className="bg-red-100 text-red-800">Abgelaufen</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">Unbekannt</Badge>;
  }
}

function prioritaetBadge(prioritaet: string) {
  switch (prioritaet) {
    case 'hoch':
      return (
        <Badge className="bg-red-100 text-red-800">Hohe Prioritaet</Badge>
      );
    case 'mittel':
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          Mittlere Prioritaet
        </Badge>
      );
    case 'niedrig':
      return (
        <Badge className="bg-green-100 text-green-800">
          Niedrige Prioritaet
        </Badge>
      );
    default:
      return <Badge>{prioritaet}</Badge>;
  }
}

function prioritaetIcon(prioritaet: string) {
  switch (prioritaet) {
    case 'hoch':
      return <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />;
    case 'mittel':
      return <Info className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
    case 'niedrig':
      return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
    default:
      return <Info className="h-5 w-5 text-gray-500 flex-shrink-0" />;
  }
}

// ==================== Seite ====================

export default function VersicherungPage() {
  const [ergebnis, setErgebnis] = useState<CheckErgebnis | null>(null);
  const [laden, setLaden] = useState(true);

  const laden_ = useCallback(async () => {
    try {
      const data = await apiClient.get<CheckErgebnis>('/versicherung/check');
      setErgebnis(data);
    } catch {
      // Fehler
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    laden_();
  }, [laden_]);

  if (laden) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Versicherungs-Check wird durchgefuehrt...
        </div>
      </div>
    );
  }

  if (!ergebnis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          Versicherungs-Check konnte nicht durchgefuehrt werden.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Versicherungs-Check</h1>
          <p className="text-muted-foreground">
            Automatische Analyse Ihrer Vereinsversicherungen
          </p>
        </div>
      </div>

      {/* Warnungen */}
      {ergebnis.warnungen.length > 0 && (
        <div className="space-y-3">
          {ergebnis.warnungen.map((warnung, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200"
            >
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-800">{warnung.typ}</div>
                <p className="text-sm text-red-700 mt-1">
                  {warnung.nachricht}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vorhandene Versicherungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Vorhandene Versicherungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ergebnis.vorhandeneVersicherungen.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Keine Versicherungen hinterlegt. Sie koennen Ihre
              Versicherungsdaten in den Vereinseinstellungen unter
              &quot;Vereinsdaten&quot; eintragen.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Typ</th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Anbieter
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Policennummer
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Gueltig bis
                    </th>
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ergebnis.vorhandeneVersicherungen.map((vers, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{vers.typ}</td>
                      <td className="py-3 pr-4">{vers.anbieter || '-'}</td>
                      <td className="py-3 pr-4">{vers.policeNr || '-'}</td>
                      <td className="py-3 pr-4">
                        {vers.gueltigBis
                          ? new Date(vers.gueltigBis).toLocaleDateString(
                              'de-DE',
                            )
                          : '-'}
                      </td>
                      <td className="py-3">{statusBadge(vers.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empfehlungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Empfehlungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ergebnis.empfehlungen.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Alles in Ordnung!
                </p>
                <p className="text-sm text-green-700">
                  Basierend auf Ihren Vereinsdaten haben wir keine weiteren
                  Empfehlungen.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {ergebnis.empfehlungen.map((empfehlung, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border"
                >
                  {prioritaetIcon(empfehlung.prioritaet)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{empfehlung.typ}</span>
                      {prioritaetBadge(empfehlung.prioritaet)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {empfehlung.grund}
                    </p>
                    {empfehlung.geschaetzteKosten && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Geschaetzte Kosten: {empfehlung.geschaetzteKosten}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hinweis */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Dies ist eine automatische Einschaetzung basierend auf Ihren
          Vereinsdaten. Bitte lassen Sie sich von einem Versicherungsberater
          individuell beraten. Die genannten Kosten sind grobe Richtwerte und
          koennen je nach Anbieter und Vereinsgroesse variieren.
        </p>
      </div>
    </div>
  );
}
