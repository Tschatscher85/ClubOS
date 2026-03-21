'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User, ShieldCheck, ShieldAlert, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useOnlineStatus } from '@/hooks/use-online';
import { MobileSidebar } from './mobile-sidebar';
import { Badge } from '@/components/ui/badge';
import { DarkModeToggle } from '@/components/dark-mode-toggle';
import { PushOptIn } from '@/components/push/push-opt-in';

const ROLLEN_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  TRAINER: 'Trainer',
  MEMBER: 'Mitglied',
  PARENT: 'Elternteil',
  HALLENWART: 'Hallenwart',
};

export function Header() {
  const { benutzer, tenant, abmelden } = useAuth();
  const { istOnline, backendErreichbar } = useOnlineStatus();
  const router = useRouter();

  const handleAbmelden = () => {
    abmelden();
    router.push('/anmelden');
  };

  const istVerifiziert = benutzer?.emailVerifiziert;
  const zeigeOffline = !istOnline || !backendErreichbar;

  return (
    <>
      {/* Offline-Banner */}
      {zeigeOffline && (
        <div className="bg-red-600 text-white px-4 py-1.5 flex items-center justify-center gap-2 text-sm">
          <WifiOff className="h-4 w-4" />
          <span>
            {!istOnline
              ? 'Keine Internetverbindung'
              : 'Server nicht erreichbar — Daten werden eventuell nicht gespeichert'}
          </span>
        </div>
      )}

      <header className="flex h-16 items-center gap-4 border-b bg-card px-4">
        <MobileSidebar />

        <div className="flex-1">
          <h2 className="text-lg font-semibold lg:hidden">
            {tenant?.name || 'Vereinbase'}
          </h2>
        </div>

        <PushOptIn />
        <DarkModeToggle />

        {/* User-Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {benutzer?.email?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm">
                {benutzer?.email}
              </span>
              {!istVerifiziert && (
                <ShieldAlert className="h-4 w-4 text-yellow-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{benutzer?.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-fit">
                    {ROLLEN_LABEL[benutzer?.rolle || ''] || benutzer?.rolle}
                  </Badge>
                  {istVerifiziert ? (
                    <Badge variant="outline" className="w-fit text-green-600 border-green-300">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Verifiziert
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-fit text-yellow-600 border-yellow-300">
                      <ShieldAlert className="mr-1 h-3 w-3" />
                      Nicht verifiziert
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/einstellungen')}>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAbmelden}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </>
  );
}
