import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('El usuario abrió la notificación:', response);
      const data = response.notification.request.content.data as { action?: string; id?: string } | undefined;

      if (data?.action === 'open_request' && data.id) {
        router.push({
          pathname: '/material-request-detail',
          params: { id: String(data.id) },
        });
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(worker)" />
        <Stack.Screen name="project-detail" />
        <Stack.Screen name="create-report" />
        <Stack.Screen name="attach-evidence" />
        <Stack.Screen name="report-detail" />
        <Stack.Screen name="kanban" />
        <Stack.Screen name="request-material" />
        <Stack.Screen name="material-request-detail" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
