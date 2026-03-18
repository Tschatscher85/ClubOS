'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, initApiClient } from '@/lib/api-client';
import { applyTenantTheme } from '@/lib/theme';

interface TenantState {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
}

interface BenutzerState {
  id: string;
  email: string;
  rolle: string;
  tenantId: string;
  emailVerifiziert?: boolean;
}

interface AnmeldeAntwort {
  benutzer: BenutzerState;
  tenant: TenantState;
  accessToken: string;
  refreshToken: string;
}

interface ProfilAntwort {
  id: string;
  email: string;
  rolle: string;
  tenantId: string;
  emailVerifiziert: boolean;
  tenant: TenantState;
  erstelltAm: string;
}

interface AuthState {
  benutzer: BenutzerState | null;
  tenant: TenantState | null;
  accessToken: string | null;
  refreshToken: string | null;
  istAngemeldet: boolean;
  istLadend: boolean;
  fehler: string | null;

  anmelden: (email: string, passwort: string) => Promise<void>;
  abmelden: () => void;
  profilLaden: () => Promise<void>;
  themeAnwenden: () => void;
  emailVerifizierungSenden: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // API-Client mit Store verbinden
      initApiClient(
        () => ({
          accessToken: get().accessToken,
          refreshToken: get().refreshToken,
        }),
        (accessToken, refreshToken) => set({ accessToken, refreshToken }),
        () => {
          set({
            benutzer: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            istAngemeldet: false,
          });
        },
      );

      return {
        benutzer: null,
        tenant: null,
        accessToken: null,
        refreshToken: null,
        istAngemeldet: false,
        istLadend: false,
        fehler: null,

        anmelden: async (email: string, passwort: string) => {
          set({ istLadend: true, fehler: null });
          try {
            const antwort = await apiClient.post<AnmeldeAntwort>(
              '/auth/anmelden',
              { email, passwort },
            );

            set({
              benutzer: antwort.benutzer,
              tenant: antwort.tenant,
              accessToken: antwort.accessToken,
              refreshToken: antwort.refreshToken,
              istAngemeldet: true,
              istLadend: false,
            });

            if (antwort.tenant.primaryColor) {
              applyTenantTheme(antwort.tenant.primaryColor);
            }
          } catch (error) {
            set({
              istLadend: false,
              fehler:
                error instanceof Error
                  ? error.message
                  : 'Anmeldung fehlgeschlagen.',
            });
            throw error;
          }
        },

        abmelden: () => {
          const { accessToken } = get();
          // Fire-and-forget Backend-Abmeldung
          if (accessToken) {
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/abmelden`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            ).catch(() => {});
          }

          set({
            benutzer: null,
            tenant: null,
            accessToken: null,
            refreshToken: null,
            istAngemeldet: false,
            fehler: null,
          });
        },

        profilLaden: async () => {
          try {
            const profil = await apiClient.get<ProfilAntwort>('/auth/profil');
            set({
              benutzer: {
                id: profil.id,
                email: profil.email,
                rolle: profil.rolle,
                tenantId: profil.tenantId,
                emailVerifiziert: profil.emailVerifiziert,
              },
              tenant: profil.tenant,
              istAngemeldet: true,
            });

            if (profil.tenant.primaryColor) {
              applyTenantTheme(profil.tenant.primaryColor);
            }
          } catch {
            // Token ungueltig -> abmelden
            get().abmelden();
          }
        },

        themeAnwenden: () => {
          const { tenant } = get();
          if (tenant?.primaryColor) {
            applyTenantTheme(tenant.primaryColor);
          }
        },

        emailVerifizierungSenden: async () => {
          await apiClient.post('/auth/email-verifizierung-erneut-senden', {});
        },
      };
    },
    {
      name: 'clubos-auth',
      partialize: (state) => ({
        benutzer: state.benutzer,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        istAngemeldet: state.istAngemeldet,
      }),
    },
  ),
);
