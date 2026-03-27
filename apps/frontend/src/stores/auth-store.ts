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
  berechtigungen: string[];
}

interface AnmeldeAntwort {
  benutzer: BenutzerState & { vereinsRollen?: string[] };
  tenant: TenantState;
  accessToken: string;
  refreshToken: string;
}

interface ZweiFaktorAntwort {
  requires2FA: true;
  tempToken: string;
}

interface ProfilAntwort {
  id: string;
  email: string;
  rolle: string;
  tenantId: string;
  emailVerifiziert: boolean;
  berechtigungen: string[];
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
  // 2FA-Zustand
  benoetigtZweiFaktor: boolean;
  tempToken: string | null;
  // Hydration-Status (wird true nachdem Zustand aus localStorage geladen wurde)
  _hatHydriert: boolean;

  anmelden: (email: string, passwort: string) => Promise<void>;
  zweiFaktorVerifizieren: (code: string) => Promise<void>;
  zweiFaktorAbbrechen: () => void;
  abmelden: () => void;
  profilLaden: () => Promise<void>;
  themeAnwenden: () => void;
  emailVerifizierungSenden: () => Promise<void>;
}

function istZweiFaktorAntwort(
  antwort: AnmeldeAntwort | ZweiFaktorAntwort,
): antwort is ZweiFaktorAntwort {
  return 'requires2FA' in antwort && antwort.requires2FA === true;
}

// Wird in der Factory gesetzt und von onRehydrateStorage genutzt.
// Noetig weil useAuthStore beim synchronen localStorage-Rehydrate noch nicht existiert.
let _setHydriert: (() => void) | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // set() fuer onRehydrateStorage merken (sicher, weil set() sofort verfuegbar ist)
      _setHydriert = () => set({ _hatHydriert: true });

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
            benoetigtZweiFaktor: false,
            tempToken: null,
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
        benoetigtZweiFaktor: false,
        tempToken: null,
        _hatHydriert: false,

        anmelden: async (email: string, passwort: string) => {
          set({ istLadend: true, fehler: null, benoetigtZweiFaktor: false, tempToken: null });
          try {
            const antwort = await apiClient.post<AnmeldeAntwort | ZweiFaktorAntwort>(
              '/auth/anmelden',
              { email, passwort },
            );

            if (istZweiFaktorAntwort(antwort)) {
              // 2FA erforderlich - noch nicht angemeldet
              set({
                istLadend: false,
                benoetigtZweiFaktor: true,
                tempToken: antwort.tempToken,
              });
              return;
            }

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

        zweiFaktorVerifizieren: async (code: string) => {
          const { tempToken } = get();
          if (!tempToken) {
            set({ fehler: 'Kein temporaeres Token vorhanden. Bitte erneut anmelden.' });
            return;
          }

          set({ istLadend: true, fehler: null });
          try {
            const antwort = await apiClient.post<AnmeldeAntwort>(
              '/auth/2fa/verifizieren',
              { tempToken, code },
            );

            set({
              benutzer: antwort.benutzer,
              tenant: antwort.tenant,
              accessToken: antwort.accessToken,
              refreshToken: antwort.refreshToken,
              istAngemeldet: true,
              istLadend: false,
              benoetigtZweiFaktor: false,
              tempToken: null,
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
                  : '2FA-Verifizierung fehlgeschlagen.',
            });
            throw error;
          }
        },

        zweiFaktorAbbrechen: () => {
          set({
            benoetigtZweiFaktor: false,
            tempToken: null,
            fehler: null,
            istLadend: false,
          });
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
            benoetigtZweiFaktor: false,
            tempToken: null,
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
                berechtigungen: profil.berechtigungen ?? [],
              },
              tenant: profil.tenant,
              istAngemeldet: true,
            });

            if (profil.tenant.primaryColor) {
              applyTenantTheme(profil.tenant.primaryColor);
            }
          } catch (err) {
            // Nur bei 401 (Sitzung abgelaufen) abmelden, NICHT bei Netzwerk/Timeout-Fehlern
            const msg = err instanceof Error ? err.message : '';
            if (msg.includes('Sitzung abgelaufen') || msg.includes('401')) {
              get().abmelden();
            }
            // Bei anderen Fehlern (Timeout, Netzwerk) Auth-State beibehalten
            throw err;
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
      name: 'vereinbase-auth',
      partialize: (state) => ({
        benutzer: state.benutzer,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        istAngemeldet: state.istAngemeldet,
      }),
      onRehydrateStorage: () => () => {
        // WICHTIG: useAuthStore.setState() geht hier NICHT weil useAuthStore
        // bei synchronem localStorage-Rehydrate noch nicht zugewiesen ist.
        // Deshalb nutzen wir die in der Factory gespeicherte set()-Referenz.
        _setHydriert?.();
      },
    },
  ),
);
