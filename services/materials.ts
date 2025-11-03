import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { CatalogItem, MaterialRequest } from '@/types/domain';
import { materialCatalog, materialRequests } from '@/mocks/materials';

export async function listMaterialRequests(): Promise<MaterialRequest[]> {
  if (USE_MOCKS) return Promise.resolve(materialRequests);
  return fetchJson<MaterialRequest[]>('/materials/requests');
}

export async function listCatalog(): Promise<CatalogItem[]> {
  if (USE_MOCKS) return Promise.resolve(materialCatalog);
  return fetchJson<CatalogItem[]>('/materials/catalog');
}

export async function createMaterialRequest(_payload: any): Promise<{ id: string }> {
  if (USE_MOCKS) return Promise.resolve({ id: 'mock' });
  return fetchJson<{ id: string }, any>('/materials/requests', { method: 'POST', body: _payload });
}

