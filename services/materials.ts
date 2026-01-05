import { fetchJson } from '@/lib/http';
import {
  CatalogItem,
  MaterialDelivery,
  MaterialRequest,
  MaterialRequestDetail,
  MaterialRequestItem,
  MaterialRequestStatus,
} from '@/types/domain';
import { getMyProjects } from '@/services/projects';

interface ApiCatalogItem {
  id: number | string;
  name: string;
  sku?: string;
  unit: string;
  code?: string;
  description?: string;
  brand?: string;
  model?: string;
}

type MaybeString = string | null | undefined;
type MaybeNumber = number | string | null | undefined;

interface ApiMaterialRequest {
  id: MaybeNumber;
  code?: MaybeString;
  codigo?: MaybeString;
  numeroSolicitud?: MaybeString;
  reason?: MaybeString;
  projectId?: MaybeNumber;
  proyectoId?: MaybeNumber;
  projectName?: MaybeString;
  proyecto?: { id?: MaybeNumber; nombre?: MaybeString } | MaybeString;
  solicitadoPor?: { id?: MaybeNumber; nombre?: MaybeString } | MaybeString;
  requesterName?: MaybeString;
  solicitante?: MaybeString;
  requestDate?: MaybeString;
  fechaSolicitud?: MaybeString;
  fechaRequerida?: MaybeString;
  request_date?: MaybeString;
  status?: MaybeString;
  estado?: MaybeString;
  statusLabel?: MaybeString;
  estadoLabel?: MaybeString;
  estado_label?: MaybeString;
  priority?: MaybeString;
  prioridad?: MaybeString;
  motivo?: MaybeString;
  urgente?: boolean;
  observations?: MaybeString;
  observaciones?: MaybeString;
  deliveryProgress?: number | null;
  avanceEntrega?: number | null;
  delivery_percentage?: number | null;
  porcentajeEntregado?: number | null;
  totalItems?: number | null;
  total_items?: number | null;
  items_count?: number | null;
  itemsCount?: number | null;
  totalApprovedQuantity?: number | null;
  cantidadAprobadaTotal?: number | null;
  totalDeliveredQuantity?: number | null;
  cantidadEntregadaTotal?: number | null;
  materialName?: MaybeString;
  material?: MaybeString;
  quantity?: number | null;
  cantidad?: number | null;
  unit?: MaybeString;
  unidad?: MaybeString;
  items?: ApiMaterialRequestItem[];
  deliveries?: ApiMaterialDelivery[];
}

interface ApiMaterialRequestItem {
  id: MaybeNumber;
  requestId?: MaybeNumber;
  materialId?: MaybeNumber;
  material_id?: MaybeNumber;
  materialName?: MaybeString;
  material?: { id?: MaybeNumber; name?: MaybeString; unidad?: MaybeString } | MaybeString;
  unit?: MaybeString;
  unidad?: MaybeString;
  requestedQty?: number | null;
  cantidadSolicitada?: number | null;
  approvedQty?: number | null;
  cantidadAprobada?: number | null;
  deliveredQty?: number | null;
  cantidadEntregada?: number | null;
  observations?: MaybeString;
  observaciones?: MaybeString;
  lotId?: MaybeNumber;
  loteId?: MaybeNumber;
  lotNumber?: MaybeString;
  lote?: { id?: MaybeNumber; numero?: MaybeString } | MaybeString;
  deliveries?: ApiMaterialDelivery[];
}

interface ApiMaterialDelivery {
  id: MaybeNumber;
  lotId?: MaybeNumber;
  loteId?: MaybeNumber;
  lotNumber?: MaybeString;
  lote?: { id?: MaybeNumber; numero?: MaybeString } | MaybeString;
  requestItemId?: MaybeNumber;
  request_item_id?: MaybeNumber;
  quantity: number;
  observations?: MaybeString;
  observaciones?: MaybeString;
  deliveredAt?: MaybeString;
  fechaEntrega?: MaybeString;
  deliveredBy?: MaybeString;
  entregadoPor?: MaybeString;
}

const normalizeId = (value: MaybeNumber): string =>
  value !== undefined && value !== null ? String(value) : '';

const normalizeOptionalId = (value: MaybeNumber): string | undefined => {
  const normalized = normalizeId(value);
  return normalized ? normalized : undefined;
};

