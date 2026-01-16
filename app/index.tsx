import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/theme';

export default function IndexScreen() {
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const Auth = await import('@/services/auth');
      const session = await Auth.restoreSession();
      if (!isMounted) return;
      if (session?.token) {
        router.replace(session.role === 'worker' ? '/(worker)' : '/(tabs)');
        return;
      }
      router.replace('/login');
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
