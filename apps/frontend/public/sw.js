/**
 * Vereinbase Service Worker fuer Web-Push-Benachrichtigungen
 */

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};

  const optionen = {
    body: data.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    tag: data.tag || 'vereinbase-benachrichtigung',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Vereinbase', optionen),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // Falls bereits ein Fenster offen ist, dorthin navigieren
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Ansonsten neues Fenster oeffnen
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
