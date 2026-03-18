'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NachrichtenInhalt from './nachrichten-inhalt';
import PosteingangInhalt from './posteingang-inhalt';

export default function NachrichtenPage() {
  return (
    <div className="space-y-6">
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
    </div>
  );
}
