'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BelegungsplanInhalt from './belegungsplan-inhalt';
import RessourcenInhalt from './ressourcen-inhalt';

export default function BelegungRessourcenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Belegung & Ressourcen</h1>
        <p className="text-muted-foreground">Hallenbelegung und Ressourcenverwaltung</p>
      </div>
      <Tabs defaultValue="belegungsplan">
        <TabsList>
          <TabsTrigger value="belegungsplan">Belegungsplan</TabsTrigger>
          <TabsTrigger value="ressourcen">Ressourcen & Buchung</TabsTrigger>
        </TabsList>
        <TabsContent value="belegungsplan">
          <BelegungsplanInhalt />
        </TabsContent>
        <TabsContent value="ressourcen">
          <RessourcenInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
