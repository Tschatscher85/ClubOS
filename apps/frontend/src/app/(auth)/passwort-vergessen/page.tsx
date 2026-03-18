import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { PasswortVergessenFormular } from '@/components/auth/passwort-vergessen-formular';

export default function PasswortVergessenPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Passwort vergessen</CardTitle>
        <CardDescription>
          Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum
          Zuruecksetzen Ihres Passworts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PasswortVergessenFormular />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/anmelden" className="text-primary underline hover:no-underline">
            Zurueck zur Anmeldung
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
