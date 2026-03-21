'use client';

import { Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import KalenderInhalt from './kalender-inhalt';
import VeranstaltungenInhalt from './veranstaltungen-inhalt';
import BelegungRessourcenInhalt from './belegung-ressourcen-inhalt';
import TrainingsplaeneInhalt from '../turniere/trainingsplaene-inhalt';
import SaisonplanungPage from '../saisonplanung/page';
import { useBenutzer } from '@/hooks/use-auth';

export default function KalenderPage() {
  const benutzer = useBenutzer();
  const istTrainerOderAdmin = benutzer && ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Kalender & Saison</h1>
          <p className="text-muted-foreground">
            {istTrainerOderAdmin
              ? 'Termine, Veranstaltungen, Saisonplanung und Trainingspläne verwalten'
              : 'Termine einsehen und An-/Abmeldungen verwalten'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="kalender">
        <TabsList>
          <TabsTrigger value="kalender">Kalender</TabsTrigger>
          {istTrainerOderAdmin && (
            <>
              <TabsTrigger value="veranstaltungen">Veranstaltungen</TabsTrigger>
              <TabsTrigger value="saison">Saisonplanung</TabsTrigger>
              <TabsTrigger value="belegung">Belegung & Ressourcen</TabsTrigger>
              <TabsTrigger value="training">Trainingspläne</TabsTrigger>
            </>
          )}
        </TabsList>
        <TabsContent value="kalender">
          <KalenderInhalt />
        </TabsContent>
        {istTrainerOderAdmin && (
          <>
            <TabsContent value="veranstaltungen">
              <VeranstaltungenInhalt />
            </TabsContent>
            <TabsContent value="saison">
              <SaisonplanungPage />
            </TabsContent>
            <TabsContent value="belegung">
              <BelegungRessourcenInhalt />
            </TabsContent>
            <TabsContent value="training">
              <TrainingsplaeneInhalt />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
