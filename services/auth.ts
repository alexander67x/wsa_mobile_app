import { fetchJson } from '@/lib/http';

type AuthUser = { id: string; name: string; role: 'supervisor' | 'worker'; employeeId?: string };
type ApiRolePayload = { id?: string | number; nombre?: string; descripcion?: string; slug?: string | null } | string | null;
type ApiAuthUserPayload = {
  id?: string | number;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  uuid?: string | number;
  uid?: string | number;
  employeeId?: string | number;
  employee_id?: string | number;
} & Record<string, any>;
type ApiAuthTokenPayload = {
  token?: string | null;
  plainTextToken?: string | null;
  access_token?: string | null;
} & Record<string, any>;
type ApiAuthResponse = {
  data?: ApiAuthResponse | null;
  token?: string | ApiAuthTokenPayload | null;
  access_token?: string | null;
  role?: ApiRolePayload;
  permissions?: string[] | null;
  user?: ApiAuthUserPayload | null;
} & Record<string, any>;
type NormalizedAuthResponse = {
  token: string;
  role: ApiRolePayload | null;
  permissions: string[];
  user: ApiAuthUserPayload & { id: string; name: string };
};

let memoryToken: string | null = null;
let memoryRole: 'supervisor' | 'worker' | null = null;
let memoryRoleSlug: string | null = null;
let memoryPermissions: string[] = [];
let memoryUser: AuthUser | null = null;

function extractEmployeeId(source: any): string | undefined {
  if (!source) return undefined;
  const raw =
    source.cod_empleado ||
    source.codEmpleado ||
    source.employeeId ||
    source.employee_id ||
    source.empleadoId ||
    source.empleado_id ||
    source.id_empleado ||
    source?.empleado?.cod_empleado ||
    source?.empleado?.id ||
    source?.empleado?.id_empleado ||
    source?.employee?.cod_empleado ||
    source?.employee?.id;
  if (raw === undefined || raw === null) return undefined;
  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? String(asNumber) : String(raw);
}

function mapRoleSlugToLegacy(slug: string | null): 'supervisor' | 'worker' {
  if (!slug) return 'worker';
  const supervisorSlugs = ['adquisiciones', 'gerencia', 'responsable_proyecto', 'supervisor'];
  return supervisorSlugs.includes(slug) ? 'supervisor' : 'worker';
}

function normalizeRoleSlug(role: ApiRolePayload): string | null {
  if (!role) return null;
  if (typeof role === 'string') {
    return role.trim().toLowerCase().replace(/\s+/g, '_');
  }
  if (role.slug) {
    return String(role.slug).trim().toLowerCase();
  }
  if (role.nombre) {
    return role.nombre.trim().toLowerCase().replace(/\s+/g, '_');
  }
  return null;
}

function hydratePermissions(list?: string[] | null) {
  memoryPermissions = Array.from(new Set(list ?? [])).filter((item): item is string => typeof item === 'string');
}

function hydrateRoleState(rolePayload: ApiRolePayload) {
  memoryRoleSlug = normalizeRoleSlug(rolePayload);
  memoryRole = mapRoleSlugToLegacy(memoryRoleSlug);
}

function unwrapAuthResponse(payload: ApiAuthResponse | null | undefined): ApiAuthResponse | null {
  let current = payload ?? null;
  while (current && typeof current === 'object' && current.data && typeof current.data === 'object') {
    current = current.data as ApiAuthResponse;
  }
  return current;
}

function resolveAuthToken(payload: ApiAuthResponse | null): string | null {
  if (!payload) return null;
  if (typeof payload.token === 'string' && payload.token) return payload.token;
  if (typeof payload.access_token === 'string' && payload.access_token) return payload.access_token;
  if (payload.token && typeof payload.token === 'object') {
    const tokenBag = payload.token as ApiAuthTokenPayload;
    if (tokenBag.token) return tokenBag.token;
    if (tokenBag.plainTextToken) return tokenBag.plainTextToken;
    if (tokenBag.access_token) return tokenBag.access_token;
  }
  return null;
}

function normalizeAuthUser(raw: ApiAuthUserPayload | null | undefined): ApiAuthUserPayload & { id: string; name: string } {
  if (!raw || typeof raw !== 'object') {
    throw new Error('La API no devolvió información del usuario.');
  }
  const idSource =
    raw.id ??
    raw.uuid ??
    raw.uid ??
    raw.employeeId ??
    raw.employee_id ??
    raw.email ??
    raw.username;
  const id = idSource !== undefined && idSource !== null ? String(idSource) : '';
  if (!id) {
    throw new Error('El usuario devuelto por la API no contiene un identificador.');
  }
  const nameSource = raw.name ?? raw.fullName ?? raw.username ?? raw.email ?? `Usuario ${id}`;
  return {
    ...raw,
    id,
    name: String(nameSource),
  };
}

