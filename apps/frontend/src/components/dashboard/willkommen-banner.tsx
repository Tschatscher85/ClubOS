'use client';

import { useTenant, useBenutzer } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function WillkommenBanner() {
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

  return (
    <div className="flex items-center gap-4 rounded-lg bg-primary/5 border border-primary/10 p-6">
      <Avatar className="h-14 w-14">
        {tenant?.logo && <AvatarImage src={tenant.logo} alt={tenant.name} />}
        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
          {initialen}
        </AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-2xl font-bold">
          Willkommen bei {tenant?.name || 'ClubOS'}!
        </h1>
        <p className="text-muted-foreground">
          Angemeldet als {benutzer?.email}
        </p>
      </div>
    </div>
  );
}
