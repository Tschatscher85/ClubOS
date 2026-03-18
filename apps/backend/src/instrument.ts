// Sentry muss VOR allen anderen Imports initialisiert werden
import * as Sentry from '@sentry/nestjs';

if (process.env.SENTRY_DSN_BACKEND) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    beforeSend(event) {
      // Keine personenbezogenen Daten an Sentry senden (DSGVO)
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }
      return event;
    },
  });
  console.log('[Sentry] Error-Monitoring aktiviert');
} else {
  console.log('[Sentry] Nicht konfiguriert (SENTRY_DSN_BACKEND fehlt)');
}
