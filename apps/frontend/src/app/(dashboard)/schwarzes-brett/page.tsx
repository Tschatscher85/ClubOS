'use client';

import { ClipboardList } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PinnwandInhalt from './pinnwand-inhalt';
import GalerieInhalt from '../galerie/galerie-inhalt';
import FahrgemeinschaftenInhalt from '../fahrgemeinschaften/fahrgemeinschaften-inhalt';

export default function PinnwandPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Pinnwand & Galerie</h1>
          <p className="text-muted-foreground">
            Aushaenge, Fotos und Fahrgemeinschaften
          </p>
        </div>
      </div>
      <Tabs defaultValue="pinnwand">
        <TabsList>
          <TabsTrigger value="pinnwand">Pinnwand</TabsTrigger>
          <TabsTrigger value="galerie">Galerie</TabsTrigger>
          <TabsTrigger value="fahrten">Fahrtenboerse</TabsTrigger>
        </TabsList>
        <TabsContent value="pinnwand">
          <PinnwandInhalt />
        </TabsContent>
        <TabsContent value="galerie">
          <GalerieInhalt />
        </TabsContent>
        <TabsContent value="fahrten">
          <FahrgemeinschaftenInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
