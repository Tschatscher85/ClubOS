'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

const SPORTARTEN_OPTIONEN = [
  { value: '', label: 'Alle Sportarten' },
  { value: 'FUSSBALL', label: 'Fussball' },
  { value: 'HANDBALL', label: 'Handball' },
  { value: 'BASKETBALL', label: 'Basketball' },
  { value: 'FOOTBALL', label: 'Football' },
  { value: 'TENNIS', label: 'Tennis' },
  { value: 'TURNEN', label: 'Turnen' },
  { value: 'SCHWIMMEN', label: 'Schwimmen' },
  { value: 'LEICHTATHLETIK', label: 'Leichtathletik' },
  { value: 'SONSTIGES', label: 'Sonstiges' },
];

const STATUS_OPTIONEN = [
  { value: '', label: 'Alle Status' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'PENDING', label: 'Ausstehend' },
  { value: 'INACTIVE', label: 'Inaktiv' },
  { value: 'CANCELLED', label: 'Ausgetreten' },
];

export default function MitgliederPage() {
  const router = useRouter();
  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [ladend, setLadend] = useState(true);
  const [formularOffen, setFormularOffen] = useState(false);
  const [bearbeitungsMitglied, setBearbeitungsMitglied] =
    useState<Mitglied | null>(null);

  // Filter
  const [suchbegriff, setSuchbegriff] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');

  // Batch-Freigabe Dialog
  const [freigabeDialogOffen, setFreigabeDialogOffen] = useState(false);
  const [freigabeLadend, setFreigabeLadend] = useState(false);

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

  const gefilterteMitglieder = useMemo(() => {
    return mitglieder.filter((m) => {
      // Namens-Suche
      if (suchbegriff) {
        const sucheLower = suchbegriff.toLowerCase();
        const nameMatch =
          m.firstName.toLowerCase().includes(sucheLower) ||
          m.lastName.toLowerCase().includes(sucheLower) ||
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(sucheLower);
        if (!nameMatch) return false;
      }

      // Status-Filter
      if (statusFilter && m.status !== statusFilter) return false;

      // Sportart-Filter
      if (sportFilter && !m.sport.includes(sportFilter)) return false;

      return true;
    });
  }, [mitglieder, suchbegriff, statusFilter, sportFilter]);

  const ausstehendeMitglieder = useMemo(
    () => mitglieder.filter((m) => m.status === 'PENDING'),
    [mitglieder],
  );

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

  const handleBatchFreigeben = async () => {
    setFreigabeLadend(true);
    try {
      const ids = ausstehendeMitglieder.map((m) => m.id);
      await apiClient.post('/mitglieder/batch-freigeben', { ids });
      setFreigabeDialogOffen(false);
      datenLaden();
    } catch (error) {
      console.error('Fehler bei der Batch-Freigabe:', error);
    } finally {
      setFreigabeLadend(false);
    }
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

      {/* Filter-Leiste */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Name suchen..."
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44"
        >
          {STATUS_OPTIONEN.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="w-full sm:w-48"
        >
          {SPORTARTEN_OPTIONEN.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        {ausstehendeMitglieder.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setFreigabeDialogOffen(true)}
            className="whitespace-nowrap"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Ausstehende freigeben ({ausstehendeMitglieder.length})
          </Button>
        )}
      </div>

      {/* Tabelle */}
      <MitgliederTabelle
        mitglieder={gefilterteMitglieder}
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

      {/* Batch-Freigabe Bestaetigungsdialog */}
      <Dialog open={freigabeDialogOffen} onOpenChange={setFreigabeDialogOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ausstehende Mitglieder freigeben</DialogTitle>
            <DialogDescription>
              Moechten Sie wirklich alle {ausstehendeMitglieder.length}{' '}
              ausstehenden Mitglieder freigeben? Diese werden als aktive
              Mitglieder markiert.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setFreigabeDialogOffen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleBatchFreigeben} disabled={freigabeLadend}>
              {freigabeLadend
                ? 'Wird freigegeben...'
                : `${ausstehendeMitglieder.length} Mitglieder freigeben`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
