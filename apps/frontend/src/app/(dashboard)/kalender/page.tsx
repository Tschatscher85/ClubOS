'use client';

import { Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import KalenderInhalt from './kalender-inhalt';
import VeranstaltungenInhalt from './veranstaltungen-inhalt';
import BelegungRessourcenInhalt from './belegung-ressourcen-inhalt';
import TrainingsplaeneInhalt from '../turniere/trainingsplaene-inhalt';

export default function KalenderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Kalender & Spielbetrieb</h1>
          <p className="text-muted-foreground">
            Termine, Veranstaltungen, Belegungen und Trainingsplaene verwalten
          </p>
        </div>
      </div>

      <Tabs defaultValue="kalender">
        <TabsList>
          <TabsTrigger value="kalender">Kalender</TabsTrigger>
          <TabsTrigger value="veranstaltungen">Veranstaltungen</TabsTrigger>
          <TabsTrigger value="belegung">Belegung & Ressourcen</TabsTrigger>
          <TabsTrigger value="training">Trainingsplaene</TabsTrigger>
        </TabsList>
        <TabsContent value="kalender">
          <KalenderInhalt />
        </TabsContent>
        <TabsContent value="veranstaltungen">
          <VeranstaltungenInhalt />
        </TabsContent>
        <TabsContent value="belegung">
          <BelegungRessourcenInhalt />
        </TabsContent>
        <TabsContent value="training">
          <TrainingsplaeneInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
