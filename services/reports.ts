import { fetchJson } from '@/lib/http';
import { Report, ReportDetail } from '@/types/domain';
import { getUser, getRole, getRoleSlug } from '@/services/auth';
import { getMyProjects } from '@/services/projects';

interface ApiReport {
  id: string;
  projectId: string;
  taskId: string | null;
  taskTitle: string | null;
  title: string;
  project: string | null;
  date: string | null;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  progress: number | null;
  authorId: string | null;
  authorName: string | null;
}

interface ApiReportDetail {
  id: string;
  projectId: string;
  taskId: string | null;
  taskTitle: string | null;
  taskDescription: string | null;
  taskStatus: string | null;
  title: string;
  project: string | null;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  authorId: string | null;
  author: string | null;
  date: string | null;
  location: string | null;
  description: string;
  observations: string | null;
  images: string[];
  approvedBy: string | null;
  approvedDate: string | null;
  rejectedBy?: string | null;
  rejectedDate?: string | null;
  rejectionComments?: string | null;
  approvalComments?: string | null;
  feedback: string | null;
  difficulties: string | null;
  materialsUsed: string | null;
}

type MaybeString = string | null | undefined;

const normalizeString = (value: MaybeString): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
};

const toMaybeString = (value: unknown): MaybeString => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return undefined;
};

const pickString = (source: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const normalized = normalizeString(toMaybeString(source[key]));
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
};

const pickMaterialName = (value: Record<string, unknown>): string | undefined =>
  pickString(value, 'materialName', 'material_name', 'name', 'nombre', 'material', 'descripcion');

const pickMaterialUnit = (value: Record<string, unknown>): string | undefined =>
  pickString(value, 'unit', 'unidad', 'unidad_medida', 'unitOfMeasure', 'unit_of_measure');

const pickMaterialQuantity = (value: Record<string, unknown>): number | undefined => {
  const raw =
    value.quantity ??
    value.cantidad ??
    value.qty ??
    value.cantidad_usada ??
    value.cantidadUsada ??
    value.usedQuantity ??
    value.used_quantity;
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveReportImages = (raw: Record<string, unknown>): string[] => {
  const candidates = [
    raw.images,
    raw.imagenes,
    raw.evidencias,
    raw.attachments,
    raw.archivos,
  ];
  const list = candidates.find((value) => Array.isArray(value)) as Array<unknown> | undefined;
  if (!list) return [];
  return list
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        const bag = entry as Record<string, unknown>;
        const url = pickString(bag, 'url', 'uri', 'image', 'imagen');
        return url ?? null;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
};

const resolveReportMaterials = (raw: Record<string, unknown>): ReportDetail['materials'] | undefined => {
  const list =
    (Array.isArray(raw.materials) ? raw.materials : null) ??
    (Array.isArray(raw.materiales) ? raw.materiales : null) ??
    (Array.isArray(raw.reportMaterials) ? raw.reportMaterials : null) ??
    (Array.isArray(raw.materials_used) ? raw.materials_used : null);
  if (!list) return undefined;
  const mapped = list
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const value = item as Record<string, unknown>;
      const material =
        (value.material as Record<string, unknown> | null | undefined) ??
        (value.materiale as Record<string, unknown> | null | undefined);
      const materialId =
        value.materialId ??
        value.material_id ??
        value.id_material ??
        value.materialId ??
        value.material_id ??
        (material ? material.id ?? material.materialId ?? material.material_id : undefined);
      const materialName = pickMaterialName(value) ?? (material ? pickMaterialName(material) : undefined);
      const unit = pickMaterialUnit(value) ?? (material ? pickMaterialUnit(material) : undefined) ?? '';
      const quantity = pickMaterialQuantity(value) ?? 0;
      if (!materialId) return null;
      return {
        materialId: String(materialId),
        materialName,
        unit,
        quantity,
        observations: pickString(value, 'observations', 'observacion', 'observaciones', 'observation'),
      };
    })
    .filter(Boolean) as NonNullable<ReportDetail['materials']>;
  return mapped.length ? mapped : undefined;
};

const mapReportStatus = (status?: MaybeString): Report['status'] => {
  const normalized = normalizeString(status)?.toLowerCase();
  switch (normalized) {
    case 'approved':
    case 'aprobado':
    case 'aprobada':
      return 'approved';
    case 'rejected':
    case 'rechazado':
    case 'rechazada':
      return 'rejected';
    case 'pending':
    case 'pendiente':
    case 'en_revision':
    case 'en revision':
    case 'en_proceso':
      return 'pending';
    default:
      return 'pending';
  }
};

