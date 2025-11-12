import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';

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

  // Real API call - API expects 'email' but we accept username/email
  // Try username as email directly first, then try with @example.com if it doesn't contain @
  let email = username;
  if (!username.includes('@')) {
    email = `${username}@example.com`;
  }
  
  try {
    const response = await fetchJson<{ token: string; role: string; user: { id: string; name: string } }, { email: string; password: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: { email, password },
      }
    );

    // API returns role as string, we need to map it to our types
    const role = (response.role === 'supervisor' ? 'supervisor' : 'worker') as 'supervisor' | 'worker';
    
    memoryToken = response.token;
    memoryRole = role;
    memoryUser = { id: response.user.id, name: response.user.name, role };
    
    return { token: response.token, role, user: { id: response.user.id, name: response.user.name } };
  } catch (error: any) {
    // If first attempt failed and we added @example.com, try with username as-is
    if (email !== username) {
      try {
        const response = await fetchJson<{ token: string; role: string; user: { id: string; name: string } }, { email: string; password: string }>(
          '/auth/login',
          {
            method: 'POST',
            body: { email: username, password },
          }
        );

        const role = (response.role === 'supervisor' ? 'supervisor' : 'worker') as 'supervisor' | 'worker';
        
        memoryToken = response.token;
        memoryRole = role;
        memoryUser = { id: response.user.id, name: response.user.name, role };
        
        return { token: response.token, role, user: { id: response.user.id, name: response.user.name } };
      } catch (e) {
        // Fall through to throw original error
      }
    }
    throw new Error(error?.message || 'Credenciales inválidas');
  }
}

export async function logout(): Promise<void> {
  if (!USE_MOCKS && memoryToken) {
    try {
      await fetchJson('/auth/logout', {
        method: 'POST',
        token: memoryToken,
      });
    } catch (error) {
      // Ignore logout errors, clear local state anyway
    }
  }
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
