'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserCog, Search, Phone, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { useBenutzer } from '@/hooks/use-auth';
import Link from 'next/link';

interface Benutzer {
  id: string;
  email: string;
  role: string;
  vereinsRollen: string[];
  berechtigungen: string[];
  istAktiv: boolean;
  letzterLogin: string | null;
  notizen: string | null;
  createdAt: string;
}

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

interface RollenVorlage {
  name: string;
  farbe: string | null;
  beschreibung: string | null;
}

// Rollen die als "Mitarbeiter" gelten (nicht Spieler/Eltern)
const MITARBEITER_ROLLEN = [
  'Vorstand',
  'Trainer',
  'Kassenprufer',
  'Innendienst',
  'Ehrenamt',
];

export default function MitarbeiterInhalt() {
  const aktuellBenutzer = useBenutzer();
  const [benutzer, setBenutzer] = useState<Benutzer[]>([]);
  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [vorlagen, setVorlagen] = useState<RollenVorlage[]>([]);
  const [ladend, setLadend] = useState(true);
  const [suchbegriff, setSuchbegriff] = useState('');

  const datenLaden = useCallback(async () => {
    try {
      const [benutzerDaten, mitgliederDaten, vorlagenDaten] = await Promise.all([
        apiClient.get<Benutzer[]>('/benutzer/verwaltung/liste'),
        apiClient.get<Mitglied[]>('/mitglieder'),
        apiClient.get<RollenVorlage[]>('/rollen-vorlagen'),
      ]);
      setBenutzer(benutzerDaten);
      setMitglieder(mitgliederDaten);
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

  if (aktuellBenutzer && !['SUPERADMIN', 'ADMIN'].includes(aktuellBenutzer.rolle)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Kein Zugriff auf diese Seite.</p>
      </div>
    );
  }

  // Mitarbeiter = Benutzer die mindestens eine Mitarbeiter-Rolle haben
  // ODER System-Rolle ADMIN/TRAINER/SUPERADMIN
  const mitarbeiterBenutzer = benutzer.filter((b) => {
    const hatMitarbeiterRolle = b.vereinsRollen.some((r) =>
      MITARBEITER_ROLLEN.includes(r),
    );
    const istSystemMitarbeiter = ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(b.role);
    return hatMitarbeiterRolle || istSystemMitarbeiter;
  });

  // Name aus Mitglieder-Daten holen (ueber userId-Verknuepfung)
  const mitgliedZuUser = (userId: string): Mitglied | undefined => {
    return mitglieder.find((m) => m.userId === userId);
  };

  const rollenFarbe = (rollenName: string): string => {
    const vorlage = vorlagen.find((v) => v.name === rollenName);
    return vorlage?.farbe || '#64748b';
  };

  // Filtern
  const gefilterteMitarbeiter = mitarbeiterBenutzer.filter((b) => {
    if (!suchbegriff) return true;
    const suche = suchbegriff.toLowerCase();
    const mitglied = mitgliedZuUser(b.id);
    const name = mitglied
      ? `${mitglied.firstName} ${mitglied.lastName}`.toLowerCase()
      : '';
    return (
      b.email.toLowerCase().includes(suche) ||
      name.includes(suche) ||
      b.vereinsRollen.some((r) => r.toLowerCase().includes(suche))
    );
  });

  // Statistiken
  const anzahlAktiv = mitarbeiterBenutzer.filter((b) => b.istAktiv).length;
  const rollenVerteilung = new Map<string, number>();
  for (const b of mitarbeiterBenutzer) {
    for (const r of b.vereinsRollen) {
      if (MITARBEITER_ROLLEN.includes(r)) {
        rollenVerteilung.set(r, (rollenVerteilung.get(r) || 0) + 1);
      }
    }
  }

  if (ladend) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Mitarbeiter werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aktionen */}
      <div className="flex justify-end">
        <Link href="/einstellungen/benutzer">
          <Button variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Benutzer verwalten
          </Button>
        </Link>
      </div>

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mitarbeiter gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mitarbeiterBenutzer.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktiv
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{anzahlAktiv}</div>
          </CardContent>
        </Card>
        {Array.from(rollenVerteilung.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([rolle, anzahl]) => (
            <Card key={rolle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {rolle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{anzahl}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Suche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Nach Name, E-Mail oder Rolle suchen..."
          value={suchbegriff}
          onChange={(e) => setSuchbegriff(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Mitarbeiter-Karten */}
      {gefilterteMitarbeiter.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {suchbegriff
            ? 'Keine Mitarbeiter gefunden.'
            : 'Noch keine Mitarbeiter vorhanden. Weisen Sie Benutzern Vereinsrollen zu unter Einstellungen > Benutzer.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gefilterteMitarbeiter.map((b) => {
            const mitglied = mitgliedZuUser(b.id);
            const name = mitglied
              ? `${mitglied.firstName} ${mitglied.lastName}`
              : b.email.split('@')[0];
            const telefon = mitglied?.phone;

            return (
              <Card
                key={b.id}
                className={`transition-opacity ${!b.istAktiv ? 'opacity-50' : ''}`}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Name + Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{name}</h3>
                        {!b.istAktiv && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Deaktiviert
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {b.letzterLogin && (
                          <span className="text-xs text-muted-foreground">
                            Letzter Login:{' '}
                            {new Date(b.letzterLogin).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vereinsrollen */}
                    <div className="flex flex-wrap gap-1.5">
                      {b.vereinsRollen.length > 0 ? (
                        b.vereinsRollen.map((rolle) => (
                          <Badge
                            key={rolle}
                            className="text-xs text-white"
                            style={{ backgroundColor: rollenFarbe(rolle) }}
                          >
                            {rolle}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {b.role === 'SUPERADMIN'
                            ? 'Plattform-Admin'
                            : b.role === 'ADMIN'
                              ? 'Administrator'
                              : b.role === 'TRAINER'
                                ? 'Trainer'
                                : b.role}
                        </Badge>
                      )}
                    </div>

                    {/* Kontakt */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{b.email}</span>
                      </div>
                      {telefon && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{telefon}</span>
                        </div>
                      )}
                    </div>

                    {/* Notizen */}
                    {b.notizen && (
                      <p className="text-xs text-muted-foreground italic border-t pt-2">
                        {b.notizen}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Hinweis */}
      <Card>
        <CardContent className="pt-6">
          <CardDescription>
            Mitarbeiter werden automatisch angezeigt, wenn ihnen Vereinsrollen wie
            Vorstand, Trainer, Innendienst oder Kassenpruefer zugewiesen werden.
            Die Verwaltung der Rollen und Berechtigungen erfolgt unter{' '}
            <Link
              href="/einstellungen/benutzer"
              className="text-primary underline hover:no-underline"
            >
              Einstellungen &gt; Benutzer
            </Link>
            .
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
