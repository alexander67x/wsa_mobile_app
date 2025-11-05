import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { TeamMember } from '@/types/domain';
import { teamMembers } from '@/mocks/team';

export async function listTeam(_projectId: string): Promise<TeamMember[]> {
  if (USE_MOCKS) return Promise.resolve(teamMembers);
  return fetchJson<TeamMember[]>(`/projects/${_projectId}/team`);
}

