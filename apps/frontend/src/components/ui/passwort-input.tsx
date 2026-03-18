'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './button';

export interface PasswortInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  zeigeStaerke?: boolean;
}

function berechneStaerke(passwort: string): {
  stufe: number;
  label: string;
  farbe: string;
} {
  if (!passwort) return { stufe: 0, label: '', farbe: '' };

  let punkte = 0;
  if (passwort.length >= 8) punkte++;
  if (passwort.length >= 12) punkte++;
  if (/[a-z]/.test(passwort) && /[A-Z]/.test(passwort)) punkte++;
  if (/\d/.test(passwort)) punkte++;
  if (/[^a-zA-Z0-9]/.test(passwort)) punkte++;

  if (punkte <= 1) return { stufe: 1, label: 'Schwach', farbe: 'bg-red-500' };
  if (punkte <= 2) return { stufe: 2, label: 'Mittel', farbe: 'bg-orange-500' };
  if (punkte <= 3) return { stufe: 3, label: 'Gut', farbe: 'bg-yellow-500' };
  if (punkte <= 4) return { stufe: 4, label: 'Stark', farbe: 'bg-green-500' };
  return { stufe: 5, label: 'Sehr stark', farbe: 'bg-green-600' };
}

const PasswortInput = React.forwardRef<HTMLInputElement, PasswortInputProps>(
  ({ className, zeigeStaerke = false, value, onChange, ...props }, ref) => {
    const [sichtbar, setSichtbar] = React.useState(false);
    const wert = typeof value === 'string' ? value : '';
    const staerke = zeigeStaerke ? berechneStaerke(wert) : null;

    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            type={sichtbar ? 'text' : 'password'}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            ref={ref}
            value={value}
            onChange={onChange}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
            onClick={() => setSichtbar(!sichtbar)}
            tabIndex={-1}
          >
            {sichtbar ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {zeigeStaerke && wert && staerke && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i <= staerke.stufe ? staerke.farbe : 'bg-muted',
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{staerke.label}</p>
          </div>
        )}
      </div>
    );
  },
);
PasswortInput.displayName = 'PasswortInput';

export { PasswortInput };
