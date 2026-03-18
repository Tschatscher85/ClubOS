import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

interface Benutzer {
  id: string;
  email: string;
  rolle: string;
  tenantId: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  benutzer: Benutzer | null;
  tenant: Tenant | null;
  token: string | null;
  istLadend: boolean;

  tokenLaden: () => Promise<void>;
  anmelden: (email: string, passwort: string) => Promise<void>;
  abmelden: () => Promise<void>;
  profilLaden: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  benutzer: null,
  tenant: null,
  token: null,
  istLadend: true,

  tokenLaden: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        set({ token });
        // Profil laden
        const response = await api.get('/auth/profil');
        set({
          benutzer: {
            id: response.data.id,
            email: response.data.email,
            rolle: response.data.rolle,
            tenantId: response.data.tenantId,
          },
          tenant: response.data.tenant,
        });
      }
    } catch {
      // Token ungueltig
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ token: null, benutzer: null, tenant: null });
    } finally {
      set({ istLadend: false });
    }
  },

  anmelden: async (email: string, passwort: string) => {
    const response = await api.post('/auth/anmelden', { email, passwort });
    const { benutzer, tenant, accessToken, refreshToken } = response.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    set({ benutzer, tenant, token: accessToken });
  },

  abmelden: async () => {
    try {
      await api.post('/auth/abmelden');
    } catch {
      // Ignorieren
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ benutzer: null, tenant: null, token: null });
  },

  profilLaden: async () => {
    try {
      const response = await api.get('/auth/profil');
      set({
        benutzer: {
          id: response.data.id,
          email: response.data.email,
          rolle: response.data.rolle,
          tenantId: response.data.tenantId,
        },
        tenant: response.data.tenant,
      });
    } catch {
      // Ignorieren
    }
  },
}));
