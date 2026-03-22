'use client';

import { Heart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SponsorenInhalt from './sponsoren-inhalt';
import CrowdfundingInhalt from '../funding/crowdfunding-inhalt';

export default function SponsorenCrowdfundingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Sponsoren & Crowdfunding</h1>
          <p className="text-muted-foreground">
            Werbepartner, Foerderer und Spendenprojekte verwalten
          </p>
        </div>
      </div>
      <Tabs defaultValue="sponsoren">
        <TabsList>
          <TabsTrigger value="sponsoren">Sponsoren</TabsTrigger>
          <TabsTrigger value="crowdfunding">Crowdfunding</TabsTrigger>
        </TabsList>
        <TabsContent value="sponsoren">
          <SponsorenInhalt />
        </TabsContent>
        <TabsContent value="crowdfunding">
          <CrowdfundingInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
