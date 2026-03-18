'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, UserCheck, UserX } from 'lucide-react';

interface Mitglied {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  memberNumber: string;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  sport: string[];
  parentEmail: string | null;
  status: string;
  joinDate: string;
  userId?: string | null;
}

const STATUS_LABEL: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { text: 'Ausstehend', variant: 'outline' },
  ACTIVE: { text: 'Aktiv', variant: 'default' },
  INACTIVE: { text: 'Inaktiv', variant: 'secondary' },
  CANCELLED: { text: 'Ausgetreten', variant: 'destructive' },
};

const SPORTARTEN_LABEL: Record<string, string> = {
  FUSSBALL: 'Fussball',
  HANDBALL: 'Handball',
  BASKETBALL: 'Basketball',
  FOOTBALL: 'Football',
  TENNIS: 'Tennis',
  TURNEN: 'Turnen',
  SCHWIMMEN: 'Schwimmen',
  LEICHTATHLETIK: 'Leichtathletik',
  SONSTIGES: 'Sonstiges',
};

interface MitgliederTabelleProps {
  mitglieder: Mitglied[];
  onBearbeiten: (mitglied: Mitglied) => void;
  onLoeschen: (id: string) => void;
  onKlick?: (id: string) => void;
}

export function MitgliederTabelle({
  mitglieder,
  onBearbeiten,
  onLoeschen,
  onKlick,
}: MitgliederTabelleProps) {
  if (mitglieder.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Noch keine Mitglieder vorhanden. Legen Sie das erste Mitglied an.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-12 px-4 text-left font-medium">Nr.</th>
            <th className="h-12 px-4 text-left font-medium">Name</th>
            <th className="h-12 px-4 text-left font-medium hidden md:table-cell">E-Mail</th>
            <th className="h-12 px-4 text-left font-medium hidden lg:table-cell">Sportarten</th>
            <th className="h-12 px-4 text-left font-medium hidden xl:table-cell">Eintritt</th>
            <th className="h-12 px-4 text-left font-medium">Status</th>
            <th className="h-12 px-4 text-left font-medium hidden md:table-cell">Login</th>
            <th className="h-12 px-4 text-right font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {mitglieder.map((m) => {
            const statusInfo = STATUS_LABEL[m.status] || {
              text: m.status,
              variant: 'outline' as const,
            };
            return (
              <tr
                key={m.id}
                className={`border-b hover:bg-muted/30 ${onKlick ? 'cursor-pointer' : ''}`}
                onClick={() => onKlick?.(m.id)}
              >
                <td className="px-4 py-3 text-muted-foreground">
                  {m.memberNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{m.firstName} {m.lastName}</div>
                  {m.parentEmail && (
                    <div className="text-xs text-muted-foreground">
                      Eltern: {m.parentEmail}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {m.email || '—'}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {m.sport.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {SPORTARTEN_LABEL[s] || s}
                      </Badge>
                    ))}
                    {m.sport.length === 0 && <span className="text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">
                  {m.joinDate
                    ? new Date(m.joinDate).toLocaleDateString('de-DE')
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {m.userId ? (
                    <UserCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <UserX className="h-4 w-4 text-muted-foreground" />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onBearbeiten(m)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onLoeschen(m.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
