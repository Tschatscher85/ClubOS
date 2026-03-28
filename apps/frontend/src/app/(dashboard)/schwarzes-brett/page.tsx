'use client';

import { useState, useRef, useEffect } from 'react';
import { ClipboardList, Plus, ChevronDown, Megaphone, BarChart3, Car, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PinnwandInhalt from './pinnwand-inhalt';
import GalerieInhalt from '../galerie/galerie-inhalt';
import FahrgemeinschaftenInhalt from '../fahrgemeinschaften/fahrgemeinschaften-inhalt';
import UmfragenPage from '../umfragen/page';
import { useBenutzer } from '@/hooks/use-auth';

export default function PinnwandUndMehrPage() {
  const benutzer = useBenutzer();
  const istTrainerOderAdmin = benutzer && ['SUPERADMIN', 'ADMIN', 'TRAINER'].includes(benutzer.rolle);
  const [dropdownOffen, setDropdownOffen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOffen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header mit Neu-Erstellen Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Pinnwand & Mehr</h1>
            <p className="text-muted-foreground">
              Aushaenge, Umfragen, Fotos und Fahrgemeinschaften
            </p>
          </div>
        </div>

        {/* + Neu erstellen Dropdown */}
        {istTrainerOderAdmin && (
          <div className="relative" ref={dropdownRef}>
            <Button
              onClick={() => setDropdownOffen(!dropdownOffen)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Neu erstellen
              <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOffen ? 'rotate-180' : ''}`} />
            </Button>

            {dropdownOffen && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-md border bg-popover shadow-lg z-50">
                <div className="p-1">
                  <button
                    onClick={() => { setDropdownOffen(false); document.getElementById('pinnwand-erstellen-btn')?.click(); }}
                    className="flex items-center gap-3 w-full rounded-sm px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <Megaphone className="h-4 w-4 text-orange-500" />
                    <div className="text-left">
                      <p className="font-medium">Aushang</p>
                      <p className="text-xs text-muted-foreground">Info, Ausfall, Ankuendigung</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setDropdownOffen(false); document.getElementById('umfrage-erstellen-btn')?.click(); }}
                    className="flex items-center gap-3 w-full rounded-sm px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium">Umfrage</p>
                      <p className="text-xs text-muted-foreground">Abstimmung, Doodle-Ersatz</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setDropdownOffen(false); document.getElementById('fahrt-erstellen-btn')?.click(); }}
                    className="flex items-center gap-3 w-full rounded-sm px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <Car className="h-4 w-4 text-green-500" />
                    <div className="text-left">
                      <p className="font-medium">Fahrgemeinschaft</p>
                      <p className="text-xs text-muted-foreground">Mitfahrgelegenheit anbieten</p>
                    </div>
                  </button>
                  <div className="border-t my-1" />
                  <button
                    onClick={() => { setDropdownOffen(false); document.getElementById('galerie-upload-btn')?.click(); }}
                    className="flex items-center gap-3 w-full rounded-sm px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <Image className="h-4 w-4 text-purple-500" />
                    <div className="text-left">
                      <p className="font-medium">Fotos hochladen</p>
                      <p className="text-xs text-muted-foreground">Bilder zur Galerie</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alles in einem Feed — keine Tabs */}
      <div className="space-y-8">
        {/* Pinnwand-Eintraege */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange-500" />
            Pinnwand
          </h2>
          <PinnwandInhalt />
        </section>

        {/* Umfragen */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Umfragen
          </h2>
          <UmfragenPage />
        </section>

        {/* Fahrgemeinschaften */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Car className="h-5 w-5 text-green-500" />
            Fahrtenboerse
          </h2>
          <FahrgemeinschaftenInhalt />
        </section>

        {/* Galerie */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Image className="h-5 w-5 text-purple-500" />
            Galerie
          </h2>
          <GalerieInhalt />
        </section>
      </div>
    </div>
  );
}
