'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TeamsInhalt from './teams-inhalt';
import AbteilungenInhalt from './abteilungen-inhalt';

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="abteilungen">Abteilungen</TabsTrigger>
        </TabsList>
        <TabsContent value="teams">
          <TeamsInhalt />
        </TabsContent>
        <TabsContent value="abteilungen">
          <AbteilungenInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
