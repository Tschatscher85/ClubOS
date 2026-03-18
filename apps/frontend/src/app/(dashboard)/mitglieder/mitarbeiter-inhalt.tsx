'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Phone, Mail, Shield, Download, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  sport: string[];
  status: string;
  userId: string | null;
}

interface Benutzer {
  id: string;
  email: string;
  role: string;
  vereinsRollen: string[];
  istAktiv: boolean;
  letzterLogin: string | null;
  notizen: string | null;
}

interface RollenVorlage {
  name: string;
  farbe: string | null;
}

// Rollen die als "Mitarbeiter" gelten
const MITARBEITER_ROLLEN = ['Vorstand', 'Trainer', 'Kassenprufer', 'Innendienst', 'Ehrenamt'];

export default function MitarbeiterInhalt() {
  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [benutzer, setBenutzer] = useState<Benutzer[]>([]);
  const [vorlagen, setVorlagen] = useState<RollenVorlage[]>([]);
  const [ladend, setLadend] = useState(true);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [rollenFilter, setRollenFilter] = useState('');

  const datenLaden = useCallback(async () => {
    try {
      const [mitgliederDaten, benutzerDaten, vorlagenDaten] = await Promise.all([
        apiClient.get<Mitglied[]>('/mitglieder'),
        apiClient.get<Benutzer[]>('/benutzer/verwaltung/liste').catch(() => [] as Benutzer[]),
        apiClient.get<RollenVorlage[]>('/rollen-vorlagen').catch(() => [] as RollenVorlage[]),
      ]);
      setMitglieder(mitgliederDaten);
      setBenutzer(benutzerDaten);
      setVorlagen(vorlagenDaten);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLadend(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const rollenFarbe = (rollenName: string): string => {
    const vorlage = vorlagen.find((v) => v.name === rollenName);
    return vorlage?.farbe || '#64748b';
  };

  // User-Daten zu Mitglied finden
  const benutzerZuMitglied = (userId: string | null): Benutzer | undefined => {
    if (!userId) return undefined;
    return benutzer.find((b) => b.id === userId);
  };

  // Mitarbeiter = Mitglieder deren verknüpfter User eine Mitarbeiter-Rolle hat
  const mitarbeiterMitglieder = mitglieder.filter((m) => {
    const user = benutzerZuMitglied(m.userId);
    if (!user) return false;
    return user.vereinsRollen.some((r) => MITARBEITER_ROLLEN.includes(r)) ||
      ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(user.role);
  });

  // Alle verfuegbaren Rollen sammeln
  const verfuegbareRollen = useMemo(() => {
    const rollen = new Set<string>();
    for (const m of mitarbeiterMitglieder) {
      const user = benutzerZuMitglied(m.userId);
      if (user) {
        for (const r of user.vereinsRollen) rollen.add(r);
      }
    }
    return Array.from(rollen).sort();
  }, [mitarbeiterMitglieder, benutzer]);

  // Filtern
  const gefilterteMitarbeiter = mitarbeiterMitglieder.filter((m) => {
    const user = benutzerZuMitglied(m.userId);
    if (suchbegriff) {
      const suche = suchbegriff.toLowerCase();
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const rollen = user?.vereinsRollen.join(' ').toLowerCase() || '';
      if (!name.includes(suche) && !rollen.includes(suche) && !(m.email || '').toLowerCase().includes(suche)) {
        return false;
      }
    }
    if (rollenFilter && user) {
      if (!user.vereinsRollen.includes(rollenFilter)) return false;
    } else if (rollenFilter && !user) {
      return false;
    }
    return true;
  });

  const handleExport = () => {
    const header = 'Name;E-Mail;Telefon;Rollen;Sportarten;Status\n';
    const rows = gefilterteMitarbeiter.map(m => {
      const user = benutzerZuMitglied(m.userId);
      return `${m.firstName} ${m.lastName};${m.email || ''};${m.phone || ''};${user?.vereinsRollen.join(',') || ''};${m.sport.join(',')};${user?.istAktiv ? 'Aktiv' : 'Deaktiviert'}`;
    }).join('\n');
    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mitarbeiter_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrucken = () => window.print();

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="animate-pulse text-muted-foreground">Mitarbeiter werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aktionen */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Name oder Rolle suchen..."
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={rollenFilter}
          onChange={(e) => setRollenFilter(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="">Alle Rollen</option>
          {verfuegbareRollen.map((rolle) => (
            <option key={rolle} value={rolle}>{rolle}</option>
          ))}
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            CSV Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleDrucken}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
          <Link href="/einstellungen/rollen">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Rollen verwalten
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistik */}
      <div className="flex gap-2 text-sm text-muted-foreground">
        <span>{mitarbeiterMitglieder.length} Mitarbeiter</span>
        <span>·</span>
        <span>{mitarbeiterMitglieder.filter((m) => benutzerZuMitglied(m.userId)?.istAktiv).length} aktiv</span>
      </div>

      {/* Mitarbeiter-Karten */}
      <div data-print-bereich>
      {gefilterteMitarbeiter.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {suchbegriff
            ? 'Keine Mitarbeiter gefunden.'
            : 'Noch keine Mitarbeiter. Weisen Sie Mitgliedern eine Mitarbeiter-Rolle zu (Vorstand, Trainer, etc.).'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gefilterteMitarbeiter.map((m) => {
            const user = benutzerZuMitglied(m.userId);
            return (
              <Card key={m.id} className={!user?.istAktiv ? 'opacity-50' : ''}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-base">
                        {m.firstName} {m.lastName}
                      </h3>
                      {!user?.istAktiv && (
                        <Badge variant="destructive" className="text-xs mt-1">Deaktiviert</Badge>
                      )}
                    </div>

                    {/* Vereinsrollen */}
                    <div className="flex flex-wrap gap-1.5">
                      {user?.vereinsRollen.map((rolle) => (
                        <Badge
                          key={rolle}
                          className="text-xs text-white"
                          style={{ backgroundColor: rollenFarbe(rolle) }}
                        >
                          {rolle}
                        </Badge>
                      ))}
                    </div>

                    {/* Kontakt */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {m.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                      )}
                      {m.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{m.phone}</span>
                        </div>
                      )}
                    </div>

                    {user?.notizen && (
                      <p className="text-xs text-muted-foreground italic border-t pt-2">
                        {user.notizen}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      </div>

      <Card>
        <CardContent className="pt-6">
          <CardDescription>
            Mitarbeiter werden automatisch angezeigt wenn einem Mitglied eine Vereinsrolle
            wie Vorstand, Trainer oder Innendienst zugewiesen wird.
            Rollen zuweisen: Mitglied bearbeiten → Vereinsrolle auswählen.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
