import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import type { KanbanBoard, KanbanCard } from '@/types/domain';
import * as mock from '@/mocks/kanban';

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

