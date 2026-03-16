'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
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
import { MobileSidebar } from './mobile-sidebar';
import { Badge } from '@/components/ui/badge';

const ROLLEN_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  TRAINER: 'Trainer',
  MEMBER: 'Mitglied',
  PARENT: 'Elternteil',
};

export function Header() {
  const { benutzer, tenant, abmelden } = useAuth();
  const router = useRouter();

  const handleAbmelden = () => {
    abmelden();
    router.push('/anmelden');
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4">
      <MobileSidebar />

      <div className="flex-1">
        <h2 className="text-lg font-semibold lg:hidden">
          {tenant?.name || 'ClubOS'}
        </h2>
      </div>

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
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{benutzer?.email}</p>
              <Badge variant="secondary" className="w-fit">
                {ROLLEN_LABEL[benutzer?.rolle || ''] || benutzer?.rolle}
              </Badge>
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
  );
}
