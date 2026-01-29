import { fetchJson } from '@/lib/http';
import { Project, ProjectDetail, Report } from '@/types/domain';

type MaybeNumber = number | string | null | undefined;
type MaybeString = string | number | null | undefined;

interface ApiProjectMember {
  id: string;
  name: string;
  role?: string | null;
}

interface ApiProject extends Record<string, unknown> {
  id: string;
  name: string;
  client: string | null;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  budget: number | null;
  members?: ApiProjectMember[];
  progress?: MaybeNumber;
  progressPercentage?: MaybeNumber;
  tasks?: Array<Record<string, unknown>>;
  reports?: Array<Record<string, unknown>>;
  tasksCount?: MaybeNumber;
  tasks_count?: MaybeNumber;
  reportsCount?: MaybeNumber;
  reports_count?: MaybeNumber;
}

interface ApiProjectDetail extends ApiProject {
  descripcion?: string | null;
  description?: string | null;
  resumen?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  dashboard?: Record<string, unknown>;
  tareas?: Array<Record<string, unknown>>;
  reportes?: Array<Record<string, unknown>>;
  materials?: Array<Record<string, unknown>>;
  materiales?: Array<Record<string, unknown>>;
}

const clampPercentage = (value: number): number => Math.min(100, Math.max(0, value));

const coerceNumber = (value: MaybeNumber): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '.').replace(/[^\d+-.]/g, ' ').trim();
    const match = normalized.match(/-?\d+(\.\d+)?/);
    if (!match) return undefined;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const pickNumericField = (source: Record<string, unknown>, keys: string[]): number | undefined => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const numeric = coerceNumber(source[key] as MaybeNumber);
      if (numeric !== undefined) {
        return numeric;
      }
    }
  }
  return undefined;
};

const pickNestedNumericField = (source: Record<string, unknown>, containers: string[], keys: string[]): number | undefined => {
  for (const containerKey of containers) {
    const container = source[containerKey];
    if (container && typeof container === 'object') {
      const numeric = pickNumericField(container as Record<string, unknown>, keys);
      if (numeric !== undefined) {
        return numeric;
      }
    }
  }
  return undefined;
};

const pickArrayField = (source: Record<string, unknown>, keys: string[]): Array<Record<string, unknown>> | null => {
  for (const key of keys) {
    const candidate = source[key];
    if (Array.isArray(candidate)) {
      return candidate as Array<Record<string, unknown>>;
    }
  }
  return null;
};

const pickNestedArrayField = (
  source: Record<string, unknown>,
  containers: string[],
  keys: string[],
): Array<Record<string, unknown>> | null => {
  for (const containerKey of containers) {
    const container = source[containerKey];
    if (container && typeof container === 'object') {
      const arrayValue = pickArrayField(container as Record<string, unknown>, keys);
      if (arrayValue) return arrayValue;
    }
  }
  return null;
};

const coerceString = (value: MaybeString): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const stringified = String(value).trim();
  return stringified.length ? stringified : undefined;
};

const coerceStringList = (value: unknown): string[] => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap(entry => coerceStringList(entry));
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidate = coerceString(
      (obj.name ??
        obj.nombre ??
        obj.fullName ??
        obj.full_name ??
        obj.label ??
        obj.value ??
        obj.usuario ??
        obj.user ??
        obj.responsable ??
        obj.assignee) as MaybeString,
    );
    return candidate ? [candidate] : [];
  }
  const candidate = coerceString(value as MaybeString);
  return candidate ? [candidate] : [];
};

const dedupeStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach(value => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
};

