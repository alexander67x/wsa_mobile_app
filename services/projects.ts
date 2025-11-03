import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { Project, ProjectDetail } from '@/types/domain';
import { mockProjects, mockProjectDetail } from '@/mocks/projects';

export async function listProjects(): Promise<Project[]> {
  if (USE_MOCKS) return Promise.resolve(mockProjects);
  return fetchJson<Project[]>('/projects');
}

export async function getProject(id: string): Promise<ProjectDetail> {
  if (USE_MOCKS) return Promise.resolve(mockProjectDetail);
  return fetchJson<ProjectDetail>(`/projects/${id}`);
}