const normalizeString = (value: MaybeString): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
};

const coerceNumber = (value: MaybeNumber): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const isUrgentPriorityValue = (priority?: MaybeString): boolean => {
  const normalized = normalizeString(priority)?.toLowerCase();
  if (!normalized) return false;
  return normalized === 'high' || normalized === 'alta' || normalized === 'urgente' || normalized === 'urgent';
};

const resolveUrgentFlag = (request: ApiMaterialRequest): boolean => {
  if (typeof request.urgente === 'boolean') {
    return request.urgente;
  }
  return isUrgentPriorityValue(request.priority ?? request.prioridad);
};

const mapStatus = (status?: MaybeString): MaterialRequestStatus => {
  const normalized = normalizeString(status)?.toLowerCase();
  switch (normalized) {
    case 'draft':
    case 'borrador':
      return 'draft';
    case 'approved':
    case 'aprobada':
    case 'aprobado':
      return 'approved';
    case 'rejected':
    case 'rechazada':
    case 'rechazado':
      return 'rejected';
    case 'delivered':
    case 'recibida':
    case 'entregada':
      return 'delivered';
    case 'sent':
    case 'enviado':
    case 'envio_parcial':
      return 'sent';
    case 'pending':
    case 'pendiente':
      return 'pending';
    default:
      return 'pending';
  }
};

const mapMaterialDelivery = (delivery: ApiMaterialDelivery): MaterialDelivery => {
  const lotRaw = delivery.lote;
  const lot = lotRaw && typeof lotRaw === 'object' ? lotRaw : undefined;
  return {
    id: normalizeId(delivery.id),
    requestItemId: normalizeId(
      delivery.requestItemId ?? delivery.request_item_id ?? undefined
    ) || undefined,
    quantity: Number(delivery.quantity) || 0,
    observations: normalizeString(delivery.observations ?? delivery.observaciones),
    lotId:
      lot?.id != null
        ? normalizeId(lot.id)
        : delivery.lotId != null
          ? normalizeId(delivery.lotId)
          : delivery.loteId != null
            ? normalizeId(delivery.loteId)
            : undefined,
    lotNumber:
      lot?.numero !== undefined
        ? normalizeString(lot.numero)
        : typeof lotRaw === 'string'
          ? normalizeString(lotRaw)
          : normalizeString(delivery.lotNumber),
    deliveredAt: normalizeString(delivery.deliveredAt ?? delivery.fechaEntrega),
    deliveredBy: normalizeString(delivery.deliveredBy ?? delivery.entregadoPor),
  };
};

const mapMaterialRequestItem = (item: ApiMaterialRequestItem): MaterialRequestItem => {
  const materialRaw = item.material;
  const material = materialRaw && typeof materialRaw === 'object' ? materialRaw : undefined;
  const lotRaw = item.lote;
  const lot = lotRaw && typeof lotRaw === 'object' ? lotRaw : undefined;
  const deliveries = item.deliveries?.map(mapMaterialDelivery) ?? [];

  const resolveMaterialName = (): string => {
    const directName = normalizeString(item.materialName);
    if (directName) return directName;
    if (typeof item.material === 'string') {
      const plain = normalizeString(item.material);
      if (plain) return plain;
    }
    if (material) {
      const objectName = normalizeString(
        (material as { name?: string; nombre?: string }).name ??
        (material as { name?: string; nombre?: string }).nombre
      );
      if (objectName) return objectName;
    }
    return '';
  };

  const resolveUnitValue = (value: unknown): string | undefined => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
      return normalizeString(value);
    }
    if (typeof value === 'object') {
      const candidate = normalizeString(
        (value as { name?: string; nombre?: string; unit?: string; unidad?: string; unidad_medida?: string }).name ??
        (value as { name?: string; nombre?: string; unit?: string; unidad?: string; unidad_medida?: string }).nombre ??
        (value as { name?: string; nombre?: string; unit?: string; unidad?: string; unidad_medida?: string }).unit ??
        (value as { name?: string; nombre?: string; unit?: string; unidad?: string; unidad_medida?: string }).unidad ??
        (value as { name?: string; nombre?: string; unit?: string; unidad?: string; unidad_medida?: string }).unidad_medida
      );
      if (candidate) return candidate;
    }
    return undefined;
  };

  const resolvedUnit =
    resolveUnitValue(item.unit) ??
    resolveUnitValue(item.unidad) ??
    resolveUnitValue(material?.unit) ??
    resolveUnitValue(material?.unidad) ??
    resolveUnitValue((material as any)?.unidad_medida) ??
    resolveUnitValue((material as any)?.unidadMedida);

  const requestedQty = coerceNumber(item.requestedQty ?? item.cantidadSolicitada) ?? 0;
  const approvedQty = coerceNumber(item.approvedQty ?? item.cantidadAprobada) ?? requestedQty;
  const deliveredQty = coerceNumber(item.deliveredQty ?? item.cantidadEntregada) ?? 0;

  return {
    id: normalizeId(item.id),
    materialId: normalizeId(item.materialId ?? item.material_id ?? material?.id) || undefined,
    materialName: resolveMaterialName(),
    unit: resolvedUnit ?? undefined,
    requestedQty,
    approvedQty,
    deliveredQty,
    observations: normalizeString(item.observations ?? item.observaciones),
    lotId:
      item.lotId != null
        ? normalizeId(item.lotId)
        : item.loteId != null
          ? normalizeId(item.loteId)
          : undefined,
    lotNumber: normalizeString(
      (lot?.numero !== undefined ? lot.numero : undefined) ??
      (typeof lotRaw === 'string' ? lotRaw : undefined) ??
      (typeof item.lotNumber === 'string' ? item.lotNumber : undefined) ??
      (typeof item.lote === 'string' ? item.lote : undefined)
    ),
    deliveries,
  };
};

