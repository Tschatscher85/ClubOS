'use client';

import { useState, useEffect } from 'react';

/**
 * Hook: Erkennt ob der Browser online/offline ist
 * Prueft zusaetzlich per Heartbeat ob das Backend erreichbar ist
 */
export function useOnlineStatus() {
  const [istOnline, setIstOnline] = useState(true);
  const [backendErreichbar, setBackendErreichbar] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIstOnline(true);
    const handleOffline = () => setIstOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIstOnline(navigator.onLine);

    // Backend-Heartbeat alle 30 Sekunden
    const pruefenBackend = async () => {
      try {
        const res = await fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        setBackendErreichbar(res.ok);
      } catch {
        setBackendErreichbar(false);
      }
    };

    pruefenBackend();
    const intervall = setInterval(pruefenBackend, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervall);
    };
  }, []);

  return { istOnline, backendErreichbar };
}
