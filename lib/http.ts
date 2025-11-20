import { API_URL } from '@/lib/config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface FetchOptions<T> {
  method?: HttpMethod;
  body?: T;
  token?: string | null;
  headers?: Record<string, string>;
}

export async function fetchJson<R = unknown, B = unknown>(path: string, opts: FetchOptions<B> = {}): Promise<R> {
  const { method = 'GET', body, token, headers = {} } = opts;
  
  // Auto-inject token from auth service if not provided
  let authToken = token;
  if (!authToken && path !== '/auth/login') {
    try {
      const { getToken } = await import('@/services/auth');
      authToken = getToken();
    } catch {
      // Ignore if auth service not available
    }
  }
  
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const detail = json?.message || json?.error;
    const message = detail || res.statusText || 'Request failed';
    throw new Error(`${res.status} ${message}`);
  }

  return json as R;
}