const mapMaterialRequest = (request: ApiMaterialRequest): MaterialRequest => {
  const project = request.proyecto && typeof request.proyecto === 'object' ? request.proyecto : undefined;
  const items = request.items?.map(mapMaterialRequestItem) ?? [];
  const firstItem = items[0];

  const aggregatedRequested = items.length
    ? items.reduce((sum, item) => sum + (item.requestedQty ?? 0), 0)
    : undefined;
  const aggregatedApproved = items.length
    ? items.reduce((sum, item) => sum + (item.approvedQty ?? item.requestedQty ?? 0), 0)
    : undefined;
  const aggregatedDelivered = items.length
    ? items.reduce((sum, item) => sum + (item.deliveredQty ?? 0), 0)
    : undefined;

  const totalApproved =
    coerceNumber(request.totalApprovedQuantity ?? request.cantidadAprobadaTotal) ??
    (aggregatedApproved !== undefined ? aggregatedApproved : undefined);
  const totalDelivered =
    coerceNumber(request.totalDeliveredQuantity ?? request.cantidadEntregadaTotal) ??
    (aggregatedDelivered !== undefined ? aggregatedDelivered : undefined);
  const quantity =
    coerceNumber(request.quantity ?? request.cantidad) ??
    (aggregatedRequested !== undefined ? aggregatedRequested : undefined) ??
    (aggregatedApproved !== undefined ? aggregatedApproved : undefined);

  const deliveryProgressExplicit =
    request.deliveryProgress ??
    request.avanceEntrega ??
    request.delivery_percentage ??
    request.porcentajeEntregado;
  const hasTotalApproved = typeof totalApproved === 'number' && totalApproved > 0;
  const hasQuantity = typeof quantity === 'number' && quantity > 0;
  const hasTotalDelivered = typeof totalDelivered === 'number' && totalDelivered >= 0;
  const safeTotalDelivered = typeof totalDelivered === 'number' ? totalDelivered : 0;

  const totalApprovedValue = hasTotalApproved ? (totalApproved as number) : undefined;
  const quantityValue = hasQuantity ? (quantity as number) : undefined;

  const deliveryProgress =
    typeof deliveryProgressExplicit === 'number'
      ? deliveryProgressExplicit
      : totalApprovedValue !== undefined && hasTotalDelivered
        ? Math.min(100, Math.round((safeTotalDelivered / totalApprovedValue) * 100))
        : quantityValue !== undefined && hasTotalDelivered
          ? Math.min(100, Math.round((safeTotalDelivered / quantityValue) * 100))
          : 0;

  const projectName =
    project?.nombre !== undefined
      ? normalizeString(project.nombre)
      : typeof request.proyecto === 'string'
        ? normalizeString(request.proyecto)
        : normalizeString(request.projectName);

  const requestId = request.id != null ? normalizeId(request.id) : '';

  const requester =
    request.solicitadoPor && typeof request.solicitadoPor === 'object'
      ? request.solicitadoPor
      : undefined;

  return {
    id: requestId,
    code:
      normalizeString(request.code) ??
      normalizeString(request.codigo) ??
      normalizeString(request.numeroSolicitud) ??
      undefined,
    projectId: normalizeOptionalId(request.projectId ?? request.proyectoId ?? project?.id),
    projectName: projectName ?? 'Sin proyecto',
    requesterName:
      normalizeString(request.requesterName) ??
      normalizeString(request.solicitante) ??
      (typeof request.solicitadoPor === 'string'
        ? normalizeString(request.solicitadoPor)
        : normalizeString(requester?.nombre)),
    requestDate:
      normalizeString(request.requestDate) ??
      normalizeString(request.fechaSolicitud) ??
      normalizeString(request.request_date) ??
      '',
    status: mapStatus(request.status ?? request.estado),
    statusLabel:
      normalizeString(request.statusLabel) ??
      normalizeString(request.estadoLabel) ??
      normalizeString(request.estado_label),
    urgent: resolveUrgentFlag(request),
    reason:
      normalizeString(request.reason) ??
      normalizeString(request.motivo),
    observations:
      normalizeString(request.observations) ??
      normalizeString(request.observaciones),
    deliveryProgress,
    totalItems:
      request.totalItems ??
      request.total_items ??
      request.items_count ??
      request.itemsCount ??
      (items.length ? items.length : undefined),
    totalApprovedQuantity: totalApproved,
    totalDeliveredQuantity: totalDelivered,
    materialName:
      normalizeString(request.materialName) ??
      (typeof request.material === 'string'
        ? normalizeString(request.material)
        : normalizeString(
            (request.material as { name?: string; nombre?: string } | undefined)?.name ??
            (request.material as { name?: string; nombre?: string } | undefined)?.nombre
          )) ??
      firstItem?.materialName,
    quantity: quantity ?? undefined,
    unit:
      normalizeString(request.unit ?? request.unidad) ??
      (typeof request.material === 'object'
        ? normalizeString(
            (request.material as { unit?: string; unidad?: string; unidad_medida?: string }).unit ??
            (request.material as { unit?: string; unidad?: string; unidad_medida?: string }).unidad ??
            (request.material as { unit?: string; unidad?: string; unidad_medida?: string }).unidad_medida
          )
        : undefined) ??
      firstItem?.unit,
  };
};

