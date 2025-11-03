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
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const message = json?.message || res.statusText || 'Request failed';
    throw new Error(`${res.status} ${message}`);
  }

  return json as R;
}

