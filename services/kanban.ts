import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import type { KanbanBoard, KanbanCard } from '@/types/domain';
import * as mock from '@/mocks/kanban';
import type { Id } from '@/types/domain';

export async function getBoard(): Promise<KanbanBoard> {
  if (USE_MOCKS) return Promise.resolve(mock.board);
  return fetchJson<KanbanBoard>('/kanban');
}

export async function addColumn(name: string): Promise<void> {
  if (USE_MOCKS) {
    if (!mock.board[name]) mock.board[name] = [];
    return;
  }
  await fetchJson<void, { name: string }>('/kanban/columns', { method: 'POST', body: { name } });
}

export async function addCard(column: string, card: KanbanCard): Promise<void> {
  if (USE_MOCKS) {
    if (!mock.board[column]) mock.board[column] = [];
    mock.board[column].unshift(card);
    return;
  }
  await fetchJson<void, { column: string; card: KanbanCard }>('/kanban/cards', { method: 'POST', body: { column, card } });
}

export async function getCard(cardId: Id): Promise<KanbanCard | null> {
  if (USE_MOCKS) {
    for (const col of Object.values(mock.board)) {
      const found = col.find(c => c.id === cardId);
      if (found) return found;
    }
    return null;
  }
  return fetchJson<KanbanCard>(`/kanban/cards/${cardId}`);
}
