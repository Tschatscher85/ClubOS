'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { EmailVerifizierungBanner } from '@/components/auth/email-verifizierung-banner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { istAngemeldet, accessToken, profilLaden, themeAnwenden } =
    useAuthStore();
  const [bereit, setBereit] = useState(false);
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
    profilLaden().finally(() => setBereit(true));
  }, [aufClient, accessToken, router, profilLaden, themeAnwenden]);

  // Nach Profil-Check: nicht angemeldet → zur Anmeldeseite
  useEffect(() => {
    if (bereit && !istAngemeldet) {
      router.replace('/anmelden');
    }
  }, [bereit, istAngemeldet, router]);

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
