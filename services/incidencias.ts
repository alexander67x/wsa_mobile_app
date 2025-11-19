import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { getUser, getRole } from '@/services/auth';
import { getMyProjects } from '@/services/projects';

export interface IncidentImage {
  url: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
  description?: string;
}

export interface CreateIncidentPayload {
  projectId: string;
  taskId?: string | number;
  authorId: string | number;
  assignedToId?: string | number;
  title: string;
  description: string;
  tipo: 'falla_equipos' | 'accidente' | 'retraso_material' | 'problema_calidad' | 'otro';
  severidad?: 'critica' | 'alta' | 'media' | 'baja';
  latitude?: number;
  longitude?: number;
  images?: IncidentImage[];
}

export interface Incident {
  id: string;
  projectId: string;
  taskId?: string | null;
  taskTitle?: string | null;
  title: string;
  project?: string | null;
  date?: string | null;
  type: 'incidence';
  status: 'abierta' | 'en_proceso' | 'resuelta' | 'verificacion' | 'cerrada' | 'reabierta';
  severity?: 'critica' | 'alta' | 'media' | 'baja';
  tipo?: string;
  authorId?: string | null;
  authorName?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
}

export interface IncidentDetail extends Incident {
  taskDescription?: string | null;
  taskStatus?: string | null;
  location?: string | null;
  description: string;
  images: Array<{ url: string; description?: string | null }>;
  latitude?: number | null;
  longitude?: number | null;
  solution?: string | null;
  resolvedAt?: string | null;
  assignedTo?: string | null;
  author?: string | null;
}

export async function createIncident(payload: CreateIncidentPayload): Promise<{ id: string; incidencia: Incident }> {
  if (USE_MOCKS) {
    return Promise.resolve({
      id: 'mock-incident',
      incidencia: {
        id: 'mock-incident',
        projectId: payload.projectId,
        title: payload.title,
        type: 'incidence',
        status: 'abierta',
        severity: payload.severidad || 'media',
        tipo: payload.tipo,
      },
    });
  }

  const response = await fetchJson<{ id: string; incidencia: Incident }, typeof payload>(
    '/incidencias',
    { method: 'POST', body: payload }
  );

  return response;
}

export async function listIncidencias(params?: {
  projectId?: string;
  taskId?: string | number;
  status?: string;
  limit?: number;
}): Promise<Incident[]> {
  if (USE_MOCKS) return Promise.resolve([]);

  const user = getUser();
  const role = getRole();
  const ensuredEmployeeId = await (await import('@/services/auth')).ensureEmployeeId();
  const currentAuthorId = user ? (user.employeeId || ensuredEmployeeId || user.id) : ensuredEmployeeId || null;

  const queryParams = new URLSearchParams();
  if (params?.projectId) queryParams.append('projectId', params.projectId);
  if (params?.taskId) queryParams.append('taskId', String(params.taskId));
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', String(params.limit));

  const queryString = queryParams.toString();
  const url = queryString ? `/incidencias?${queryString}` : '/incidencias';

  const apiIncidencias = await fetchJson<Incident[]>(url);
  
  // Filtrar en el cliente según el rol
  let filteredIncidencias = apiIncidencias;
  
  if (role === 'worker' && currentAuthorId) {
    // Worker: solo sus propias incidencias
    const authorKey = String(currentAuthorId);
    filteredIncidencias = apiIncidencias.filter(i => String(i.authorId ?? '') === authorKey);
  } else if (role === 'supervisor' && !params?.projectId) {
    // Supervisor: solo incidencias de sus proyectos
    try {
      const myProjects = await getMyProjects();
      const projectIds = myProjects.map(p => p.id);
      filteredIncidencias = apiIncidencias.filter(i => i.projectId && projectIds.includes(i.projectId));
    } catch (error) {
      console.error('Error filtering incidencias by projects:', error);
      filteredIncidencias = apiIncidencias;
    }
  }
  
  return filteredIncidencias;
}

export async function getIncidencia(id: string): Promise<IncidentDetail> {
  if (USE_MOCKS) {
    return Promise.resolve({
      id,
      projectId: 'mock',
      title: 'Mock Incident',
      type: 'incidence',
      status: 'abierta',
      description: 'Mock description',
      images: [],
    });
  }

  const apiIncidencia = await fetchJson<IncidentDetail>(`/incidencias/${id}`);
  return apiIncidencia;
}
