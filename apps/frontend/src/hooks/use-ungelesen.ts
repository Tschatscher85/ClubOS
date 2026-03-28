'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook: Pollt alle 30 Sekunden die Anzahl ungelesener Nachrichten.
 */
export function useUngeleseneNachrichten(): number {
  const [anzahl, setAnzahl] = useState(0);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const laden = () => {
      apiClient
        .get<{ ungelesen: number }>('/nachrichten/ungelesen')
        .then((d) => setAnzahl(d.ungelesen))
        .catch(() => {});
    };

    laden();
    const interval = setInterval(laden, 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  return anzahl;
}
