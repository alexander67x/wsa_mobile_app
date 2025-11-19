import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { Report, ReportDetail } from '@/types/domain';
import { mockReports, mockReportDetail } from '@/mocks/reports';
import { getUser, getRole } from '@/services/auth';
import { getMyProjects } from '@/services/projects';

interface ApiReport {
  id: string;
  projectId: string;
  taskId: string | null;
  taskTitle: string | null;
  title: string;
  project: string | null;
  date: string | null;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  progress: number | null;
  authorId: string | null;
  authorName: string | null;
}

interface ApiReportDetail {
  id: string;
  projectId: string;
  taskId: string | null;
  taskTitle: string | null;
  taskDescription: string | null;
  taskStatus: string | null;
  title: string;
  project: string | null;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  authorId: string | null;
  author: string | null;
  date: string | null;
  location: string | null;
  description: string;
  observations: string | null;
  images: string[];
  approvedBy: string | null;
  approvedDate: string | null;
  feedback: string | null;
  difficulties: string | null;
  materialsUsed: string | null;
}

export async function listReports(projectId?: string, taskId?: string): Promise<(Report & { taskId?: string; taskTitle?: string })[]> {
  if (USE_MOCKS) return Promise.resolve(mockReports);
  
  const user = getUser();
  const role = getRole();
  const ensuredEmployeeId = await (await import('@/services/auth')).ensureEmployeeId();
  
  const params = new URLSearchParams();
  if (projectId) params.append('projectId', projectId);
  if (taskId) params.append('taskId', taskId);
  
  const queryString = params.toString();
  const url = queryString ? `/reports?${queryString}` : '/reports';
  
  const apiReports = await fetchJson<ApiReport[]>(url);
  
  // Filtrar en el cliente según el rol
  let filteredReports = apiReports;
  const currentAuthorId = user ? (user.employeeId || ensuredEmployeeId || user.id) : ensuredEmployeeId || null;
  
  if (role === 'worker' && currentAuthorId) {
    // Worker (sin privilegios): solo sus propios reportes
    const authorKey = String(currentAuthorId);
    filteredReports = apiReports.filter(r => String(r.authorId ?? '') === authorKey);
  } else if (role === 'supervisor' && !projectId) {
    // Supervisor (con privilegios): solo reportes de sus proyectos
    try {
      const myProjects = await getMyProjects();
      const projectIds = myProjects.map(p => p.id);
      filteredReports = apiReports.filter(r => r.projectId && projectIds.includes(r.projectId));
    } catch (error) {
      console.error('Error filtering reports by projects:', error);
      filteredReports = apiReports;
    }
  }
  
  return filteredReports.map((r): Report & { taskId?: string; taskTitle?: string } => ({
    id: r.id,
    title: r.title,
    project: r.project || 'Sin proyecto',
    date: r.date || '',
    type: (r.type === 'progress' ? 'progress' : r.type === 'incident' ? 'incident' : 'quality') as 'progress' | 'incident' | 'quality',
    status: r.status,
    progress: r.progress || undefined,
    authorId: r.authorId || undefined,
    authorName: r.authorName || undefined,
    taskId: r.taskId || undefined,
    taskTitle: r.taskTitle || undefined,
  }));
}

export async function getReport(id: string): Promise<ReportDetail & { taskId?: string; taskTitle?: string; taskDescription?: string; taskStatus?: string }> {
  if (USE_MOCKS) return Promise.resolve(mockReportDetail);
  
  const apiReport = await fetchJson<ApiReportDetail>(`/reports/${id}`);
  
  return {
    id: apiReport.id,
    title: apiReport.title,
    project: apiReport.project || 'Sin proyecto',
    type: (apiReport.type === 'progress' ? 'progress' : apiReport.type === 'incident' ? 'incident' : 'quality') as 'progress' | 'incident' | 'quality',
    status: apiReport.status,
    progress: undefined,
    author: apiReport.author || 'Desconocido',
    date: apiReport.date || '',
    location: apiReport.location || '',
    description: apiReport.description,
    observations: apiReport.observations || undefined,
    images: apiReport.images || [],
    approvedBy: apiReport.approvedBy || undefined,
    approvedDate: apiReport.approvedDate || undefined,
    feedback: apiReport.feedback || undefined,
    taskId: apiReport.taskId || undefined,
    taskTitle: apiReport.taskTitle || undefined,
    taskDescription: apiReport.taskDescription || undefined,
    taskStatus: apiReport.taskStatus || undefined,
  };
}

export interface ReportImage {
  url: string;
  latitude: number;
  longitude: number;
  takenAt?: string;
}

export interface ReportMaterial {
  materialId: number | string;
  quantity: number;
  unit: string;
  observations?: string;
}

export async function createReport(payload: {
  projectId: string;
  taskId?: string | number;
  authorId: string | number;
  title: string;
  description: string;
  reportDate?: string;
  difficulties?: string;
  materialsUsed?: string;
  observations?: string;
  attachments?: number[];
  images?: ReportImage[];
  materials?: ReportMaterial[];
}): Promise<{ id: string }> {
  if (USE_MOCKS) return Promise.resolve({ id: 'mock' });
  
  const response = await fetchJson<{ id: string; report: ApiReport }, typeof payload>(
    '/reports',
    { method: 'POST', body: payload }
  );
  
  return { id: response.id };
}
