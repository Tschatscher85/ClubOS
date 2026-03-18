'use client';

import { API_BASE_URL } from './constants';

type TokenGetter = () => { accessToken: string | null; refreshToken: string | null };
type TokenSetter = (access: string, refresh: string) => void;
type AbmeldenFn = () => void;

let getTokens: TokenGetter = () => ({ accessToken: null, refreshToken: null });
let setTokens: TokenSetter = () => {};
let abmeldenFn: AbmeldenFn = () => {};

/**
 * Wird vom Auth-Store aufgerufen, um den API-Client mit Token-Zugriff zu verbinden
 */
export function initApiClient(
  getter: TokenGetter,
  setter: TokenSetter,
  abmelden: AbmeldenFn,
) {
  getTokens = getter;
  setTokens = setter;
  abmeldenFn = abmelden;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { refreshToken } = getTokens();
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/token-aktualisieren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
  retry = true,
): Promise<T> {
  const { accessToken } = getTokens();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(endpoint, options, false);
    }
    abmeldenFn();
    throw new Error('Sitzung abgelaufen. Bitte erneut anmelden.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.nachricht || error.message || 'Ein Fehler ist aufgetreten.',
    );
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};
