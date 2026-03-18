import * as Notifications from 'expo-notifications';
import api from './api';

export async function registerForPushNotifications(): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Push-Benachrichtigungen nicht erlaubt');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  // Token an Backend senden
  try {
    await api.post('/push-tokens', { token: token.data });
  } catch {
    console.log('Push-Token konnte nicht registriert werden');
  }

  return token.data;
}

// Notification Handler konfigurieren
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
