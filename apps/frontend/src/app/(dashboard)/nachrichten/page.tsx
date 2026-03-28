'use client';

import { MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NachrichtenInhalt from './nachrichten-inhalt';
import PosteingangInhalt from './posteingang-inhalt';
import { useBenutzer } from '@/hooks/use-auth';

export default function NachrichtenSeite() {
  const benutzer = useBenutzer();
  const istTrainerOderAdmin = benutzer && ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Nachrichten</h1>
          <p className="text-muted-foreground">
            {istTrainerOderAdmin
              ? 'Team-Kommunikation und Posteingang'
              : 'Nachrichten einsehen und beantworten'}
          </p>
        </div>
      </div>

      {istTrainerOderAdmin ? (
        <Tabs defaultValue="nachrichten">
          <TabsList>
            <TabsTrigger value="nachrichten">Nachrichten</TabsTrigger>
            <TabsTrigger value="posteingang">Posteingang</TabsTrigger>
          </TabsList>
          <TabsContent value="nachrichten">
            <NachrichtenInhalt />
          </TabsContent>
          <TabsContent value="posteingang">
            <PosteingangInhalt />
          </TabsContent>
        </Tabs>
      ) : (
        <NachrichtenInhalt />
      )}
    </div>
  );
}
