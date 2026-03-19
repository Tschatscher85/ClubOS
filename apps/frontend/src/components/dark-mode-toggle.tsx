'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DarkModeToggle() {
  const [dunkel, setDunkel] = useState(false);

  useEffect(() => {
    const gespeichert = localStorage.getItem('vereinbase-dark-mode');
    const istDunkel =
      gespeichert === 'true' ||
      (!gespeichert && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDunkel(istDunkel);
    document.documentElement.classList.toggle('dark', istDunkel);
  }, []);

  const toggle = () => {
    const neu = !dunkel;
    setDunkel(neu);
    document.documentElement.classList.toggle('dark', neu);
    localStorage.setItem('vereinbase-dark-mode', String(neu));
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={dunkel ? 'Helles Design' : 'Dunkles Design'}>
      {dunkel ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
