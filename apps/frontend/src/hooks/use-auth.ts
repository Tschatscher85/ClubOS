'use client';

import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  return useAuthStore();
}

export function useBenutzer() {
  return useAuthStore((s) => s.benutzer);
}

export function useTenant() {
  return useAuthStore((s) => s.tenant);
}

export function useIstAngemeldet() {
  return useAuthStore((s) => s.istAngemeldet);
}

export function useBerechtigungen() {
  return useAuthStore((s) => s.benutzer?.berechtigungen ?? []);
}

export function useHatBerechtigung(berechtigung: string) {
  const benutzer = useAuthStore((s) => s.benutzer);
  if (!benutzer) return false;
  if (['SUPERADMIN', 'ADMIN'].includes(benutzer.rolle)) return true;
  return (benutzer.berechtigungen ?? []).includes(berechtigung);
}

export function useHatHydriert() {
  return useAuthStore((s) => s._hatHydriert);
}