const mapMaterialRequestDetail = (request: ApiMaterialRequest): MaterialRequestDetail => {
  const base = mapMaterialRequest(request);
  const items = request.items?.map(mapMaterialRequestItem) ?? [];
  const deliveries = request.deliveries?.map(mapMaterialDelivery) ?? [];

  return {
    ...base,
    items,
    deliveries,
    approvedAt: normalizeString((request as any).approvedAt ?? (request as any).fechaAprobacion),
    receivedAt: normalizeString((request as any).receivedAt ?? (request as any).fechaRecepcion),
    rejectedAt: normalizeString((request as any).rejectedAt ?? (request as any).fechaRechazo),
    updatedAt: normalizeString((request as any).updatedAt ?? (request as any).fechaActualizacion),
    warehouseName: normalizeString((request as any).warehouseName ?? (request as any).almacenNombre),
  };
};

export interface ListMaterialRequestsParams {
  projectId?: string;
  status?: MaterialRequestStatus;
}

export async function listMaterialRequests(params: ListMaterialRequestsParams = {}): Promise<MaterialRequest[]> {
  const query = new URLSearchParams();
  if (params.projectId) query.append('projectId', params.projectId);
  if (params.status) query.append('status', params.status);
  const queryString = query.toString();

  const apiRequests = await fetchJson<ApiMaterialRequest[]>(
    queryString ? `/materials/requests?${queryString}` : '/materials/requests'
  );

  const mappedRequests = apiRequests.map(mapMaterialRequest);

  // Filtrar en cliente para que el usuario solo vea
  // solicitudes de proyectos a los que está asignado
  if (!params.projectId) {
    try {
      const myProjects = await getMyProjects();
      const projectIds = new Set(myProjects.map(p => p.id));

      return mappedRequests.filter(request =>
        request.projectId ? projectIds.has(request.projectId) : true
      );
    } catch (error) {
      console.error('Error filtering material requests by projects:', error);
      return mappedRequests;
    }
  }

  return mappedRequests;
}

