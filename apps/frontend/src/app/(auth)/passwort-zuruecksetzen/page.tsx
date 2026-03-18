import { Suspense } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { PasswortZuruecksetzenFormular } from '@/components/auth/passwort-zuruecksetzen-formular';

export default function PasswortZuruecksetzenPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Neues Passwort setzen</CardTitle>
        <CardDescription>
          Geben Sie Ihr neues Passwort ein.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Laden...</div>}>
          <PasswortZuruecksetzenFormular />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/anmelden" className="text-primary underline hover:no-underline">
            Zurueck zur Anmeldung
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
