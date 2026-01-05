import { fetchJson } from '@/lib/http';
import type { KanbanBoard, KanbanCard } from '@/types/domain';
import type { Id } from '@/types/domain';

interface ApiKanbanCard {
  id: string;
  title: string;
  authorId?: string | null;
  authorName?: string | null;
  description?: string;
  photos?: string[];
  createdAt?: string;
  column?: string;
}

export async function getBoard(projectId?: string): Promise<KanbanBoard> {
  const params = projectId ? `?projectId=${projectId}` : '';
  const apiBoard = await fetchJson<Record<string, ApiKanbanCard[]>>(`/kanban${params}`);
  
  // API returns board with column names as keys
  return apiBoard as KanbanBoard;
}

export async function addColumn(name: string): Promise<void> {
  await fetchJson<void, { name: string }>('/kanban/columns', { method: 'POST', body: { name } });
}

export async function addCard(
  column: string, 
  card: KanbanCard, 
  projectId?: string, 
  taskId?: string
): Promise<KanbanCard> {
  // API requires projectId and taskId
  if (!projectId || !taskId) {
    throw new Error('projectId y taskId son requeridos para crear una tarjeta');
  }
  
  const response = await fetchJson<ApiKanbanCard, {
    projectId: string;
    taskId: string;
    column: string;
    card: {
      title: string;
      description: string;
      authorId: string;
      photos?: string[];
    };
  }>('/kanban/cards', {
    method: 'POST',
    body: {
      projectId,
      taskId,
      column,
      card: {
        title: card.title,
        description: card.description || '',
        authorId: card.authorId || '',
        photos: card.photos || [],
      },
    },
  });
  
  return {
    id: response.id,
    title: response.title,
    authorId: response.authorId || undefined,
    authorName: response.authorName || undefined,
    description: response.description,
    photos: response.photos,
    createdAt: response.createdAt,
  };
}

export async function getCard(cardId: Id): Promise<KanbanCard | null> {
  const apiCard = await fetchJson<ApiKanbanCard>(`/kanban/cards/${cardId}`);
  
  return {
    id: apiCard.id,
    title: apiCard.title,
    authorId: apiCard.authorId || undefined,
    authorName: apiCard.authorName || undefined,
    description: apiCard.description,
    photos: apiCard.photos,
    createdAt: apiCard.createdAt,
  };
}
