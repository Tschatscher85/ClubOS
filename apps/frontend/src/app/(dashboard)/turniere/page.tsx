'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TurniereInhalt from './turniere-inhalt';
import TrainingsplaeneInhalt from './trainingsplaene-inhalt';

export default function SpielbetriebPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spielbetrieb</h1>
        <p className="text-muted-foreground">Turniere, Spiele und Trainingsplaene verwalten</p>
      </div>
      <Tabs defaultValue="turniere">
        <TabsList>
          <TabsTrigger value="turniere">Turniere & Spiele</TabsTrigger>
          <TabsTrigger value="trainingsplaene">Trainingsplaene</TabsTrigger>
        </TabsList>
        <TabsContent value="turniere">
          <TurniereInhalt />
        </TabsContent>
        <TabsContent value="trainingsplaene">
          <TrainingsplaeneInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
