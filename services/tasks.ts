import { fetchJson } from '@/lib/http';
import type { TaskDetail } from '@/types/domain';

type MaybeString = string | number | null | undefined;

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

const normalizeTaskStatus = (value?: string): TaskDetail['status'] => {
  const normalized = value?.toLowerCase();
  if (!normalized) return 'pending';
  if (normalized.includes('en_proceso') || normalized.includes('in_progress') || normalized.includes('proceso')) {
    return 'in_progress';
  }
  if (normalized.includes('complet') || normalized.includes('final') || normalized.includes('done')) {
    return 'completed';
  }
  return 'pending';
};

const pickProjectName = (raw: Record<string, unknown>): string | undefined => {
  const project = raw.project as Record<string, unknown> | null | undefined;
  return (
    coerceString(raw.projectName as MaybeString) ??
    coerceString(raw.project_name as MaybeString) ??
    coerceString(raw.project as MaybeString) ??
    (project ? coerceString(project.name as MaybeString) ?? coerceString(project.nombre as MaybeString) : undefined)
  );
};

const pickProjectId = (raw: Record<string, unknown>): string | undefined => {
  const project = raw.project as Record<string, unknown> | null | undefined;
  return (
    coerceString(raw.projectId as MaybeString) ??
    coerceString(raw.project_id as MaybeString) ??
    coerceString(raw.proyectoId as MaybeString) ??
    (project ? coerceString(project.id as MaybeString) ?? coerceString(project.projectId as MaybeString) : undefined)
  );
};

export async function getTask(id: string): Promise<{ task: TaskDetail; raw: Record<string, unknown> }> {
  const apiTask = await fetchJson<Record<string, unknown>>(`/tasks/${id}`);

  const assigneeList = dedupeStrings(
    coerceStringList(
      apiTask.assignees ??
        apiTask.assignedTo ??
        apiTask.assigned_to ??
        apiTask.asignados ??
        apiTask.asignadosA ??
        apiTask.asignadoA ??
        apiTask.assignee ??
        apiTask.asignado ??
        apiTask.responsables ??
        apiTask.responsable ??
        apiTask.owner,
    ),
  );
  const responsibleList = dedupeStrings(
    coerceStringList(
      apiTask.responsables ??
        apiTask.responsable ??
        apiTask.responsable_nombre ??
        apiTask.responsableName ??
        apiTask.encargado ??
        apiTask.owner,
    ),
  );

  const task: TaskDetail = {
    id: String(
      apiTask.id ??
        apiTask.taskId ??
        apiTask.tareaId ??
        apiTask.uuid ??
        id,
    ),
    title:
      coerceString(apiTask.title as MaybeString) ??
      coerceString(apiTask.titulo as MaybeString) ??
      coerceString(apiTask.nombre as MaybeString) ??
      `Tarea ${id}`,
    status: normalizeTaskStatus(coerceString(apiTask.status as MaybeString) ?? coerceString(apiTask.estado as MaybeString)),
    assignee: assigneeList.join(', '),
    responsible: responsibleList.length ? responsibleList.join(', ') : undefined,
    dueDate:
      coerceString(apiTask.dueDate as MaybeString) ??
      coerceString(apiTask.fechaLimite as MaybeString) ??
      coerceString(apiTask.fecha_limite as MaybeString) ??
      coerceString(apiTask.deadline as MaybeString) ??
      coerceString(apiTask.fechaVencimiento as MaybeString) ??
      '',
    description:
      coerceString(apiTask.description as MaybeString) ??
      coerceString(apiTask.descripcion as MaybeString) ??
      coerceString(apiTask.detalle as MaybeString) ??
      coerceString(apiTask.detalles as MaybeString) ??
      coerceString(apiTask.observaciones as MaybeString),
    startDate:
      coerceString(apiTask.startDate as MaybeString) ??
      coerceString(apiTask.fechaInicio as MaybeString) ??
      coerceString(apiTask.fecha_inicio as MaybeString),
    endDate:
      coerceString(apiTask.endDate as MaybeString) ??
      coerceString(apiTask.fechaFin as MaybeString) ??
      coerceString(apiTask.fecha_fin as MaybeString),
    createdAt:
      coerceString(apiTask.createdAt as MaybeString) ??
      coerceString(apiTask.created_at as MaybeString) ??
      coerceString(apiTask.fechaCreacion as MaybeString),
    updatedAt:
      coerceString(apiTask.updatedAt as MaybeString) ??
      coerceString(apiTask.updated_at as MaybeString) ??
      coerceString(apiTask.fechaActualizacion as MaybeString),
    projectId: pickProjectId(apiTask),
    projectName: pickProjectName(apiTask),
  };

  return { task, raw: apiTask };
}
