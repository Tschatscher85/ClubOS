'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FileEdit,
  Check,
  X,
  Loader2,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

// --- Typen ---

interface Aenderungsantrag {
  id: string;
  tenantId: string;
  memberId: string;
  feld: string;
  alterWert: string | null;
  neuerWert: string;
  status: 'PENDING' | 'GENEHMIGT' | 'ABGELEHNT';
  erstelltAm: string;
  bearbeitetAm: string | null;
  bearbeitetVon: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber: string;
  };
}

// --- Konstanten ---

const FELD_LABEL: Record<string, string> = {
  phone: 'Telefon',
  address: 'Adresse',
  iban: 'IBAN',
  notfallKontakt: 'Notfallkontakt',
  notfallTelefon: 'Notfall-Telefon',
};

export default function AenderungsantraegeSeite() {
  const [antraege, setAntraege] = useState<Aenderungsantrag[]>([]);
  const [laed, setLaed] = useState(true);
  const [bearbeitungId, setBearbeitungId] = useState<string | null>(null);

  const laden = useCallback(async () => {
    try {
      const daten = await apiClient.get<Aenderungsantrag[]>(
        '/mitglieder/aenderungsantraege',
      );
      setAntraege(daten);
    } catch {
      // Fehler still behandeln
    } finally {
      setLaed(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const genehmigen = async (id: string) => {
    setBearbeitungId(id);
    try {
      await apiClient.put(`/mitglieder/aenderungsantrag/${id}/genehmigen`, {});
      setAntraege((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Fehler still behandeln
    } finally {
      setBearbeitungId(null);
    }
  };

  const ablehnen = async (id: string) => {
    setBearbeitungId(id);
    try {
      await apiClient.put(`/mitglieder/aenderungsantrag/${id}/ablehnen`, {});
      setAntraege((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Fehler still behandeln
    } finally {
      setBearbeitungId(null);
    }
  };

  if (laed) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Änderungsanträge</h1>
          <p className="text-muted-foreground mt-1">
            Offene Profil-Änderungen von Mitgliedern prüfen und genehmigen.
          </p>
        </div>
        {antraege.length > 0 && (
          <Badge variant="secondary" className="text-base px-3 py-1">
            {antraege.length} offen
          </Badge>
        )}
      </div>

      {antraege.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              Keine offenen Änderungsanträge vorhanden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              Offene Anträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Tabelle */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Mitglied</th>
                    <th className="pb-3 font-medium">Feld</th>
                    <th className="pb-3 font-medium">Alter Wert</th>
                    <th className="pb-3 font-medium">Neuer Wert</th>
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {antraege.map((antrag) => (
                    <tr key={antrag.id}>
                      <td className="py-3">
                        <p className="font-medium">
                          {antrag.member.firstName} {antrag.member.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {antrag.member.memberNumber}
                        </p>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">
                          {FELD_LABEL[antrag.feld] || antrag.feld}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground max-w-[150px] truncate">
                        {antrag.alterWert || <span className="italic">(leer)</span>}
                      </td>
                      <td className="py-3 font-medium max-w-[150px] truncate">
                        {antrag.neuerWert}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(antrag.erstelltAm).toLocaleDateString('de-DE')}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 h-8"
                            onClick={() => genehmigen(antrag.id)}
                            disabled={bearbeitungId === antrag.id}
                          >
                            {bearbeitungId === antrag.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Genehmigen
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={() => ablehnen(antrag.id)}
                            disabled={bearbeitungId === antrag.id}
                          >
                            {bearbeitungId === antrag.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Ablehnen
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Karten */}
            <div className="md:hidden space-y-3">
              {antraege.map((antrag) => (
                <div
                  key={antrag.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {antrag.member.firstName} {antrag.member.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {antrag.member.memberNumber}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {FELD_LABEL[antrag.feld] || antrag.feld}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {antrag.alterWert || '(leer)'} &rarr;{' '}
                      <span className="font-medium text-foreground">
                        {antrag.neuerWert}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(antrag.erstelltAm).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => genehmigen(antrag.id)}
                      disabled={bearbeitungId === antrag.id}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Genehmigen
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => ablehnen(antrag.id)}
                      disabled={bearbeitungId === antrag.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Ablehnen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
