'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

interface GoogleAuthAntwort {
  benutzer: {
    id: string;
    email: string;
    rolle: string;
    tenantId: string;
    emailVerifiziert: boolean;
    berechtigungen: string[];
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string;
  };
  accessToken: string;
  refreshToken: string;
  istNeu: boolean;
}

export function GoogleButton() {
  const router = useRouter();
  const [fehler, setFehler] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        setFehler(null);
        const antwort = await apiClient.post<GoogleAuthAntwort>(
          '/auth/google',
          { idToken: response.credential },
        );

        useAuthStore.setState({
          benutzer: antwort.benutzer,
          tenant: antwort.tenant,
          accessToken: antwort.accessToken,
          refreshToken: antwort.refreshToken,
          istAngemeldet: true,
        });

        router.push('/dashboard');
      } catch (error) {
        setFehler(
          error instanceof Error
            ? error.message
            : 'Google-Anmeldung fehlgeschlagen.',
        );
      }
    },
    [router],
  );

  useEffect(() => {
    if (!clientId) return;

    // Google Script laden
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        window.google?.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          width: 400,
          text: 'signin_with',
          locale: 'de',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [clientId, handleGoogleResponse]);

  // Kein Google Client ID konfiguriert -> Button nicht anzeigen
  if (!clientId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            oder
          </span>
        </div>
      </div>

      <div id="google-signin-button" className="flex justify-center" />

      {fehler && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {fehler}
        </div>
      )}
    </div>
  );
}
