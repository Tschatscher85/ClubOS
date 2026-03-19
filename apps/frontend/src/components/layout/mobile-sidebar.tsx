'use client';

import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  MessageSquare,
  Car,
  Heart,
  UserCheck,
  Receipt,
  Zap,
  FolderOpen,
  Database,
  Settings,
  Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarNavItem } from './sidebar-nav-item';
import { useTenant, useBenutzer } from '@/hooks/use-auth';
import { ROUTEN, API_BASE_URL } from '@/lib/constants';
import { useState } from 'react';

interface NavEintrag {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  rollen: string[] | null;
  berechtigung?: string;
}

interface NavGruppe {
  titel: string;
  eintraege: NavEintrag[];
}

const NAVIGATION_GRUPPEN: NavGruppe[] = [
  {
    titel: '',
    eintraege: [
      { href: ROUTEN.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, rollen: null },
    ],
  },
  {
    titel: 'Verein',
    eintraege: [
      { href: ROUTEN.MITGLIEDER, label: 'Mitglieder & Personal', icon: Users, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'], berechtigung: 'MITGLIEDER' },
      { href: ROUTEN.TEAMS, label: 'Teams & Abteilungen', icon: Shield, rollen: null, berechtigung: 'TEAMS' },
    ],
  },
  {
    titel: 'Aktivitäten',
    eintraege: [
      { href: ROUTEN.KALENDER, label: 'Kalender & Spielbetrieb', icon: Calendar, rollen: null, berechtigung: 'KALENDER' },
      { href: ROUTEN.NACHRICHTEN, label: 'Nachrichten', icon: MessageSquare, rollen: null, berechtigung: 'NACHRICHTEN' },
      { href: ROUTEN.FAHRGEMEINSCHAFTEN, label: 'Fahrtenbörse', icon: Car, rollen: null, berechtigung: 'FAHRGEMEINSCHAFTEN' },
    ],
  },
  {
    titel: 'Verwaltung',
    eintraege: [
      { href: ROUTEN.SCHIEDSRICHTER, label: 'Schiedsrichter', icon: UserCheck, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'], berechtigung: 'SCHIEDSRICHTER' },
      { href: ROUTEN.BUCHHALTUNG, label: 'Buchhaltung & Beiträge', icon: Receipt, rollen: ['SUPERADMIN', 'ADMIN'], berechtigung: 'BUCHHALTUNG' },
      { href: ROUTEN.SPONSOREN, label: 'Sponsoren', icon: Heart, rollen: ['SUPERADMIN', 'ADMIN'], berechtigung: 'SPONSOREN' },
      { href: ROUTEN.DOKUMENTE, label: 'Dokumente & Formulare', icon: FolderOpen, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'], berechtigung: 'DOKUMENTE' },
    ],
  },
  {
    titel: 'System',
    eintraege: [
      { href: ROUTEN.WORKFLOWS, label: 'Workflows', icon: Zap, rollen: ['SUPERADMIN', 'ADMIN'], berechtigung: 'WORKFLOWS' },
      { href: ROUTEN.DFBNET, label: 'DFBnet', icon: Database, rollen: ['SUPERADMIN', 'ADMIN'] },
      { href: ROUTEN.EINSTELLUNGEN, label: 'Einstellungen', icon: Settings, rollen: ['SUPERADMIN', 'ADMIN'], berechtigung: 'EINSTELLUNGEN' },
    ],
  },
  {
    titel: '',
    eintraege: [
      { href: ROUTEN.ELTERN, label: 'Eltern-Portal', icon: Heart, rollen: ['PARENT'] },
    ],
  },
];

export function MobileSidebar() {
  const [offen, setOffen] = useState(false);
  const tenant = useTenant();
  const benutzer = useBenutzer();

  const initialen = tenant?.name
    ? tenant.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'CO';

  const filterEintrag = (item: NavEintrag) => {
    if (item.rollen && (!benutzer || !item.rollen.includes(benutzer.rolle))) {
      return false;
    }
    if (
      item.berechtigung &&
      benutzer &&
      ['MEMBER', 'PARENT'].includes(benutzer.rolle)
    ) {
      return (benutzer.berechtigungen ?? []).includes(item.berechtigung);
    }
    return true;
  };

  return (
    <Sheet open={offen} onOpenChange={setOffen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menü öffnen</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        {/* Vereins-Header */}
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <Avatar className="h-9 w-9">
            {tenant?.logo && (
              <AvatarImage src={`${API_BASE_URL}${tenant.logo}`} alt={tenant.name} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initialen}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold truncate">
            {tenant?.name || 'ClubOS'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="overflow-y-auto p-3 space-y-4" onClick={() => setOffen(false)}>
          {NAVIGATION_GRUPPEN.map((gruppe) => {
            const sichtbar = gruppe.eintraege.filter(filterEintrag);
            if (sichtbar.length === 0) return null;

            return (
              <div key={gruppe.titel || 'start'}>
                {gruppe.titel && (
                  <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {gruppe.titel}
                  </p>
                )}
                <div className="space-y-0.5">
                  {sichtbar.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