const resolveProgress = (project: ApiProject): number => {
  const raw = project as Record<string, unknown>;
  const candidate =
    pickNumericField(raw, [
      'progress',
      'progressPercentage',
      'progress_percent',
      'percentage',
      'avance',
      'avancePorcentaje',
      'avance_porcentaje',
      'avanceProyecto',
      'projectProgress',
      'porcentaje',
      'porcentaje_avance',
    ]) ??
    pickNestedNumericField(raw, ['summary', 'resumen', 'metrics', 'stats', 'dashboard'], [
      'progress',
      'progressPercentage',
      'percentage',
      'avance',
      'avance_porcentaje',
      'porcentaje_avance',
    ]);
  return clampPercentage(candidate ?? 0);
};

const resolveTasksCount = (project: ApiProject): number => {
  const raw = project as Record<string, unknown>;
  const candidate =
    pickNumericField(raw, [
      'tasksCount',
      'taskCount',
      'tasks_count',
      'totalTasks',
      'total_tasks',
      'tareas',
      'tareasCount',
      'tareas_count',
      'tareas_total',
      'total_tareas',
    ]) ??
    pickNestedNumericField(raw, ['summary', 'resumen', 'metrics', 'stats', 'dashboard'], [
      'tasks',
      'tasksCount',
      'totalTasks',
      'tareas',
      'tareas_total',
    ]);
  if (candidate !== undefined) return Math.max(0, Math.round(candidate));
  const arrayCandidate =
    pickArrayField(raw, ['tasks', 'tareas', 'taskList', 'lista_tareas', 'activities', 'actividades']) ??
    pickNestedArrayField(raw, ['summary', 'resumen', 'metrics', 'stats', 'dashboard'], [
      'tasks',
      'tareas',
      'taskList',
      'lista_tareas',
      'activities',
      'actividades',
    ]);
  if (arrayCandidate) return arrayCandidate.length;
  const tasksArray = Array.isArray(project.tasks) ? project.tasks.length : undefined;
  return tasksArray ?? 0;
};

const resolveReportsCount = (project: ApiProject): number => {
  const raw = project as Record<string, unknown>;
  const candidate =
    pickNumericField(raw, [
      'reportsCount',
      'reportCount',
      'reports_count',
      'reportes',
      'reportesCount',
      'reportes_count',
      'totalReports',
      'total_reports',
      'reportes_total',
      'total_reportes',
    ]) ??
    pickNestedNumericField(raw, ['summary', 'resumen', 'metrics', 'stats', 'dashboard'], [
      'reports',
      'reportsCount',
      'reportes',
      'reportes_total',
      'totalReports',
    ]);
  if (candidate !== undefined) return Math.max(0, Math.round(candidate));
  const arrayCandidate =
    pickArrayField(raw, ['reports', 'reportes', 'reportsList', 'lista_reportes', 'history', 'historial']) ??
    pickNestedArrayField(raw, ['summary', 'resumen', 'metrics', 'stats', 'dashboard'], [
      'reports',
      'reportes',
      'reportsList',
      'lista_reportes',
      'history',
      'historial',
    ]);
  if (arrayCandidate) return arrayCandidate.length;
  const reportsArray = Array.isArray(project.reports) ? project.reports.length : undefined;
  return reportsArray ?? 0;
};

const normalizeTaskStatus = (status?: string): 'pending' | 'in_progress' | 'completed' => {
  const normalized = status?.toLowerCase();
  if (!normalized) return 'pending';
  if (normalized.includes('progress') || normalized.includes('proceso')) return 'in_progress';
  if (
    normalized.includes('complet') ||
    normalized.includes('final') ||
    normalized.includes('terminad') ||
    normalized.includes('done') ||
    normalized.includes('closed') ||
    normalized.includes('cerrad')
  ) {
    return 'completed';
  }
  return 'pending';
};

const normalizeReportStatus = (status?: string): Report['status'] => {
  const normalized = status?.toLowerCase();
  if (!normalized) return 'pending';
  if (normalized.includes('aprob')) return 'approved';
  if (normalized.includes('rechaz')) return 'rejected';
  return 'pending';
};

