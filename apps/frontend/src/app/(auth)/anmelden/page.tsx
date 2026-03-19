import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { AnmeldeFormular } from '@/components/auth/anmelde-formular';
import { GoogleButton } from '@/components/auth/google-button';

export default function AnmeldenPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Vereinbase</CardTitle>
        <CardDescription>
          Melden Sie sich mit Ihrem Vereinskonto an
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnmeldeFormular />
        <GoogleButton />
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            <Link
              href="/passwort-vergessen"
              className="text-primary underline hover:no-underline"
            >
              Passwort vergessen?
            </Link>
          </p>
          <p>
            Noch kein Konto?{' '}
            <Link
              href="/registrieren"
              className="text-primary underline hover:no-underline"
            >
              Verein registrieren
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
