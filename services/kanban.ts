import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import type { KanbanBoard, KanbanCard } from '@/types/domain';
import * as mock from '@/mocks/kanban';
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
  if (USE_MOCKS) return Promise.resolve(mock.board);
  
  const params = projectId ? `?projectId=${projectId}` : '';
  const apiBoard = await fetchJson<Record<string, ApiKanbanCard[]>>(`/kanban${params}`);
  
  // API returns board with column names as keys
  return apiBoard as KanbanBoard;
}

export async function addColumn(name: string): Promise<void> {
  if (USE_MOCKS) {
    if (!mock.board[name]) mock.board[name] = [];
    return;
  }
  await fetchJson<void, { name: string }>('/kanban/columns', { method: 'POST', body: { name } });
}

export async function addCard(
  column: string, 
  card: KanbanCard, 
  projectId?: string, 
  taskId?: string
): Promise<KanbanCard> {
  if (USE_MOCKS) {
    if (!mock.board[column]) mock.board[column] = [];
    mock.board[column].unshift(card);
    return card;
  }
  
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
  if (USE_MOCKS) {
    for (const col of Object.values(mock.board)) {
      const found = col.find(c => c.id === cardId);
      if (found) return found;
    }
    return null;
  }
  
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
