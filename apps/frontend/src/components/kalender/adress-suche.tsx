'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface AdressSucheProps {
  value: string;
  onChange: (adresse: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

interface NominatimErgebnis {
  display_name: string;
  lat: string;
  lon: string;
}

export function AdressSuche({
  value,
  onChange,
  placeholder = 'Adresse suchen...',
  required,
  id,
}: AdressSucheProps) {
  const [vorschlaege, setVorschlaege] = useState<NominatimErgebnis[]>([]);
  const [offen, setOffen] = useState(false);
  const [suchText, setSuchText] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuchText(value);
  }, [value]);

  useEffect(() => {
    const handleClickAussen = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAussen);
    return () => document.removeEventListener('mousedown', handleClickAussen);
  }, []);

  const suchen = (text: string) => {
    setSuchText(text);
    onChange(text);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (text.length < 3) {
      setVorschlaege([]);
      setOffen(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=de&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'de' } },
        );
        const daten: NominatimErgebnis[] = await res.json();
        setVorschlaege(daten);
        setOffen(daten.length > 0);
      } catch {
        setVorschlaege([]);
      }
    }, 400);
  };

  const auswaehlen = (ergebnis: NominatimErgebnis) => {
    setSuchText(ergebnis.display_name);
    onChange(ergebnis.display_name);
    setOffen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={suchText}
          onChange={(e) => suchen(e.target.value)}
          onFocus={() => vorschlaege.length > 0 && setOffen(true)}
          placeholder={placeholder}
          required={required}
          className="pl-9"
        />
      </div>
      {offen && vorschlaege.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
          {vorschlaege.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => auswaehlen(v)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b last:border-b-0 truncate"
            >
              <MapPin className="inline h-3 w-3 mr-1.5 text-muted-foreground" />
              {v.display_name}
            </button>
          ))}
          <div className="px-3 py-1 text-[10px] text-muted-foreground border-t">
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}