export async function listReports(projectId?: string, taskId?: string): Promise<(Report & { taskId?: string; taskTitle?: string })[]> {
  const user = getUser();
  const role = getRole();
  const ensuredEmployeeId = await (await import('@/services/auth')).ensureEmployeeId();
  
  const params = new URLSearchParams();
  if (projectId) params.append('projectId', projectId);
  if (taskId) params.append('taskId', taskId);
  
  const queryString = params.toString();
  const url = queryString ? `/reports?${queryString}` : '/reports';
  
  const apiReports = await fetchJson<ApiReport[]>(url);
  
  // Filtrar en el cliente según el rol
  let filteredReports = apiReports;
  const currentAuthorId = user ? (user.employeeId || ensuredEmployeeId || user.id) : ensuredEmployeeId || null;
  
  if (role === 'worker' && currentAuthorId) {
    // Worker (sin privilegios): solo sus propios reportes
    const authorKey = String(currentAuthorId);
    filteredReports = apiReports.filter(r => String(r.authorId ?? '') === authorKey);
  } else if (role === 'supervisor' && !projectId) {
    // Supervisor (con privilegios): solo reportes de sus proyectos
    try {
      const myProjects = await getMyProjects();
      const projectIds = myProjects.map(p => p.id);
      filteredReports = apiReports.filter(r => r.projectId && projectIds.includes(r.projectId));
    } catch (error) {
      console.error('Error filtering reports by projects:', error);
      filteredReports = apiReports;
    }
  }
  
  return filteredReports.map((r): Report & { taskId?: string; taskTitle?: string } => {
    const raw = r as Record<string, unknown>;
    const status = mapReportStatus(
      r.status ??
      toMaybeString(raw.estado) ??
      toMaybeString(raw.statusLabel) ??
      toMaybeString(raw.estado_label)
    );

    const typeValue =
      r.type === 'incident'
        ? 'incident'
        : r.type === 'quality'
          ? 'quality'
          : 'progress';

    const projectName =
      normalizeString(r.project) ??
      pickString(raw, 'projectName', 'project_name', 'proyecto', 'obra') ??
      'Sin proyecto';

    const dateValue =
      normalizeString(r.date) ?? pickString(raw, 'fecha', 'reportDate', 'fecha_reporte', 'fechaReporte') ?? '';

    const titleValue = normalizeString(r.title) ?? pickString(raw, 'nombre', 'titulo') ?? 'Reporte';
    const progressValue =
      typeof r.progress === 'number'
        ? r.progress
        : typeof raw.avance === 'number'
          ? (raw.avance as number)
          : typeof raw.progressPercentage === 'number'
            ? (raw.progressPercentage as number)
            : undefined;
    const materialsUsedValue =
      normalizeString((r as { materialsUsed?: string | null }).materialsUsed) ??
      pickString(raw, 'materialsUsed', 'materialesUsados', 'materiales_utilizados');

    return {
      id: r.id,
      title: titleValue,
      project: projectName,
      date: dateValue,
      type: typeValue,
      status,
      progress: progressValue || undefined,
      materialsUsed: materialsUsedValue || undefined,
      authorId: r.authorId || undefined,
      authorName:
        (r.authorName ?? pickString(raw, 'author', 'autor', 'autorNombre', 'autor_nombre')) || undefined,
      taskId: r.taskId || undefined,
      taskTitle: r.taskTitle || undefined,
    };
  });
}

