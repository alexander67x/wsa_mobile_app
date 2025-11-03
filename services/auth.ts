import { USE_MOCKS } from '@/lib/config';

let memoryToken: string | null = null;

export async function login(username: string, password: string): Promise<{ token: string }>{
  if (USE_MOCKS) {
    // Mock rule: admin/123456 ok
    if (username === 'admin' && password === '123456') {
      memoryToken = 'mock-token';
      return { token: memoryToken };
    }
    throw new Error('Credenciales inválidas');
  }
  // Replace with real HTTP call when connecting
  throw new Error('HTTP login no implementado');
}

export async function logout(): Promise<void> {
  memoryToken = null;
}

export function getToken(): string | null {
  return memoryToken;
}

