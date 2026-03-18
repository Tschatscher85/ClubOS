import { Suspense } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { EmailVerifizierenInhalt } from '@/components/auth/email-verifizieren-inhalt';

export default function EmailVerifizierenPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">E-Mail verifizieren</CardTitle>
        <CardDescription>
          Ihre E-Mail-Adresse wird verifiziert...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Laden...</div>}>
          <EmailVerifizierenInhalt />
        </Suspense>
      </CardContent>
    </Card>
  );
}
