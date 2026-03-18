'use client';

import { Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MitgliederInhalt from './mitglieder-inhalt';
import MitarbeiterInhalt from './mitarbeiter-inhalt';

export default function PersonenPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Personen</h1>
          <p className="text-muted-foreground">
            Mitglieder und Mitarbeiter des Vereins
          </p>
        </div>
      </div>

      <Tabs defaultValue="mitglieder">
        <TabsList>
          <TabsTrigger value="mitglieder">Mitglieder</TabsTrigger>
          <TabsTrigger value="mitarbeiter">Mitarbeiter</TabsTrigger>
        </TabsList>
        <TabsContent value="mitglieder">
          <MitgliederInhalt />
        </TabsContent>
        <TabsContent value="mitarbeiter">
          <MitarbeiterInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
