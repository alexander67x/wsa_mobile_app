import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { Project, ProjectDetail } from '@/types/domain';
import { mockProjects, mockProjectDetail } from '@/mocks/projects';

interface ApiProject {
  id: string;
  name: string;
  client: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface ApiProjectDetail {
  id: string;
  name: string;
  client: string | null;
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
    dueDate: p.endDate || '',
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
    startDate: '',
    endDate: '',
    budget: '',
    manager: '',
    team: 0,
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