const normalizeReportType = (type?: string): Report['type'] => {
  const normalized = type?.toLowerCase();
  if (normalized === 'incident' || normalized === 'incidencia') return 'incident';
  if (normalized === 'quality' || normalized === 'calidad') return 'quality';
  return 'progress';
};

const resolveTasksFromDetail = (project: ApiProjectDetail): ProjectDetail['tasks'] => {
  const raw = project as Record<string, unknown>;
  const sourceTasks =
    project.tasks ??
    project.tareas ??
    pickArrayField(raw, ['taskList', 'lista_tareas', 'activities', 'actividades']) ??
    [];
  return sourceTasks.map((task, index) => {
    const taskRaw = task as Record<string, unknown>;
    const id =
      coerceString(taskRaw.id ?? taskRaw.taskId ?? taskRaw.tareaId ?? taskRaw.uuid) ??
      `task-${index}-${Date.now()}`;
    const title =
      coerceString(taskRaw.title ?? taskRaw.titulo ?? taskRaw.nombre) ?? `Tarea ${index + 1}`;
    const description =
      coerceString(
        taskRaw.description ??
          taskRaw.descripcion ??
          taskRaw.detalle ??
          taskRaw.detalles ??
          taskRaw.observaciones,
      ) ?? undefined;
    const assigneeList = dedupeStrings(
      coerceStringList(
        taskRaw.assignees ??
          taskRaw.assignedTo ??
          taskRaw.assigned_to ??
          taskRaw.asignados ??
          taskRaw.asignadosA ??
          taskRaw.asignadoA ??
          taskRaw.assignee ??
          taskRaw.asignado ??
          taskRaw.responsables ??
          taskRaw.responsable ??
          taskRaw.owner,
      ),
    );
    const assignee = assigneeList.join(', ');
    const responsibleList = dedupeStrings(
      coerceStringList(
        taskRaw.responsables ??
          taskRaw.responsable ??
          taskRaw.responsable_nombre ??
          taskRaw.responsableName ??
          taskRaw.encargado ??
          taskRaw.owner,
      ),
    );
    const responsible = responsibleList.length ? responsibleList.join(', ') : undefined;
    const dueDate =
      coerceString(
        taskRaw.dueDate ??
          taskRaw.fechaLimite ??
          taskRaw.fecha_limite ??
          taskRaw.deadline ??
          taskRaw.fechaVencimiento,
      ) ?? '';
    const startDate =
      coerceString(taskRaw.startDate ?? taskRaw.fechaInicio ?? taskRaw.fecha_inicio) ?? undefined;
    const endDate =
      coerceString(taskRaw.endDate ?? taskRaw.fechaFin ?? taskRaw.fecha_fin) ?? undefined;
    const createdAt =
      coerceString(taskRaw.createdAt ?? taskRaw.created_at ?? taskRaw.fechaCreacion) ?? undefined;
    const updatedAt =
      coerceString(taskRaw.updatedAt ?? taskRaw.updated_at ?? taskRaw.fechaActualizacion) ?? undefined;
    const status = normalizeTaskStatus(
      coerceString(taskRaw.status ?? taskRaw.estado ?? taskRaw.state),
    );
    return {
      id,
      title,
      status,
      assignee,
      dueDate,
      description,
      startDate,
      endDate,
      createdAt,
      updatedAt,
      responsible,
    };
  });
};

