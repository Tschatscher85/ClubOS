'use client';

import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  MessageSquare,
  Car,
  Heart,
  HandHeart,
  UserCheck,
  Receipt,
  Zap,
  FolderOpen,
  Database,
  Settings,
  ShieldCheck,
  UserCircle,
  FileEdit,
  BarChart3,
  ClipboardList,
  UsersRound,
  Store,
  FileBarChart,
  UserX,
  Camera,
  BookOpen,
  CalendarRange,
  Activity,
  Award,
} from 'lucide-react';
import { useTenant, useBenutzer } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarNavItem } from './sidebar-nav-item';
import { ROUTEN, API_BASE_URL } from '@/lib/constants';

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
      { href: ROUTEN.MEIN_PROFIL, label: 'Mein Profil', icon: UserCircle, rollen: null },
    ],
  },
  {
    titel: 'Verein',
    eintraege: [
      { href: ROUTEN.MITGLIEDER, label: 'Mitglieder & Personal', icon: Users, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'], berechtigung: 'MITGLIEDER' },
      { href: ROUTEN.FAMILIEN, label: 'Familien', icon: UsersRound, rollen: ['SUPERADMIN', 'ADMIN'] },
      { href: ROUTEN.TEAMS, label: 'Teams & Abteilungen', icon: Shield, rollen: null, berechtigung: 'TEAMS' },
    ],
  },
  {
    titel: 'Aktivitäten',
    eintraege: [
      { href: ROUTEN.KALENDER, label: 'Kalender & Spielbetrieb', icon: Calendar, rollen: null, berechtigung: 'KALENDER' },
      { href: ROUTEN.NACHRICHTEN, label: 'Nachrichten', icon: MessageSquare, rollen: null, berechtigung: 'NACHRICHTEN' },
      { href: ROUTEN.FAHRGEMEINSCHAFTEN, label: 'Fahrtenbörse', icon: Car, rollen: null, berechtigung: 'FAHRGEMEINSCHAFTEN' },
      { href: ROUTEN.UMFRAGEN, label: 'Umfragen', icon: BarChart3, rollen: null },
      { href: ROUTEN.SCHWARZES_BRETT, label: 'Schwarzes Brett', icon: ClipboardList, rollen: null },
      { href: ROUTEN.GALERIE, label: 'Galerie', icon: Camera, rollen: null },
      { href: ROUTEN.EHRENAMT, label: 'Ehrenamt', icon: HandHeart, rollen: null },
      { href: ROUTEN.WIKI, label: 'Wiki', icon: BookOpen, rollen: null },
      { href: ROUTEN.MARKTPLATZ, label: 'Marktplatz', icon: Store, rollen: ['SUPERADMIN', 'ADMIN'] },
    ],
  },
  {
    titel: 'Trainer-Tools',
    eintraege: [
      { href: ROUTEN.SAISONPLANUNG, label: 'Saisonplanung', icon: CalendarRange, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
    ],
  },
  {
    titel: 'Verwaltung',
    eintraege: [
      { href: ROUTEN.SCHIEDSRICHTER, label: 'Schiedsrichter', icon: UserCheck, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'], berechtigung: 'SCHIEDSRICHTER' },
      { href: ROUTEN.BUCHHALTUNG, label: 'Buchhaltung & Beiträge', icon: Receipt, rollen: ['SUPERADMIN', 'ADMIN'], berechtigung: 'BUCHHALTUNG' },
      { href: ROUTEN.SPONSOREN, label: 'Sponsoren', icon: Heart, rollen: ['SUPERADMIN', 'ADMIN'], berechtigung: 'SPONSOREN' },
      { href: ROUTEN.DOKUMENTE, label: 'Dokumente & Formulare', icon: FolderOpen, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'], berechtigung: 'DOKUMENTE' },
      { href: ROUTEN.BERICHTE, label: 'Berichte', icon: FileBarChart, rollen: ['SUPERADMIN', 'ADMIN'] },
      { href: ROUTEN.MITGLIEDERBINDUNG, label: 'Mitgliederbindung', icon: UserX, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
      { href: ROUTEN.GESUNDHEITSCHECK, label: 'Gesundheitscheck', icon: Activity, rollen: ['SUPERADMIN', 'ADMIN'] },
      { href: ROUTEN.TRAINER_LIZENZEN, label: 'Trainer-Lizenzen', icon: Award, rollen: ['SUPERADMIN', 'ADMIN', 'TRAINER'] },
    ],
  },
  {
    titel: 'System',
    eintraege: [
      { href: ROUTEN.WORKFLOWS, label: 'Workflows', icon: Zap, rollen: ['SUPERADMIN', 'ADMIN'], berechtigung: 'WORKFLOWS' },
      { href: ROUTEN.DFBNET, label: 'DFBnet Import/Export', icon: Database, rollen: ['SUPERADMIN', 'ADMIN'] },
      { href: ROUTEN.EINSTELLUNGEN, label: 'Einstellungen', icon: Settings, rollen: ['SUPERADMIN', 'ADMIN'], berechtigung: 'EINSTELLUNGEN' },
      { href: ROUTEN.AENDERUNGSANTRAEGE, label: 'Änderungsanträge', icon: FileEdit, rollen: ['SUPERADMIN', 'ADMIN'] },
    ],
  },
  {
    titel: '',
    eintraege: [
      { href: ROUTEN.ELTERN, label: 'Eltern-Portal', icon: Heart, rollen: ['PARENT'] },
    ],
  },
  {
    titel: '',
    eintraege: [
      { href: '/admin', label: 'Admin-Dashboard', icon: ShieldCheck, rollen: ['SUPERADMIN'] },
    ],
  },
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
            {tenant?.name || 'Vereinbase'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
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

      {/* Footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-3 py-1">
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
