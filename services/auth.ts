import { USE_MOCKS } from '@/lib/config';

let memoryToken: string | null = null;
let memoryRole: 'supervisor' | 'worker' | null = null;

export async function login(username: string, password: string): Promise<{ token: string; role: 'supervisor' | 'worker' }>{
  if (USE_MOCKS) {
    // Mock rule: admin/123456 ok
    if (username === 'admin' && password === '123456') {
      memoryToken = 'mock-token';
      memoryRole = 'supervisor';
      return { token: memoryToken, role: memoryRole };
    }
    if ((username === 'obra' || username === 'worker') && password === '123456') {
      memoryToken = 'mock-token-worker';
      memoryRole = 'worker';
      return { token: memoryToken, role: memoryRole };
    }
    throw new Error('Credenciales inválidas');
  }
  // Replace with real HTTP call when connecting
  throw new Error('HTTP login no implementado');
}

export async function logout(): Promise<void> {
  memoryToken = null;
  memoryRole = null;
}

export function getToken(): string | null {
  return memoryToken;
}

export function getRole(): 'supervisor' | 'worker' | null {
  return memoryRole;
}
