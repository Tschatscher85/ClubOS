'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswortInput } from '@/components/ui/passwort-input';
import { useAuth } from '@/hooks/use-auth';

export function AnmeldeFormular() {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const { anmelden, istLadend, fehler } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await anmelden(email, passwort);
      router.push('/dashboard');
    } catch {
      // Fehler wird im Store gesetzt
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input
          id="email"
          type="email"
          placeholder="vorstand@fckunchen.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="passwort">Passwort</Label>
          <Link
            href="/passwort-vergessen"
            className="text-xs text-muted-foreground hover:text-primary underline"
          >
            Passwort vergessen?
          </Link>
        </div>
        <PasswortInput
          id="passwort"
          placeholder="Passwort eingeben"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {fehler}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={istLadend}>
        {istLadend ? 'Wird angemeldet...' : 'Anmelden'}
      </Button>
    </form>
  );
}
