import 'dotenv/config';

export default {
  expo: {
    name: 'bolt-expo-nativewind',
    slug: 'bolt-expo-nativewind',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Esta app necesita acceso a tu ubicación para asociar los reportes con tu ubicación actual.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'd1395a71-0165-48de-969a-58bba9e95f1b',
      },
      resendKey: process.env.EXPO_PUBLIC_RESEND_API_KEY,
      resendFrom: process.env.EXPO_PUBLIC_RESEND_FROM,
      adminEmail: process.env.EXPO_PUBLIC_ADMIN_EMAIL,
    },
    owner: 'hon123',
    android: {
      permissions: ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION'],
      package: 'com.hon123.boltexponativewind',
    },
  },
};
