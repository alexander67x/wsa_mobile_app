// API URL - Update this to match your Laravel API URL
//export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
//export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.26.13.241:8000/api';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.26.5:8000/api';

// Default to mocks so the demo credentials (admin/123456) always work unless explicitly disabled
export const USE_MOCKS = (process.env.EXPO_PUBLIC_USE_MOCKS || '1') === '1';

