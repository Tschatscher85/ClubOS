'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/constants';

interface PassDaten {
  name: string;
  vereinsName: string;
  passNummer: string | null;
  sportart: string | null;
  altersklasse: string | null;
  spielberechtigt: boolean;
  gesperrt: boolean;
  sperrgrund: string | null;
  gueltigBis: string | null;
}

export default function SpielerpassPruefenSeite() {
  const params = useParams();
  const token = params.token as string;
  const [daten, setDaten] = useState<PassDaten | null>(null);
  const [fehler, setFehler] = useState('');
  const [ladend, setLadend] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/spielerpass/pruefen/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Pass nicht gefunden');
        return res.json();
      })
      .then(setDaten)
      .catch(() => setFehler('Spielerpass nicht gefunden oder ungueltig.'))
      .finally(() => setLadend(false));
  }, [token]);

  if (ladend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">Spielerpass wird geprueft...</div>
      </div>
    );
  }

  if (fehler || !daten) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-lg font-medium text-red-600">{fehler || 'Ungueltig'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const istGueltig = daten.spielberechtigt && !daten.gesperrt &&
    (!daten.gueltigBis || new Date(daten.gueltigBis) > new Date());

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className={`max-w-sm w-full border-2 ${istGueltig ? 'border-green-500' : 'border-red-500'}`}>
        <CardContent className="py-8 text-center space-y-4">
          {istGueltig ? (
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
          ) : (
            <AlertTriangle className="h-20 w-20 text-red-500 mx-auto" />
          )}

          <div>
            <h1 className="text-2xl font-bold">{daten.name}</h1>
            <p className="text-muted-foreground">{daten.vereinsName}</p>
          </div>

          <Badge variant={istGueltig ? 'default' : 'destructive'} className="text-lg px-4 py-1">
            {istGueltig ? 'SPIELBERECHTIGT' : daten.gesperrt ? 'GESPERRT' : 'NICHT SPIELBERECHTIGT'}
          </Badge>

          {daten.gesperrt && daten.sperrgrund && (
            <p className="text-sm text-red-600">{daten.sperrgrund}</p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm text-left">
            {daten.passNummer && (
              <>
                <span className="text-muted-foreground">Pass-Nr:</span>
                <span className="font-medium">{daten.passNummer}</span>
              </>
            )}
            {daten.sportart && (
              <>
                <span className="text-muted-foreground">Sportart:</span>
                <span className="font-medium">{daten.sportart}</span>
              </>
            )}
            {daten.altersklasse && (
              <>
                <span className="text-muted-foreground">Altersklasse:</span>
                <span className="font-medium">{daten.altersklasse}</span>
              </>
            )}
            {daten.gueltigBis && (
              <>
                <span className="text-muted-foreground">Gueltig bis:</span>
                <span className="font-medium">
                  {new Date(daten.gueltigBis).toLocaleDateString('de-DE')}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t">
            <Shield className="h-4 w-4" />
            Verifiziert durch Vereinbase
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
