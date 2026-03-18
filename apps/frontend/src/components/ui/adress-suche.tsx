'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface NominatimErgebnis {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface AdressSucheProps {
  id?: string;
  value: string;
  onChange: (adresse: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
}

export function AdressSuche({
  id,
  value,
  onChange,
  placeholder = 'Adresse suchen...',
  className,
}: AdressSucheProps) {
  const [suche, setSuche] = useState(value);
  const [ergebnisse, setErgebnisse] = useState<NominatimErgebnis[]>([]);
  const [offen, setOffen] = useState(false);
  const [ladend, setLadend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync von aussen
  useEffect(() => {
    setSuche(value);
  }, [value]);

  // Klick ausserhalb schliesst Dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sucheAusfuehren = useCallback(async (text: string) => {
    if (text.length < 3) {
      setErgebnisse([]);
      setOffen(false);
      return;
    }

    setLadend(true);
    try {
      const params = new URLSearchParams({
        q: text,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'de,at,ch',
        'accept-language': 'de',
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: { 'User-Agent': 'ClubOS/1.0' },
        },
      );

      if (res.ok) {
        const daten: NominatimErgebnis[] = await res.json();
        setErgebnisse(daten);
        setOffen(daten.length > 0);
      }
    } catch {
      // Netzwerkfehler ignorieren
    } finally {
      setLadend(false);
    }
  }, []);

  const handleInputChange = (text: string) => {
    setSuche(text);
    onChange(text);

    // Debounce: 400ms nach letzter Eingabe suchen
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => sucheAusfuehren(text), 400);
  };

  const handleAuswahl = (ergebnis: NominatimErgebnis) => {
    const addr = ergebnis.address;
    const strasse = [addr.road, addr.house_number].filter(Boolean).join(' ');
    const ort = addr.city || addr.town || addr.village || '';
    const plz = addr.postcode || '';

    const formatiert = [strasse, [plz, ort].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ');

    setSuche(formatiert);
    onChange(
      formatiert,
      parseFloat(ergebnis.lat),
      parseFloat(ergebnis.lon),
    );
    setOffen(false);
    setErgebnisse([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={suche}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => ergebnisse.length > 0 && setOffen(true)}
          placeholder={placeholder}
          className={`pl-9 ${className || ''}`}
          autoComplete="off"
        />
        {ladend && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {offen && ergebnisse.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {ergebnisse.map((e) => (
            <button
              key={e.place_id}
              type="button"
              onClick={() => handleAuswahl(e)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{e.display_name}</span>
            </button>
          ))}
          <div className="border-t px-3 py-1.5 text-xs text-muted-foreground text-right">
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}
