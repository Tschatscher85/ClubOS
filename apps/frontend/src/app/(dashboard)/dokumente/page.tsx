'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DokumenteInhalt from './dokumente-inhalt';
import FormulareInhalt from './formulare-inhalt';

export default function DokumenteFormularePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dokumente & Formulare</h1>
        <p className="text-muted-foreground">Dokumenten-Ablage und Formularverwaltung</p>
      </div>
      <Tabs defaultValue="dokumente">
        <TabsList>
          <TabsTrigger value="dokumente">Dokumente</TabsTrigger>
          <TabsTrigger value="formulare">Formulare</TabsTrigger>
        </TabsList>
        <TabsContent value="dokumente">
          <DokumenteInhalt />
        </TabsContent>
        <TabsContent value="formulare">
          <FormulareInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
