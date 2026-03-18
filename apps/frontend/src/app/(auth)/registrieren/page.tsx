import { Suspense } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { RegistrierenFormular } from '@/components/auth/registrieren-formular';

export default function RegistrierenPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">ClubOS</CardTitle>
        <CardDescription>
          Registrieren Sie Ihren Verein und starten Sie sofort
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<div className="animate-pulse text-center text-muted-foreground">Laden...</div>}>
          <RegistrierenFormular />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          Bereits registriert?{' '}
          <Link href="/anmelden" className="text-primary underline hover:no-underline">
            Jetzt anmelden
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