export async function getMaterialRequest(id: string): Promise<MaterialRequestDetail> {
  const apiRequest = await fetchJson<ApiMaterialRequest>(`/materials/requests/${id}`);
  return mapMaterialRequestDetail(apiRequest);
}

export interface ApproveMaterialRequestPayload {
  observations?: string;
  items?: Array<{ itemId: string; approvedQty?: number }>;
}

export async function approveMaterialRequest(
  id: string,
  payload: ApproveMaterialRequestPayload = {}
): Promise<MaterialRequestDetail> {
  const body: Record<string, unknown> = {};
  if (payload.observations) body.observations = payload.observations;
  if (payload.items?.length) {
    body.items = payload.items.map(item => ({
      itemId: item.itemId,
      approvedQty: item.approvedQty,
    }));
  }

  const apiRequest = await fetchJson<ApiMaterialRequest, typeof body>(
    `/materials/requests/${id}/approve`,
    { method: 'POST', body }
  );

  return mapMaterialRequestDetail(apiRequest);
}

export interface RejectMaterialRequestPayload {
  observations: string;
}

export async function rejectMaterialRequest(
  id: string,
  payload: RejectMaterialRequestPayload
): Promise<MaterialRequestDetail> {
  const apiRequest = await fetchJson<ApiMaterialRequest, RejectMaterialRequestPayload>(
    `/materials/requests/${id}/reject`,
    { method: 'POST', body: payload }
  );

  return mapMaterialRequestDetail(apiRequest);
}

export interface DeliverMaterialRequestInput {
  deliveries: Array<{
    itemId?: string;
    quantity: number;
    lotId?: string | null;
    lotNumber?: string | null;
    observations?: string;
  }>;
  observations?: string;
  images?: Array<{
    url: string;
    latitude?: number;
    longitude?: number;
    takenAt?: string;
  }>;
}

export async function deliverMaterialRequest(
  id: string,
  payload: DeliverMaterialRequestInput
): Promise<MaterialRequestDetail> {
  const apiRequest = await fetchJson<ApiMaterialRequest, DeliverMaterialRequestInput>(
    `/materials/requests/${id}/deliver`,
    { method: 'POST', body: payload }
  );

  return mapMaterialRequestDetail(apiRequest);
}

export async function listCatalog(projectId?: string): Promise<CatalogItem[]> {
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
    sku: item.sku,
    code: item.code,
    description: item.description,
    brand: item.brand,
    model: item.model,
  }));
}

export interface CreateMaterialRequestInput {
  projectId: string;
  items: Array<{
    materialId: string | number;
    qty: number;
  }>;
  urgent?: boolean;
  reason?: string;
  deliveryDate?: string;
  observations?: string;
}

type CreateMaterialRequestApiBody = CreateMaterialRequestInput & {
  requiredDate?: string;
  fechaRequerida?: string;
};

export async function createMaterialRequest(
  payload: CreateMaterialRequestInput
): Promise<{ id: string }> {
  const requestBody: CreateMaterialRequestApiBody = {
    projectId: payload.projectId,
    items: payload.items,
  };

  requestBody.urgent = Boolean(payload.urgent);
  requestBody.observations = payload.observations ?? '';
  if (payload.reason !== undefined) {
    requestBody.reason = payload.reason;
  }
  if (payload.deliveryDate) {
    requestBody.deliveryDate = payload.deliveryDate;
    requestBody.requiredDate = payload.deliveryDate;
    requestBody.fechaRequerida = payload.deliveryDate;
  }

  const response = await fetchJson<{ id: string }, CreateMaterialRequestApiBody>(
    '/materials/requests',
    { method: 'POST', body: requestBody }
  );

  return { id: String(response.id) };
}

export const getMaterialRequestDetail = getMaterialRequest;
export const approveMaterialRequestDetail = approveMaterialRequest;
export const rejectMaterialRequestDetail = rejectMaterialRequest;
export const deliverMaterialRequestDetail = deliverMaterialRequest;