const resolveReportsFromDetail = (project: ApiProjectDetail): ProjectDetail['reports'] => {
  const raw = project as Record<string, unknown>;
  const sourceReports =
    project.reports ??
    project.reportes ??
    pickArrayField(raw, ['reportsList', 'lista_reportes', 'history', 'historial']) ??
    [];
  return sourceReports.map((report, index) => {
    const reportRaw = report as Record<string, unknown>;
    const id =
      coerceString(
        reportRaw.id ??
          reportRaw.reportId ??
          reportRaw.reporteId ??
          reportRaw.uuid ??
          reportRaw.codigo,
      ) ?? `report-${index}-${Date.now()}`;
    const title =
      coerceString(reportRaw.title ?? reportRaw.titulo ?? reportRaw.nombre) ??
      `Reporte ${index + 1}`;
    const date =
      coerceString(
        reportRaw.date ??
          reportRaw.fecha ??
          reportRaw.fechaReporte ??
          reportRaw.fecha_reporte ??
          reportRaw.created_at,
      ) ?? '';
    const type = normalizeReportType(coerceString(reportRaw.type ?? reportRaw.tipo));
    const status = normalizeReportStatus(coerceString(reportRaw.status ?? reportRaw.estado));
    return {
      id,
      title,
      date,
      type,
      status,
    };
  });
};

const resolveStatus = (project: ApiProject): Project['status'] => {
  const raw = project as Record<string, unknown>;
  const statusValue = typeof raw.status === 'string' ? raw.status : typeof raw.estado === 'string' ? raw.estado : null;
  if (statusValue) {
    const normalized = statusValue.toLowerCase();
    if (normalized.includes('pend')) return 'pending';
    if (normalized.includes('complet') || normalized.includes('final')) return 'completed';
    if (normalized.includes('activo') || normalized.includes('active')) return 'active';
  }
  if (project.endDate && new Date(project.endDate) < new Date()) return 'completed';
  if (project.startDate && new Date(project.startDate) > new Date()) return 'pending';
  return 'active';
};

const mapApiProject = (p: ApiProject): Project => {
  const dueDate = p.deadline || p.endDate || null;
  return {
    id: p.id,
    name: p.name,
    location: p.client || 'Sin ubicación',
    progress: resolveProgress(p),
    status: resolveStatus(p),
    dueDate,
    deadline: dueDate,
    budget: p.budget,
    members:
      p.members?.map(member => ({
        id: member.id,
        name: member.name,
        role: member.role ?? null,
      })) ?? [],
    tasksCount: resolveTasksCount(p),
    reportsCount: resolveReportsCount(p),
  };
};

export async function listProjects(): Promise<Project[]> {
  const apiProjects = await fetchJson<ApiProject[]>('/projects');
  return apiProjects.map(mapApiProject);
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const apiProject = await fetchJson<ApiProjectDetail>(`/projects/${id}`);
  const progress = resolveProgress(apiProject);
  const status = resolveStatus(apiProject);
  const tasks = resolveTasksFromDetail(apiProject);
  const reports = resolveReportsFromDetail(apiProject);

  // Transform API data to app format
  return {
    id: apiProject.id,
    name: apiProject.name,
    location: apiProject.client || 'Sin ubicación',
    progress,
    status,
    startDate: apiProject.startDate,
    endDate: apiProject.endDate,
    deadline: apiProject.deadline || apiProject.endDate,
    budget: apiProject.budget,
    manager: '',
    team: apiProject.members?.length ?? 0,
    members: apiProject.members?.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role ?? null,
    })) ?? [],
    tasks,
    reports,
    materials: [],
  };
}

export interface ProjectStockMaterial {
  id: string;
  materialId: string;
  code: string;
  name: string;
  unit: string;
  available: number;
  reserved: number;
  availableReal: number;
  minAlert: number;
  location?: string;
  unitPrice: number;
  needsRestock: boolean;
}

export interface ProjectStock {
  warehouse: {
    id: string;
    code: string;
    name: string;
    address?: string;
    city?: string;
  } | null;
  materials: ProjectStockMaterial[];
  totalMaterials: number;
  message?: string;
}

export async function getProjectStock(projectId: string): Promise<ProjectStock> {
  const apiStock = await fetchJson<ProjectStock>(`/projects/${projectId}/stock`);
  return apiStock;
}

export async function getMyProjects(): Promise<Project[]> {
  const apiProjects = await fetchJson<ApiProject[]>('/projects/my-projects');
  return apiProjects.map(mapApiProject);
}
