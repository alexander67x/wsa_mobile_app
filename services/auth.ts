import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';

type AuthUser = { id: string; name: string; role: 'supervisor' | 'worker'; employeeId?: string };
type ApiRolePayload = { id?: string | number; nombre?: string; descripcion?: string; slug?: string | null } | string | null;

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

export async function login(username: string, password: string): Promise<{ token: string; role: 'supervisor' | 'worker'; user: { id: string; name: string; employeeId?: string } }>{
  if (USE_MOCKS) {
    // Mock rule: admin/123456 ok
    if (username === 'admin' && password === '123456') {
      memoryToken = 'mock-token';
      memoryRole = 'supervisor';
      memoryUser = { id: 'sup1', name: 'J. Salazar', role: 'supervisor' };
      return { token: memoryToken, role: memoryRole, user: { id: memoryUser.id, name: memoryUser.name, employeeId: memoryUser.employeeId } };
    }
    if ((username === 'obra' || username === 'worker') && password === '123456') {
      memoryToken = 'mock-token-worker';
      memoryRole = 'worker';
      memoryUser = { id: 'u1', name: 'Juan Pérez', role: 'worker' };
      return { token: memoryToken, role: memoryRole, user: { id: memoryUser.id, name: memoryUser.name, employeeId: memoryUser.employeeId } };
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
    const response = await fetchJson<{ token: string; role: ApiRolePayload; permissions?: string[]; user: { id: string; name: string } }, { email: string; password: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: { email, password },
      }
    );

    // Save token first
    memoryToken = response.token;
    hydrateRoleState(response.role ?? null);
    hydratePermissions(response.permissions);
    // Try to fetch /auth/me to get the role object (new API behavior)
    try {
      const me = await fetchJson<{ id: string; name: string; role: ApiRolePayload; permissions?: string[] } & Record<string, any>>('/auth/me');
      hydrateRoleState(me.role ?? response.role ?? null);
      hydratePermissions(me.permissions ?? response.permissions ?? []);

      memoryUser = { id: me.id || response.user.id, name: me.name || response.user.name, role: memoryRole ?? 'worker', employeeId: extractEmployeeId(me) || extractEmployeeId(response.user) };

      return { token: response.token, role: memoryRole ?? 'worker', user: { id: memoryUser.id, name: memoryUser.name, employeeId: memoryUser.employeeId } };
    } catch (meErr) {
      const fallbackRole = memoryRole ?? 'worker';
      memoryUser = { id: response.user.id, name: response.user.name, role: fallbackRole, employeeId: extractEmployeeId(response.user) };
      return { token: response.token, role: fallbackRole, user: { id: response.user.id, name: response.user.name, employeeId: memoryUser.employeeId } };
    }
  } catch (error: any) {
    // If first attempt failed and we added @example.com, try with username as-is
    if (email !== username) {
      try {
        const response = await fetchJson<{ token: string; role: ApiRolePayload; permissions?: string[]; user: { id: string; name: string } }, { email: string; password: string }>(
          '/auth/login',
          {
            method: 'POST',
            body: { email: username, password },
          }
        );
        memoryToken = response.token;
        hydrateRoleState(response.role ?? null);
        hydratePermissions(response.permissions ?? []);
        try {
          const me = await fetchJson<{ id: string; name: string; role: ApiRolePayload; permissions?: string[] } & Record<string, any>>('/auth/me');
          hydrateRoleState(me.role ?? response.role ?? null);
          hydratePermissions(me.permissions ?? response.permissions ?? []);

          memoryUser = { id: me.id || response.user.id, name: me.name || response.user.name, role: memoryRole ?? 'worker', employeeId: extractEmployeeId(me) || extractEmployeeId(response.user) };

          return { token: response.token, role: memoryRole ?? 'worker', user: { id: memoryUser.id, name: memoryUser.name, employeeId: memoryUser.employeeId } };
        } catch (meErr) {
          const fallbackRole = memoryRole ?? 'worker';
          memoryUser = { id: response.user.id, name: response.user.name, role: fallbackRole, employeeId: extractEmployeeId(response.user) };
          return { token: response.token, role: fallbackRole, user: { id: response.user.id, name: response.user.name, employeeId: memoryUser.employeeId } };
        }
      } catch (e) {
        // Fall through to throw original error
      }
    }
    throw new Error(error?.message || 'Credenciales inválidas');
  }
}

export async function fetchMe(): Promise<({ id: string; name: string; role: ApiRolePayload; permissions?: string[] } & Record<string, any>) | null> {
  if (USE_MOCKS || !memoryToken) return null;
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
