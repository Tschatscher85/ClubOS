'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MitgliederTabelle } from '@/components/mitglieder/mitglieder-tabelle';
import { MitgliedFormular } from '@/components/mitglieder/mitglied-formular';
import { apiClient } from '@/lib/api-client';

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  sport: string[];
  parentEmail: string | null;
  status: string;
  joinDate: string;
}

interface Statistik {
  gesamt: number;
  aktiv: number;
  ausstehend: number;
}

export default function MitgliederPage() {
  const router = useRouter();
  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const [bearbeitungsMitglied, setBearbeitungsMitglied] =
    useState<Mitglied | null>(null);

  const datenLaden = useCallback(async () => {
    try {
      const [mitgliederDaten, statistikDaten] = await Promise.all([
        apiClient.get<Mitglied[]>('/mitglieder'),
        apiClient.get<Statistik>('/mitglieder/statistik'),
      ]);
      setMitglieder(mitgliederDaten);
      setStatistik(statistikDaten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleBearbeiten = (mitglied: Mitglied) => {
    setBearbeitungsMitglied(mitglied);
    setFormularOffen(true);
  };

  const handleLoeschen = async (id: string) => {
    if (!confirm('Mitglied wirklich loeschen?')) return;
    try {
      await apiClient.delete(`/mitglieder/${id}`);
      datenLaden();
    } catch (error) {
      console.error('Fehler beim Loeschen:', error);
    }
  };

  const handleFormularSchliessen = () => {
    setFormularOffen(false);
    setBearbeitungsMitglied(null);
  };

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Mitglieder werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Mitglieder</h1>
            <p className="text-muted-foreground">
              Vereinsmitglieder verwalten
            </p>
          </div>
        </div>
        <Button onClick={() => setFormularOffen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Mitglied
        </Button>
      </div>

      {/* Statistik-Karten */}
      {statistik && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gesamt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistik.gesamt}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktiv
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistik.aktiv}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ausstehend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {statistik.ausstehend}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabelle */}
      <MitgliederTabelle
        mitglieder={mitglieder}
        onBearbeiten={handleBearbeiten}
        onLoeschen={handleLoeschen}
        onKlick={(id) => router.push(`/mitglieder/${id}`)}
      />

      {/* Formular-Dialog */}
      <MitgliedFormular
        offen={formularOffen}
        onSchliessen={handleFormularSchliessen}
        onGespeichert={datenLaden}
        mitglied={bearbeitungsMitglied}
      />
    </div>
  );
}
