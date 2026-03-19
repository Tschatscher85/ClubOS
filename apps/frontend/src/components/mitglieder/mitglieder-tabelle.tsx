'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { sportartLabel } from '@/lib/sportarten';

const INTERVALL_KURZ: Record<string, string> = {
  MONATLICH: 'Monat',
  QUARTALSWEISE: 'Quartal',
  HALBJAEHRLICH: 'Halbjahr',
  JAEHRLICH: 'Jahr',
};

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
  teamMembers?: Array<{ team: { id: string; name: string; ageGroup: string } }>;
  beitragsArt?: string | null;
  beitragBetrag?: number | null;
  beitragIntervall?: string | null;
}

interface RollenInfo {
  vereinsRollen: string[];
  farben: Record<string, string>;
}

const STATUS_LABEL: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { text: 'Ausstehend', variant: 'outline' },
  ACTIVE: { text: 'Aktiv', variant: 'default' },
  INACTIVE: { text: 'Inaktiv', variant: 'secondary' },
  CANCELLED: { text: 'Ausgetreten', variant: 'destructive' },
};

interface MitgliederTabelleProps {
  mitglieder: Mitglied[];
  rollenMap?: Record<string, RollenInfo>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBearbeiten: (mitglied: any) => void;
  onLoeschen: (id: string) => void;
  onKlick?: (id: string) => void;
}

export function MitgliederTabelle({
  mitglieder,
  rollenMap,
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
            <th className="h-12 px-4 text-left font-medium">Name</th>
            <th className="h-12 px-4 text-left font-medium hidden md:table-cell">Rolle</th>
            <th className="h-12 px-4 text-left font-medium hidden lg:table-cell">Sportarten</th>
            <th className="h-12 px-4 text-left font-medium hidden lg:table-cell">Team</th>
            <th className="h-12 px-4 text-left font-medium hidden xl:table-cell">Geburtsdatum</th>
            <th className="h-12 px-4 text-left font-medium hidden xl:table-cell">Eintritt</th>
            <th className="h-12 px-4 text-left font-medium hidden xl:table-cell">Beitrag</th>
            <th className="h-12 px-4 text-left font-medium">Status</th>
            <th className="h-12 px-4 text-right font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {mitglieder.map((m) => {
            const statusInfo = STATUS_LABEL[m.status] || {
              text: m.status,
              variant: 'outline' as const,
            };
            const rollen = m.userId && rollenMap ? rollenMap[m.userId] : null;

            return (
              <tr
                key={m.id}
                className={`border-b hover:bg-muted/30 ${onKlick ? 'cursor-pointer' : ''}`}
                onClick={() => onKlick?.(m.id)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{m.firstName} {m.lastName}</div>
                  <div className="text-xs text-muted-foreground">{m.email || m.memberNumber}</div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {rollen && rollen.vereinsRollen.length > 0 ? (
                      rollen.vereinsRollen.map((rolle) => (
                        <Badge
                          key={rolle}
                          className="text-xs text-white"
                          style={{ backgroundColor: rollen.farben[rolle] || '#64748b' }}
                        >
                          {rolle}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {m.sport.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {sportartLabel(s)}
                      </Badge>
                    ))}
                    {m.sport.length === 0 && <span className="text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {m.teamMembers && m.teamMembers.length > 0 ? (
                      m.teamMembers.map((tm) => (
                        <Badge key={tm.team.id} variant="outline" className="text-xs">
                          {tm.team.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">
                  {m.birthDate
                    ? new Date(m.birthDate).toLocaleDateString('de-DE')
                    : '—'}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">
                  {m.joinDate
                    ? new Date(m.joinDate).toLocaleDateString('de-DE')
                    : '—'}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">
                  {m.beitragBetrag
                    ? `${m.beitragBetrag.toFixed(2)} EUR${m.beitragIntervall ? ` / ${INTERVALL_KURZ[m.beitragIntervall] || m.beitragIntervall}` : ''}`
                    : m.beitragsArt || '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => onBearbeiten(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onLoeschen(m.id)}>
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
