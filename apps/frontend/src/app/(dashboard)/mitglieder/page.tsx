'use client';

import { Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MitgliederInhalt from './mitglieder-inhalt';
import MitarbeiterInhalt from './mitarbeiter-inhalt';
import FamilienPage from '../familien/page';

export default function PersonenPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mitglieder & Familien</h1>
          <p className="text-muted-foreground">
            Vereinsmitglieder, Mitarbeiter und Familien verwalten
          </p>
        </div>
      </div>

      <Tabs defaultValue="mitglieder">
        <TabsList>
          <TabsTrigger value="mitglieder">Mitglieder</TabsTrigger>
          <TabsTrigger value="mitarbeiter">Mitarbeiter</TabsTrigger>
          <TabsTrigger value="familien">Familien</TabsTrigger>
        </TabsList>
        <TabsContent value="mitglieder">
          <MitgliederInhalt />
        </TabsContent>
        <TabsContent value="mitarbeiter">
          <MitarbeiterInhalt />
        </TabsContent>
        <TabsContent value="familien">
          <FamilienPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
