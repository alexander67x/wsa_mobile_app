import { fetchJson } from '@/lib/http';
import { TeamMember } from '@/types/domain';

interface ApiTeamMember {
  id: string;
  name: string;
  role: string;
}

export async function listTeam(projectId: string): Promise<TeamMember[]> {
  const apiMembers = await fetchJson<ApiTeamMember[]>(`/projects/${projectId}/team`);
  
  return apiMembers.map((m): TeamMember => ({
    id: m.id,
    name: m.name,
    role: (m.role === 'supervisor' ? 'supervisor' : 'worker') as 'worker' | 'supervisor',
    email: undefined,
    phone: undefined,
  }));
}