export async function getReport(id: string): Promise<ReportDetail> {
  const apiReport = await fetchJson<ApiReportDetail>(`/reports/${id}`);
  const raw = apiReport as Record<string, unknown>;

  const status = mapReportStatus(
    apiReport.status ??
    toMaybeString(raw.estado) ??
    toMaybeString(raw.statusLabel) ??
    toMaybeString(raw.estado_label)
  );

  const typeValue =
    apiReport.type === 'incident'
      ? 'incident'
      : apiReport.type === 'quality'
        ? 'quality'
        : 'progress';

  const projectName =
    normalizeString(apiReport.project) ??
    pickString(raw, 'projectName', 'project_name', 'proyecto', 'obra') ??
    'Sin proyecto';

  const authorName =
    normalizeString(apiReport.author) ??
    pickString(raw, 'authorName', 'author_name', 'autor', 'autorNombre', 'autor_nombre') ??
    'Desconocido';

  const dateValue =
    normalizeString(apiReport.date) ?? pickString(raw, 'fecha', 'fecha_reporte', 'reportDate', 'fechaReporte') ?? '';

  const locationValue = normalizeString(apiReport.location) ?? pickString(raw, 'ubicacion') ?? '';
  const descriptionValue = normalizeString(apiReport.description) ?? pickString(raw, 'descripcion') ?? '';
  const observationsValue = normalizeString(apiReport.observations) ?? pickString(raw, 'observaciones');
  const difficultiesValue =
    normalizeString(apiReport.difficulties) ??
    pickString(raw, 'dificultades', 'difficulties');
  const materialsUsedValue =
    normalizeString(apiReport.materialsUsed) ??
    pickString(raw, 'materialesUsados', 'materiales_usados', 'materialsUsed', 'materials_used');
  const materialsList = resolveReportMaterials(raw);

  const approvedBy = pickString(
    raw,
    'approvedBy',
    'approved_by',
    'aprobadoPor',
    'aprobado_por',
    'aprobadoPorNombre',
    'aprobado_por_nombre'
  );
  const approvedDate = pickString(
    raw,
    'approvedDate',
    'approved_date',
    'approvedAt',
    'approved_at',
    'fechaAprobacion',
    'fecha_aprobacion'
  );

  const rejectedBy = pickString(
    raw,
    'rejectedBy',
    'rejected_by',
    'rechazadoPor',
    'rechazado_por',
    'rechazadoPorNombre',
    'rechazado_por_nombre'
  );
  const rejectedDate = pickString(
    raw,
    'rejectedDate',
    'rejected_date',
    'rejectedAt',
    'rejected_at',
    'fechaRechazo',
    'fecha_rechazo'
  );

  const feedback = pickString(
    raw,
    'feedback',
    'rejectionComments',
    'rejection_comments',
    'comentariosRechazo',
    'comentarioRechazo',
    'approvalComments',
    'comentariosAprobacion'
  );

  const resolvedApprovedBy = approvedBy || undefined;
  const resolvedApprovedDate = approvedDate || undefined;
  const resolvedRejectedBy =
    rejectedBy || (status === 'rejected' ? resolvedApprovedBy : undefined);
  const resolvedRejectedDate =
    rejectedDate || (status === 'rejected' ? resolvedApprovedDate : undefined);
  const resolvedImages = resolveReportImages(raw);

  return {
    id: apiReport.id,
    title: apiReport.title,
    project: projectName,
    type: typeValue,
    status,
    progress: undefined,
    author: authorName,
    authorId: apiReport.authorId || undefined,
    date: dateValue,
    location: locationValue,
    description: descriptionValue,
    observations: observationsValue,
    images: resolvedImages,
    approvedBy: resolvedApprovedBy,
    approvedDate: resolvedApprovedDate,
    rejectedBy: resolvedRejectedBy,
    rejectedDate: resolvedRejectedDate,
    feedback: feedback || undefined,
    taskId: apiReport.taskId || undefined,
    taskTitle: apiReport.taskTitle || undefined,
    taskDescription: apiReport.taskDescription || undefined,
    taskStatus: apiReport.taskStatus || undefined,
    projectId: apiReport.projectId || undefined,
    difficulties: difficultiesValue,
    materialsUsed: materialsUsedValue,
    materials: materialsList,
  };
}

export interface ReportImage {
  url: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
}

export interface ReportMaterial {
  materialId: number | string;
  quantity: number;
  unit: string;
  observations?: string;
}

export type ReportResubmitPayload = {
  title?: string;
  description?: string;
  reportDate?: string;
  difficulties?: string;
  materialsUsed?: string;
  observations?: string;
  attachments?: number[];
  images?: ReportImage[];
  materials?: ReportMaterial[];
};

export async function createReport(payload: {
  projectId: string;
  taskId?: string | number;
  authorId: string | number;
  title: string;
  description: string;
  reportDate?: string;
  difficulties?: string;
  materialsUsed?: string;
  observations?: string;
  attachments?: number[];
  images?: ReportImage[];
  materials?: ReportMaterial[];
}): Promise<{ id: string }> {
  const roleSlug = getRoleSlug();
  if (roleSlug !== 'personal_obra') {
    throw new Error('No tienes permisos para enviar reportes de avance.');
  }
  const response = await fetchJson<{ id: string; report: ApiReport }, typeof payload>(
    '/reports',
    { method: 'POST', body: payload }
  );
  
  return { id: response.id };
}

type ReportReviewPayload = {
  observations?: string;
};

type ApiReportReviewResponse = {
  message?: string;
  report?: ApiReportDetail;
};

export interface ReportReviewResult {
  message: string;
  report: Awaited<ReturnType<typeof getReport>>;
}

async function reviewReport(
  action: 'approve' | 'reject',
  id: string,
  payload?: ReportReviewPayload
): Promise<ReportReviewResult> {
  const safeId = String(id);
  const endpoint = `/reports/${safeId}/${action}`;
  const response = await fetchJson<ApiReportReviewResponse, ReportReviewPayload>(endpoint, {
    method: 'POST',
    body: payload && Object.keys(payload).length > 0 ? payload : undefined,
  });
  const detail = await getReport(safeId);
  return {
    message:
      response?.message ||
      (action === 'approve' ? 'Reporte aprobado correctamente.' : 'Reporte rechazado correctamente.'),
    report: detail,
  };
}

export const approveReport = (id: string, payload?: ReportReviewPayload) =>
  reviewReport('approve', id, payload);

export const rejectReport = (id: string, payload?: ReportReviewPayload) => reviewReport('reject', id, payload);

export const resubmitReport = async (id: string, payload?: ReportResubmitPayload): Promise<ReportReviewResult> => {
  const safeId = String(id);
  const response = await fetchJson<ApiReportReviewResponse, ReportResubmitPayload>(`/reports/${safeId}/resubmit`, {
    method: 'POST',
    body: payload && Object.keys(payload).length > 0 ? payload : undefined,
  });
  const detail = await getReport(safeId);
  return {
    message: response?.message || 'Reporte reenviado para revisión.',
    report: detail,
  };
};
