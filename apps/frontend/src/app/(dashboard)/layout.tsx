'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { EmailVerifizierungBanner } from '@/components/auth/email-verifizierung-banner';
import { Ban, Mail, ArrowLeft } from 'lucide-react';

function ImpersonationBanner() {
  const [sichtbar, setSichtbar] = useState(false);

  useEffect(() => {
    setSichtbar(!!localStorage.getItem('vereinbase-auth-admin-backup'));
  }, []);

  if (!sichtbar) return null;

  const zurueckZumAdmin = () => {
    const backup = localStorage.getItem('vereinbase-auth-admin-backup');
    if (backup) {
      localStorage.setItem('vereinbase-auth', backup);
      localStorage.removeItem('vereinbase-auth-admin-backup');
      window.location.href = '/admin';
    }
  };

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">Fernwartung aktiv</span>
        <span className="opacity-80">— Du siehst diesen Verein als deren Admin</span>
      </div>
      <button
        onClick={zurueckZumAdmin}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zum Admin
      </button>
    </div>
  );
}

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
          href="mailto:support@vereinbase.de"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Mail className="h-4 w-4" /> support@vereinbase.de
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
  const { istAngemeldet, accessToken, _hatHydriert } = useAuthStore();
  const [bereit, setBereit] = useState(false);
  const [gesperrt, setGesperrt] = useState<{ grund?: string } | null>(null);

  useEffect(() => {
    // Erst nach Hydration aus localStorage Auth pruefen
    if (!_hatHydriert) return;

    if (!accessToken) {
      router.replace('/anmelden');
      return;
    }

    // Theme anwenden
    const { themeAnwenden, profilLaden } = useAuthStore.getState();
    themeAnwenden();

    // Profil laden (EIN Call, kein Doppel-Request)
    profilLaden()
      .then(() => {
        // Sperr-Check: profilLaden hat den Tenant geladen
        const tenant = useAuthStore.getState().tenant;
        if (!tenant) {
          setGesperrt({ grund: 'Verein konnte nicht geladen werden.' });
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('gesperrt')) {
          setGesperrt({ grund: msg });
        }
      })
      .finally(() => setBereit(true));

    // Safety-Timeout: Falls profilLaden haengt, nach 8 Sekunden trotzdem bereit setzen
    const timeout = setTimeout(() => {
      setBereit((prev) => {
        if (!prev) {
          console.warn('Dashboard: Safety-Timeout - bereit erzwungen');
        }
        return true;
      });
    }, 8000);

    return () => clearTimeout(timeout);
  // Nur bei Hydration und Token-Aenderung ausfuehren
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hatHydriert, accessToken]);

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
        <ImpersonationBanner />
        <Header />
        <EmailVerifizierungBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
