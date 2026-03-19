'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { EmailVerifizierungBanner } from '@/components/auth/email-verifizierung-banner';

/**
 * Wartet auf Zustand persist-Hydration, bevor Auth-Entscheidungen getroffen werden.
 * Verhindert Race Condition bei F5-Refresh (accessToken ist initial null
 * bevor localStorage geladen wird).
 */
function useHydrated() {
  return useSyncExternalStore(
    (cb) => {
      const unsub = useAuthStore.persist.onFinishHydration(cb);
      return () => unsub();
    },
    () => useAuthStore.persist.hasHydrated(),
    () => false, // SSR: immer false
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { istAngemeldet, accessToken, profilLaden, themeAnwenden } =
    useAuthStore();
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    // Erst nach Hydration Auth-Entscheidungen treffen
    if (!hydrated) return;

    if (!accessToken) {
      router.replace('/anmelden');
      return;
    }

    // Theme anwenden und Profil laden
    themeAnwenden();
    profilLaden().finally(() => setBereit(true));
  }, [hydrated, accessToken, router, profilLaden, themeAnwenden]);

  // Nach Profil-Check: nicht angemeldet → zur Anmeldeseite
  useEffect(() => {
    if (bereit && !istAngemeldet) {
      router.replace('/anmelden');
    }
  }, [bereit, istAngemeldet, router]);

  // Waehrend Hydration oder Auth-Check nichts anzeigen
  if (!hydrated || !bereit || !istAngemeldet) {
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
