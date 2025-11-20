import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';

let lastRegisteredExpoToken: string | null = null;

function resolveProjectId(): string | undefined {
  const easProjectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  return easProjectId ?? undefined;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permiso de notificaciones denegado', 'Activa las notificaciones para recibir alertas.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }

  const projectId = resolveProjectId();
  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  return token;
}

export async function registerDevicePushToken(): Promise<void> {
  if (USE_MOCKS) return;

  try {
    const expoToken = await registerForPushNotificationsAsync();
    if (!expoToken || expoToken === lastRegisteredExpoToken) return;

    await fetchJson('/push/register', {
      method: 'POST',
      body: { token: expoToken },
    });
    lastRegisteredExpoToken = expoToken;
  } catch (error) {
    console.warn('[notifications] No se pudo registrar el token push', error);
  }
}

