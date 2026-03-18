'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

type PushStatus = 'laden' | 'nicht-unterstuetzt' | 'abgelehnt' | 'aktiv' | 'inaktiv';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export function PushOptIn() {
  const [status, setStatus] = useState<PushStatus>('laden');
  const [ladend, setLadend] = useState(false);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

  const statusPruefen = useCallback(async () => {
    // Pruefen ob Push-API unterstuetzt wird
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('nicht-unterstuetzt');
      return;
    }

    // Pruefen ob VAPID-Key konfiguriert ist
    if (!vapidKey) {
      setStatus('nicht-unterstuetzt');
      return;
    }

    // Berechtigung pruefen
    const erlaubnis = Notification.permission;
    if (erlaubnis === 'denied') {
      setStatus('abgelehnt');
      return;
    }

    // Aktive Subscription pruefen
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setStatus(subscription ? 'aktiv' : 'inaktiv');
      } else {
        setStatus('inaktiv');
      }
    } catch {
      setStatus('inaktiv');
    }
  }, [vapidKey]);

  useEffect(() => {
    statusPruefen();
  }, [statusPruefen]);

  const aktivieren = async () => {
    if (!vapidKey) return;
    setLadend(true);

    try {
      // Service Worker registrieren
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Push-Subscription erstellen
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const subJson = subscription.toJSON();

      // An Backend senden
      await apiClient.post('/push/web/abonnieren', {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
      });

      setStatus('aktiv');
    } catch (fehler) {
      console.error('Push-Aktivierung fehlgeschlagen:', fehler);
      // Berechtigung ggf. abgelehnt
      if (Notification.permission === 'denied') {
        setStatus('abgelehnt');
      }
    } finally {
      setLadend(false);
    }
  };

  const deaktivieren = async () => {
    setLadend(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Am Backend abmelden
          await apiClient.delete('/push/web/abmelden');

          // Subscription im Browser aufheben
          await subscription.unsubscribe();
        }
      }

      setStatus('inaktiv');
    } catch (fehler) {
      console.error('Push-Deaktivierung fehlgeschlagen:', fehler);
    } finally {
      setLadend(false);
    }
  };

  // Nicht anzeigen wenn Push nicht unterstuetzt wird
  if (status === 'nicht-unterstuetzt' || status === 'laden') {
    return null;
  }

  if (status === 'aktiv') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={deaktivieren}
        disabled={ladend}
        className="relative"
        title="Push-Benachrichtigungen aktiv (klicken zum Deaktivieren)"
      >
        <BellRing className="h-5 w-5 text-primary" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500" />
      </Button>
    );
  }

  if (status === 'abgelehnt') {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        title="Push-Benachrichtigungen im Browser blockiert"
      >
        <BellOff className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={aktivieren}
      disabled={ladend}
      title="Push-Benachrichtigungen aktivieren"
    >
      <Bell className="h-5 w-5" />
    </Button>
  );
}
