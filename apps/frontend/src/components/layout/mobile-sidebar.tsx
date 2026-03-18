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
  Mail,
  Car,
  Heart,
  Building,
  UserCheck,
  Receipt,
  Zap,
  FileText,
  FolderOpen,
  Settings,
  ClipboardList,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarNavItem } from './sidebar-nav-item';
import { useTenant, useBenutzer } from '@/hooks/use-auth';
import { ROUTEN, API_BASE_URL } from '@/lib/constants';
import { Menu } from 'lucide-react';
import { useState } from 'react';

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
  { href: ROUTEN.POSTEINGANG, label: 'Posteingang', icon: Mail, rollen: null },
  { href: ROUTEN.FAHRGEMEINSCHAFTEN, label: 'Fahrtenboerse', icon: Car, rollen: null },
  { href: ROUTEN.ELTERN, label: 'Eltern-Portal', icon: Heart, rollen: ['PARENT'] },
  { href: ROUTEN.HALLEN, label: 'Hallenbelegung', icon: Building, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.SCHIEDSRICHTER, label: 'Schiedsrichter', icon: UserCheck, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.BUCHHALTUNG, label: 'Buchhaltung', icon: Receipt, rollen: ['SUPERADMIN', 'ADMIN'] },
  { href: ROUTEN.SPONSOREN, label: 'Sponsoren', icon: Heart, rollen: ['SUPERADMIN', 'ADMIN'] },
  { href: ROUTEN.WORKFLOWS, label: 'Workflows', icon: Zap, rollen: ['SUPERADMIN', 'ADMIN'] },
  { href: ROUTEN.FORMULARE, label: 'Formulare', icon: FileText, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.DOKUMENTE, label: 'Dokumente', icon: FolderOpen, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.TRAININGSPLAENE, label: 'Trainingsplaene', icon: ClipboardList, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
  { href: ROUTEN.EINSTELLUNGEN, label: 'Einstellungen', icon: Settings, rollen: ['SUPERADMIN', 'ADMIN'] },
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

  const sichtbareNavigation = NAVIGATION.filter(
    (item) =>
      !item.rollen || (benutzer && item.rollen.includes(benutzer.rolle)),
  );

  return (
    <Sheet open={offen} onOpenChange={setOffen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menue oeffnen</span>
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
        <nav className="space-y-1 p-3" onClick={() => setOffen(false)}>
          {sichtbareNavigation.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
