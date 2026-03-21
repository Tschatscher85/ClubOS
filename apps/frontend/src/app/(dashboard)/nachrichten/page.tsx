'use client';

import { MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NachrichtenInhalt from './nachrichten-inhalt';
import PosteingangInhalt from './posteingang-inhalt';
import UmfragenPage from '../umfragen/page';

export default function NachrichtenSeite() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Nachrichten & Umfragen</h1>
          <p className="text-muted-foreground">
            Kommunikation, Posteingang und Umfragen verwalten
          </p>
        </div>
      </div>

      <Tabs defaultValue="nachrichten">
        <TabsList>
          <TabsTrigger value="nachrichten">Nachrichten</TabsTrigger>
          <TabsTrigger value="posteingang">Posteingang</TabsTrigger>
          <TabsTrigger value="umfragen">Umfragen</TabsTrigger>
        </TabsList>
        <TabsContent value="nachrichten">
          <NachrichtenInhalt />
        </TabsContent>
        <TabsContent value="posteingang">
          <PosteingangInhalt />
        </TabsContent>
        <TabsContent value="umfragen">
          <UmfragenPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
