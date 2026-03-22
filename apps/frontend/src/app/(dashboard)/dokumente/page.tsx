'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DokumenteInhalt from './dokumente-inhalt';
import FormulareInhalt from './formulare-inhalt';
import WikiInhalt from '../wiki/wiki-inhalt';

export default function DokumenteFormularePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dokumente & Wiki</h1>
        <p className="text-muted-foreground">Dokumenten-Ablage, Formulare und Vereins-Wiki</p>
      </div>
      <Tabs defaultValue="dokumente">
        <TabsList>
          <TabsTrigger value="dokumente">Dokumente</TabsTrigger>
          <TabsTrigger value="formulare">Formulare</TabsTrigger>
          <TabsTrigger value="wiki">Wiki</TabsTrigger>
        </TabsList>
        <TabsContent value="dokumente">
          <DokumenteInhalt />
        </TabsContent>
        <TabsContent value="formulare">
          <FormulareInhalt />
        </TabsContent>
        <TabsContent value="wiki">
          <WikiInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
