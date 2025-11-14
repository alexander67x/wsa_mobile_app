import { USE_MOCKS } from '@/lib/config';
import { fetchJson } from '@/lib/http';
import { CatalogItem, MaterialRequest } from '@/types/domain';
import { materialCatalog, materialRequests } from '@/mocks/materials';

interface ApiCatalogItem {
  id: number | string;
  name: string;
  sku?: string;
  unit: string;
}

export async function listMaterialRequests(): Promise<MaterialRequest[]> {
  if (USE_MOCKS) return Promise.resolve(materialRequests);
  
  const apiRequests = await fetchJson<any[]>('/materials/requests');
  
  // API currently returns empty array, return empty for now
  return apiRequests.map((r): MaterialRequest => ({
    id: String(r.id || ''),
    projectName: r.projectName || '',
    materialName: r.materialName || '',
    quantity: r.quantity || 0,
    unit: r.unit || '',
    requestDate: r.requestDate || '',
    status: (r.status || 'pending') as 'pending' | 'approved' | 'rejected' | 'delivered',
    priority: (r.priority || 'medium') as 'low' | 'medium' | 'high',
    observations: r.observations,
  }));
}

export async function listCatalog(projectId?: string): Promise<CatalogItem[]> {
  if (USE_MOCKS) return Promise.resolve(materialCatalog);
  
  // Build URL with projectId as query parameter if provided
  let url = '/materials/catalog';
  if (projectId) {
    url += `?projectId=${encodeURIComponent(projectId)}`;
  }
  
  const apiCatalog = await fetchJson<ApiCatalogItem[]>(url);
  
  return apiCatalog.map((item): CatalogItem => ({
    id: String(item.id),
    name: item.name,
    unit: item.unit,
  }));
}

export async function createMaterialRequest(payload: {
  projectId: string;
  items: Array<{
    materialId: string | number;
    qty: number;
  }>;
}): Promise<{ id: string }> {
  if (USE_MOCKS) return Promise.resolve({ id: 'mock' });
  
  const response = await fetchJson<{ id: string }, typeof payload>(
    '/materials/requests',
    { method: 'POST', body: payload }
  );
  
  return { id: String(response.id) };
}

