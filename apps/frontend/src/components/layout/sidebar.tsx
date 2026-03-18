'use client';

import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  Shield,
  Calendar,
  Trophy,
  MessageSquare,
  Car,
  Heart,
  Zap,
  Building,
  UserCheck,
  Receipt,
  FileText,
  FolderOpen,
  Settings,
} from 'lucide-react';
import { useTenant, useBenutzer } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SidebarNavItem } from './sidebar-nav-item';
import { ROUTEN, API_BASE_URL } from '@/lib/constants';

const NAVIGATION: ReadonlyArray<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  rollen: string[] | null;
}> = [
  { href: ROUTEN.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, rollen: null },
  { href: ROUTEN.MITGLIEDER, label: 'Mitglieder', icon: Users, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.MITARBEITER, label: 'Mitarbeiter', icon: UserCog, rollen: ['SUPERADMIN', 'ADMIN'] },
  { href: ROUTEN.ABTEILUNGEN, label: 'Abteilungen', icon: Building2, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.TEAMS, label: 'Teams', icon: Shield, rollen: null },
  { href: ROUTEN.KALENDER, label: 'Kalender', icon: Calendar, rollen: null },
  { href: ROUTEN.TURNIERE, label: 'Turniere', icon: Trophy, rollen: null },
  { href: ROUTEN.NACHRICHTEN, label: 'Nachrichten', icon: MessageSquare, rollen: null },
  { href: ROUTEN.FAHRGEMEINSCHAFTEN, label: 'Fahrtenboerse', icon: Car, rollen: null },
  { href: ROUTEN.ELTERN, label: 'Eltern-Portal', icon: Heart, rollen: ['PARENT'] },
  { href: ROUTEN.HALLEN, label: 'Hallenbelegung', icon: Building, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.SCHIEDSRICHTER, label: 'Schiedsrichter', icon: UserCheck, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.BUCHHALTUNG, label: 'Buchhaltung', icon: Receipt, rollen: ['SUPERADMIN', 'ADMIN'] },
  { href: ROUTEN.SPONSOREN, label: 'Sponsoren', icon: Heart, rollen: ['SUPERADMIN', 'ADMIN'] },
  { href: ROUTEN.WORKFLOWS, label: 'Workflows', icon: Zap, rollen: ['SUPERADMIN', 'ADMIN'] },
  { href: ROUTEN.FORMULARE, label: 'Formulare', icon: FileText, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.DOKUMENTE, label: 'Dokumente', icon: FolderOpen, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.EINSTELLUNGEN, label: 'Einstellungen', icon: Settings, rollen: ['SUPERADMIN', 'ADMIN'] },
];

export function Sidebar() {
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

  const sichtbareNavigation = NAVIGATION.filter(
    (item) =>
      !item.rollen || (benutzer && item.rollen.includes(benutzer.rolle)),
  );

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card">
      {/* Vereins-Header */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <Avatar className="h-9 w-9">
          {tenant?.logo && <AvatarImage src={`${API_BASE_URL}${tenant.logo}`} alt={tenant.name} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initialen}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="text-sm font-semibold truncate">
            {tenant?.name || 'ClubOS'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {sichtbareNavigation.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <Separator className="mb-3" />
        <div className="flex items-center gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {benutzer?.email?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-xs font-medium truncate">{benutzer?.email}</p>
            <p className="text-xs text-muted-foreground">{benutzer?.rolle}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
