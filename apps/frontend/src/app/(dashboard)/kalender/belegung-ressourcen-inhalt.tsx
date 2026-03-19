'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building, MapPin } from 'lucide-react';
import BelegungsplanInhalt from '../hallen/belegungsplan-inhalt';
import RessourcenInhalt from '../hallen/ressourcen-inhalt';

export default function BelegungRessourcenInhalt() {
  return (
    <div className="space-y-4">
      {/* Erklaerung */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Belegung & Ressourcen</p>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>
            <strong>Wochenbelegung:</strong> Wiederkehrende Hallenbelegungen
            (z.B. &quot;Montag 18-20 Uhr: A-Jugend in der Jahnhalle&quot;)
          </li>
          <li>
            <strong>Ressourcen-Buchung:</strong> Einmalige Reservierungen von
            Raeumen, Plaetzen oder Geraeten (z.B. &quot;Vereinsheim am 15.04.
            fuer Vorstandssitzung&quot;)
          </li>
        </ul>
      </div>

      <Tabs defaultValue="wochenbelegung">
        <TabsList>
          <TabsTrigger value="wochenbelegung" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Wochenbelegung
          </TabsTrigger>
          <TabsTrigger value="ressourcen" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ressourcen-Buchung
          </TabsTrigger>
        </TabsList>
        <TabsContent value="wochenbelegung">
          <BelegungsplanInhalt />
        </TabsContent>
        <TabsContent value="ressourcen">
          <RessourcenInhalt />
        </TabsContent>
      </Tabs>
    </div>
  );
}
