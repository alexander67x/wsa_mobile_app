import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { Project, ProjectDetail } from '@/types/domain';
import { mockProjects, mockProjectDetail } from '@/mocks/projects';

interface ApiProjectMember {
  id: string;
  name: string;
  role?: string | null;
}

interface ApiProject {
  id: string;
  name: string;
  client: string | null;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  budget: number | null;
  members?: ApiProjectMember[];
}

interface ApiProjectDetail {
  id: string;
  name: string;
  client: string | null;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  budget: number | null;
  members?: ApiProjectMember[];
  tasks: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

export async function listProjects(): Promise<Project[]> {
  if (USE_MOCKS) return Promise.resolve(mockProjects);
  
  const apiProjects = await fetchJson<ApiProject[]>('/projects');
  
  // Transform API data to app format
  return apiProjects.map((p): Project => ({
    id: p.id,
    name: p.name,
    location: p.client || 'Sin ubicación',
    progress: 0, // API doesn't provide progress, default to 0
    status: p.endDate && new Date(p.endDate) < new Date() ? 'completed' : 
           p.startDate && new Date(p.startDate) > new Date() ? 'pending' : 'active',
    dueDate: p.deadline || p.endDate,
    deadline: p.deadline || p.endDate,
    budget: p.budget,
    members: p.members?.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role ?? null,
    })) ?? [],
    tasksCount: 0,
    reportsCount: 0,
  }));
}

export async function getProject(id: string): Promise<ProjectDetail> {
  if (USE_MOCKS) return Promise.resolve(mockProjectDetail);
  
  const apiProject = await fetchJson<ApiProjectDetail>(`/projects/${id}`);
  
  // Transform API data to app format
  return {
    id: apiProject.id,
    name: apiProject.name,
    location: apiProject.client || 'Sin ubicación',
    progress: 0, // API doesn't provide progress
    status: 'active',
    startDate: apiProject.startDate,
    endDate: apiProject.endDate,
    deadline: apiProject.deadline || apiProject.endDate,
    budget: apiProject.budget,
    manager: '',
    team: apiProject.members?.length ?? 0,
    members: apiProject.members?.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role ?? null,
    })) ?? [],
    tasks: apiProject.tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: (t.status === 'completado' || t.status === 'completed' ? 'completed' :
               t.status === 'en_proceso' || t.status === 'in_progress' ? 'in_progress' : 'pending') as 'pending' | 'in_progress' | 'completed',
      assignee: '',
      dueDate: '',
    })),
    reports: [],
    materials: [],
  };
}

export interface ProjectStockMaterial {
  id: string;
  materialId: string;
  code: string;
  name: string;
  unit: string;
  available: number;
  reserved: number;
  availableReal: number;
  minAlert: number;
  location?: string;
  unitPrice: number;
  needsRestock: boolean;
}

export interface ProjectStock {
  warehouse: {
    id: string;
    code: string;
    name: string;
    address?: string;
    city?: string;
  } | null;
  materials: ProjectStockMaterial[];
  totalMaterials: number;
  message?: string;
}

export async function getProjectStock(projectId: string): Promise<ProjectStock> {
  if (USE_MOCKS) {
    return {
      warehouse: null,
      materials: [],
      totalMaterials: 0,
      message: 'Mock mode - no stock data',
    };
  }
  
  const apiStock = await fetchJson<ProjectStock>(`/projects/${projectId}/stock`);
  return apiStock;
}

export async function getMyProjects(): Promise<Project[]> {
  if (USE_MOCKS) return Promise.resolve(mockProjects);
  
  const apiProjects = await fetchJson<ApiProject[]>('/projects/my-projects');
  
  // Transform API data to app format
  return apiProjects.map((p): Project => ({
    id: p.id,
    name: p.name,
    location: p.client || 'Sin ubicación',
    progress: 0, // API doesn't provide progress, default to 0
    status: p.endDate && new Date(p.endDate) < new Date() ? 'completed' : 
           p.startDate && new Date(p.startDate) > new Date() ? 'pending' : 'active',
    dueDate: p.deadline || p.endDate,
    deadline: p.deadline || p.endDate,
    budget: p.budget,
    members: p.members?.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role ?? null,
    })) ?? [],
    tasksCount: 0,
    reportsCount: 0,
  }));
}