function normalizeAuthResponse(raw: ApiAuthResponse | null | undefined): NormalizedAuthResponse {
  const payload = unwrapAuthResponse(raw);
  if (!payload) {
    throw new Error('Respuesta de autenticación inválida del servidor.');
  }
  const token = resolveAuthToken(payload);
  if (!token) {
    throw new Error('La API no devolvió el token de acceso.');
  }
  const permissions = Array.isArray(payload.permissions)
    ? payload.permissions.filter((item): item is string => typeof item === 'string')
    : [];
  const user = normalizeAuthUser(payload.user);
  return {
    token,
    role: payload.role ?? null,
    permissions,
    user,
  };
}

async function performLoginRequest(email: string, password: string): Promise<NormalizedAuthResponse> {
  const rawResponse = await fetchJson<ApiAuthResponse, { email: string; password: string }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return normalizeAuthResponse(rawResponse);
}

async function completeLoginFlow(baseResponse: NormalizedAuthResponse): Promise<{ token: string; role: 'supervisor' | 'worker'; user: { id: string; name: string; employeeId?: string } }> {
  memoryToken = baseResponse.token;
  hydrateRoleState(baseResponse.role ?? null);
  hydratePermissions(baseResponse.permissions);
  try {
    const me = await fetchJson<{ id: string; name: string; role: ApiRolePayload; permissions?: string[] } & Record<string, any>>('/auth/me');
    hydrateRoleState(me.role ?? baseResponse.role ?? null);
    hydratePermissions(me.permissions ?? baseResponse.permissions ?? []);

    memoryUser = {
      id: me.id || baseResponse.user.id,
      name: me.name || baseResponse.user.name,
      role: memoryRole ?? 'worker',
      employeeId: extractEmployeeId(me) || extractEmployeeId(baseResponse.user),
    };

    return {
      token: baseResponse.token,
      role: memoryRole ?? 'worker',
      user: {
        id: memoryUser.id,
        name: memoryUser.name,
        employeeId: memoryUser.employeeId,
      },
    };
  } catch {
    const fallbackRole = memoryRole ?? 'worker';
    memoryUser = {
      id: baseResponse.user.id,
      name: baseResponse.user.name,
      role: fallbackRole,
      employeeId: extractEmployeeId(baseResponse.user),
    };
    return {
      token: baseResponse.token,
      role: fallbackRole,
      user: {
        id: memoryUser.id,
        name: memoryUser.name,
        employeeId: memoryUser.employeeId,
      },
    };
  }
}

export async function login(username: string, password: string): Promise<{ token: string; role: 'supervisor' | 'worker'; user: { id: string; name: string; employeeId?: string } }>{
  // Real API call - API expects 'email' but we accept username/email
  // Try username as email directly first, then try with @example.com if it doesn't contain @
  let email = username;
  if (!username.includes('@')) {
    email = `${username}@example.com`;
  }
  
  try {
    const response = await performLoginRequest(email, password);
    return await completeLoginFlow(response);
  } catch (error: any) {
    // If first attempt failed and we added @example.com, try with username as-is
    if (email !== username) {
      try {
        const response = await performLoginRequest(username, password);
        return await completeLoginFlow(response);
      } catch (e) {
        // Fall through to throw original error
      }
    }
    throw new Error(error?.message || 'Credenciales inválidas');
  }
}

export async function fetchMe(): Promise<({ id: string; name: string; role: ApiRolePayload; permissions?: string[] } & Record<string, any>) | null> {
  if (!memoryToken) return null;
  try {
    const me = await fetchJson<{ id: string; name: string; role: ApiRolePayload; permissions?: string[] } & Record<string, any>>('/auth/me', { token: memoryToken });
    hydrateRoleState(me.role ?? null);
    hydratePermissions(me.permissions ?? []);
    return me;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  if (memoryToken) {
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
  memoryRoleSlug = null;
  memoryPermissions = [];
  memoryUser = null;
}

export function getToken(): string | null {
  return memoryToken;
}

export function getRole(): 'supervisor' | 'worker' | null {
  return memoryRole;
}

export function getRoleSlug(): string | null {
  return memoryRoleSlug;
}

export function getPermissions(): string[] {
  return memoryPermissions;
}

export function hasPermission(permission: string): boolean {
  return memoryPermissions.includes(permission);
}

export function getUser(): AuthUser | null {
  return memoryUser;
}

export async function ensureEmployeeId(): Promise<string | undefined> {
  if (!memoryToken) return undefined;
  if (memoryUser?.employeeId) return memoryUser.employeeId;

  try {
    const me = await fetchMe();
    const employeeId = extractEmployeeId(me);
    if (me && memoryUser) {
      memoryUser = { ...memoryUser, employeeId };
    } else if (me) {
      hydrateRoleState(me.role ?? null);
      hydratePermissions(me.permissions ?? []);
      const mappedRole = memoryRole ?? 'worker';
      memoryUser = {
        id: me.id,
        name: me.name,
        role: mappedRole as 'supervisor' | 'worker',
        employeeId,
      };
      memoryRole = memoryUser.role;
    }
    return employeeId;
  } catch {
    return undefined;
  }
}
