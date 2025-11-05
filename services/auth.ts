import { USE_MOCKS } from '@/lib/config';

let memoryToken: string | null = null;
let memoryRole: 'supervisor' | 'worker' | null = null;
let memoryUser: { id: string; name: string; role: 'supervisor' | 'worker' } | null = null;

export async function login(username: string, password: string): Promise<{ token: string; role: 'supervisor' | 'worker'; user: { id: string; name: string } }>{
  if (USE_MOCKS) {
    // Mock rule: admin/123456 ok
    if (username === 'admin' && password === '123456') {
      memoryToken = 'mock-token';
      memoryRole = 'supervisor';
      memoryUser = { id: 'sup1', name: 'J. Salazar', role: 'supervisor' };
      return { token: memoryToken, role: memoryRole, user: { id: memoryUser.id, name: memoryUser.name } };
    }
    if ((username === 'obra' || username === 'worker') && password === '123456') {
      memoryToken = 'mock-token-worker';
      memoryRole = 'worker';
      memoryUser = { id: 'u1', name: 'Juan Pérez', role: 'worker' };
      return { token: memoryToken, role: memoryRole, user: { id: memoryUser.id, name: memoryUser.name } };
    }
    throw new Error('Credenciales inválidas');
  }
  // Replace with real HTTP call when connecting
  throw new Error('HTTP login no implementado');
}

export async function logout(): Promise<void> {
  memoryToken = null;
  memoryRole = null;
  memoryUser = null;
}

export function getToken(): string | null {
  return memoryToken;
}

export function getRole(): 'supervisor' | 'worker' | null {
  return memoryRole;
}

export function getUser(): { id: string; name: string; role: 'supervisor' | 'worker' } | null {
  return memoryUser;
}
