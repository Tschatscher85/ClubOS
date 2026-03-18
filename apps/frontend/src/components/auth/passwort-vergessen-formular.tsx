'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

export function PasswortVergessenFormular() {
  const [email, setEmail] = useState('');
  const [istLadend, setIstLadend] = useState(false);
  const [gesendet, setGesendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(null);
    setIstLadend(true);

    try {
      await apiClient.post('/auth/passwort-vergessen', { email });
      setGesendet(true);
    } catch (error) {
      setFehler(
        error instanceof Error
          ? error.message
          : 'Ein Fehler ist aufgetreten.',
      );
    } finally {
      setIstLadend(false);
    }
  };

  if (gesendet) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-primary/10 p-4 text-sm text-primary">
          Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen
          einen Link zum Zuruecksetzen des Passworts gesendet. Bitte pruefen Sie
          Ihr Postfach.
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setGesendet(false);
            setEmail('');
          }}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">E-Mail-Adresse</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="vorstand@fckunchen.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {fehler}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={istLadend}>
        {istLadend ? 'Wird gesendet...' : 'Link zum Zuruecksetzen senden'}
      </Button>
    </form>
  );
}
