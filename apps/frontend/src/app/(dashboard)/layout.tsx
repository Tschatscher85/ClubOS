'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { EmailVerifizierungBanner } from '@/components/auth/email-verifizierung-banner';
import { apiClient } from '@/lib/api-client';
import { Ban, Mail } from 'lucide-react';

function Sperrseite({ grund }: { grund?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <Ban className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold">Verein gesperrt</h1>
        {grund && (
          <p className="text-muted-foreground">
            <strong>Grund:</strong> {grund}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Ihr Vereinszugang wurde voruebergehend gesperrt. Bitte kontaktieren
          Sie den Support, um den Zugang wiederherzustellen.
        </p>
        <a
          href="mailto:support@clubos.de"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Mail className="h-4 w-4" /> support@clubos.de
        </a>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { istAngemeldet, accessToken, profilLaden, themeAnwenden } =
    useAuthStore();
  const [bereit, setBereit] = useState(false);
  const [gesperrt, setGesperrt] = useState<{ grund?: string } | null>(null);
  // Client-Mount-Flag: erst nach dem ersten Render auf dem Client
  // ist Zustand aus localStorage hydriert
  const [aufClient, setAufClient] = useState(false);

  useEffect(() => {
    setAufClient(true);
  }, []);

  useEffect(() => {
    // Erst nach Client-Mount Auth pruefen (Zustand muss erst aus localStorage laden)
    if (!aufClient) return;

    if (!accessToken) {
      router.replace('/anmelden');
      return;
    }

    // Theme anwenden und Profil laden
    themeAnwenden();
    profilLaden()
      .then(() => {
        // Tenant-Status pruefen mit einem einfachen API-Call
        return apiClient.get('/auth/profil').catch((err: Error) => {
          if (err.message?.includes('gesperrt')) {
            setGesperrt({ grund: err.message });
          }
          throw err;
        });
      })
      .catch(() => {})
      .finally(() => setBereit(true));
  }, [aufClient, accessToken, router, profilLaden, themeAnwenden]);

  // Nach Profil-Check: nicht angemeldet → zur Anmeldeseite
  useEffect(() => {
    if (bereit && !istAngemeldet && !gesperrt) {
      router.replace('/anmelden');
    }
  }, [bereit, istAngemeldet, gesperrt, router]);

  // Sperrseite anzeigen
  if (gesperrt) {
    return <Sperrseite grund={gesperrt.grund} />;
  }

  // Waehrend Auth-Check nichts anzeigen
  if (!bereit || !istAngemeldet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <EmailVerifizierungBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
