import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from './api';
import { navigate } from './navigation';

// Show order updates and announcements even while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * Ask permission and send this phone's push token to the server. Messages are delivered through
 * Firebase Cloud Messaging (Android) and Apple Push Notifications (iPhone) via Expo's push service.
 */
export async function registerForPushNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Order updates & offers',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFC529',
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('Push notifications: no EAS projectId. Run `npx eas init`.');
      return null;
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post('/me/push-token', { token });
    return token;
  } catch (e) {
    console.warn('Push notifications unavailable:', e?.message);
    return null;
  }
}

/** Tapping an order notification opens that order's tracking screen. */
export function listenForNotificationTaps() {
  const open = (response) => {
    const data = response?.notification?.request?.content?.data || {};
    if (data.order_id) navigate('OrderTracking', { id: data.order_id });
  };
  Notifications.getLastNotificationResponseAsync().then((r) => r && open(r)).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(open);
  return () => sub.remove();
}
