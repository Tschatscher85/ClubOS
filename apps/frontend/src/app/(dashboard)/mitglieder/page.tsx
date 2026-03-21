'use client';

import { Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useBenutzer } from '@/hooks/use-auth';
import MitgliederInhalt from './mitglieder-inhalt';
import MitarbeiterInhalt from './mitarbeiter-inhalt';

export default function PersonenPage() {
  const benutzer = useBenutzer();
  const istAdmin = benutzer && ['SUPERADMIN', 'ADMIN'].includes(benutzer.rolle);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mitglieder & Personal</h1>
          <p className="text-muted-foreground">
            Vereinsmitglieder und Mitarbeiter verwalten
          </p>
        </div>
      </div>

      <Tabs defaultValue="mitglieder">
        <TabsList>
          <TabsTrigger value="mitglieder">Mitglieder</TabsTrigger>
          {istAdmin && (
            <TabsTrigger value="mitarbeiter">Mitarbeiter</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="mitglieder">
          <MitgliederInhalt />
        </TabsContent>
        {istAdmin && (
          <TabsContent value="mitarbeiter">
            <MitarbeiterInhalt />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
