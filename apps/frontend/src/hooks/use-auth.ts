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
