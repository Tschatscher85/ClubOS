'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AbteilungenInhalt from './abteilungen-inhalt';
import TeamsInhalt from './teams-inhalt';

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="abteilungen">
        <TabsList>
          <TabsTrigger value="abteilungen">Abteilungen</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>
        <TabsContent value="abteilungen">
          <AbteilungenInhalt />
        </TabsContent>
        <TabsContent value="teams">
          <TeamsInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
