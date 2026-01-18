import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Clock, Play, CircleCheck as CheckCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Kanban from '@/services/kanban';
import type { KanbanBoard, KanbanCard } from '@/types/domain';
import { COLORS } from '@/theme';

type ExtendedKanbanCard = KanbanCard & {
  project?: string;
  projectName?: string;
  projectId?: string | number;
  taskId?: string | number;
  task?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  assignee?: string;
  assigneeName?: string;
  priority?: string;
  type?: string;
  status?: string;
  column?: string;
};

type KanbanBoardProps = {
  projectId?: string;
  requireProject?: boolean;
  showBackButton?: boolean;
  headerTitle?: string;
};

const DEFAULT_COLUMNS = ['pending', 'review', 'completed'] as const;
type ColumnKey = typeof DEFAULT_COLUMNS[number];

const TASK_LIST_KEYS = ['tareas', 'tasks', 'tasksforproject', 'tasks_for_project'];
const EXPLICIT_TASK_COLUMNS = ['pendiente', 'revision', 'finalizada'];

const normalizeKey = (value?: string | null): string => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
};

const mapColumnToLane = (value: string): ColumnKey => {
  const normalized = normalizeKey(value);
  if (
    ['pending', 'pendiente', 'pendientes', 'sin_reporte', 'sin_reportes', 'sin_reporte_de_avance', 'sin_avance', 'sin_avances', 'no_reportado', 'no_reportados', 'no_reportes', 'por_enviar', 'por_reportar', 'nuevo', 'nuevos']
      .includes(normalized)
  ) {
    return 'pending';
  }
  if (
    ['review', 'en_revision', 'revision', 'revisado', 'revisados', 'revisada', 'revisadas', 'reenviado', 'reenviados', 'reenviada', 'reenviadas', 'reenvio', 'in_progress', 'proceso', 'por_revision']
      .includes(normalized)
  ) {
    return 'review';
  }
  if (
    ['completed', 'complete', 'finalizado', 'finalizados', 'finalizada', 'finalizadas', 'terminado', 'terminados', 'terminada', 'terminadas', 'cerrado', 'cerrados', 'cerrada', 'cerradas', 'aprobado', 'aprobados', 'aprobada', 'aprobadas', 'rechazado', 'rechazados', 'rechazada', 'rechazadas', 'approved', 'rejected']
      .includes(normalized)
  ) {
    return 'completed';
  }
  return 'pending';
};

const toOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str.length ? str : undefined;
};

const asTaskObject = (card: ExtendedKanbanCard): Record<string, unknown> | undefined => {
  const task = card.task;
  return task && typeof task === 'object' ? task : undefined;
};

const resolveTaskIdFromValue = (value: Record<string, unknown> | null | undefined): string | undefined => {
  if (!value) return undefined;
  return toOptionalString(
    value.id ??
      value.taskId ??
      value.task_id ??
      value.tareaId ??
      value.tarea_id ??
      value.id_tarea ??
      value.cod_tarea ??
      value.codigo ??
      value.taskCode ??
      value.task_code
  );
};

const resolveTaskStatusValue = (value: Record<string, unknown> | null | undefined): string => {
  if (!value) return '';
  return String(value.status ?? value.estado ?? value.state ?? '').toLowerCase();
};

const isTaskCompleted = (status: string): boolean => {
  const normalized = status.toLowerCase();
  return (
    normalized.includes('finaliz') ||
    normalized.includes('complet') ||
    normalized.includes('terminad') ||
    normalized.includes('done') ||
    normalized.includes('closed') ||
    normalized.includes('cerrad')
  );
};

const resolveTaskTitle = (value: Record<string, unknown> | null | undefined, fallback: string): string => {
  if (!value) return fallback;
  return (
    toOptionalString(value.title) ??
    toOptionalString(value.titulo) ??
    toOptionalString(value.nombre) ??
    fallback
  );
};

const getTaskListFromBoard = (rawBoard: KanbanBoard): Array<Record<string, unknown>> | null => {
  if (!rawBoard) return null;
  for (const [columnName, cards] of Object.entries(rawBoard)) {
    const normalized = normalizeKey(columnName);
    if (TASK_LIST_KEYS.includes(normalized) && Array.isArray(cards)) {
      return cards as Array<Record<string, unknown>>;
    }
  }
  return null;
};

const collectReportTaskIds = (rawBoard: KanbanBoard): Set<string> => {
  const reportTaskIds = new Set<string>();
  Object.entries(rawBoard || {}).forEach(([columnName, cards]) => {
    const normalized = normalizeKey(columnName);
    if (TASK_LIST_KEYS.includes(normalized)) return;
    (cards || []).forEach(card => {
      const value = card as Record<string, unknown>;
      const task =
        (value.task as Record<string, unknown> | null | undefined) ??
        (value.tarea as Record<string, unknown> | null | undefined);
      const taskId =
        resolveTaskIdFromValue(task) ??
        resolveTaskIdFromValue(value) ??
        resolveTaskIdFromValue(value.metadata as Record<string, unknown> | null | undefined);
      if (!taskId) return;
      reportTaskIds.add(taskId);
    });
  });
  return reportTaskIds;
};

const hasExplicitTaskColumns = (rawBoard: KanbanBoard): boolean => {
  if (!rawBoard) return false;
  return Object.keys(rawBoard).some(key => EXPLICIT_TASK_COLUMNS.includes(normalizeKey(key)));
};

const groupBoard = (rawBoard: KanbanBoard): Record<ColumnKey, ExtendedKanbanCard[]> => {
  const grouped: Record<ColumnKey, ExtendedKanbanCard[]> = {
    pending: [],
    review: [],
    completed: [],
  };

  if (hasExplicitTaskColumns(rawBoard)) {
    Object.entries(rawBoard || {}).forEach(([columnName, cards]) => {
      if (!EXPLICIT_TASK_COLUMNS.includes(normalizeKey(columnName))) return;
      const lane = mapColumnToLane(columnName);
      (cards || []).forEach(card => grouped[lane].push(card as ExtendedKanbanCard));
    });
    return grouped;
  }

  const tasksList = getTaskListFromBoard(rawBoard);
  if (tasksList) {
    const reportTaskIds = collectReportTaskIds(rawBoard);
    tasksList.forEach((task, index) => {
      const taskId = resolveTaskIdFromValue(task) ?? `task-${index}-${Date.now()}`;
      const status = resolveTaskStatusValue(task);
      const card: ExtendedKanbanCard = {
        id: taskId,
        title: resolveTaskTitle(task, `Tarea ${index + 1}`),
        task: task as Record<string, unknown>,
        taskId,
        status,
      };

      if (isTaskCompleted(status)) {
        grouped.completed.push(card);
      } else if (reportTaskIds.has(taskId)) {
        grouped.review.push(card);
      } else {
        grouped.pending.push(card);
      }
    });
    return grouped;
  }

  Object.entries(rawBoard || {}).forEach(([columnName, cards]) => {
    (cards || []).forEach(card => {
      const hintedColumn =
        (card as ExtendedKanbanCard).column ??
        (card as any).status ??
        (card as any).taskStatus ??
        (card as any).reportStatus ??
        columnName;
      const lane = mapColumnToLane(String(hintedColumn || columnName || ''));
      grouped[lane].push(card as ExtendedKanbanCard);
    });
  });

  return grouped;
};

export default function KanbanBoardScreen({
  projectId,
  requireProject = false,
  showBackButton = true,
  headerTitle = 'Tablero Kanban',
}: KanbanBoardProps) {
  const [board, setBoard] = useState<KanbanBoard>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBoard = useCallback(async () => {
    if (!projectId && requireProject) {
      setLoading(false);
      setBoard({});
      setError('Selecciona un proyecto para ver su tablero.');
      setIsRefreshing(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await Kanban.getBoard(projectId);
      setBoard(data || {});
    } catch (err) {
      console.error('Error fetching Kanban board', err);
      setError('No se pudo cargar el tablero. Intenta nuevamente.');
      setBoard({});
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId, requireProject]);

  useFocusEffect(
    useCallback(() => {
      loadBoard();
      const intervalId = setInterval(() => {
        loadBoard();
      }, 30000);
      return () => {
        clearInterval(intervalId);
      };
    }, [loadBoard])
  );

  const groupedBoard = useMemo(() => groupBoard(board), [board]);
  const columns = DEFAULT_COLUMNS;

  const getPriorityColor = (priority?: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
      case 'alta':
        return '#EF4444';
      case 'medium':
      case 'media':
        return '#F59E0B';
      case 'low':
      case 'baja':
        return '#10B981';
      default: return '#6B7280';
    }
  };

  const getColumnIcon = (column: ColumnKey) => {
    switch (column) {
      case 'pending': return <Clock size={20} color="#F59E0B" />;
      case 'review': return <Play size={20} color={COLORS.primary} />;
      case 'completed': return <CheckCircle size={20} color="#10B981" />;
      default: return null;
    }
  };

  const getColumnTitle = (column: ColumnKey) => {
    switch (column) {
      case 'pending': return 'Pendientes';
      case 'review': return 'En revision';
      case 'completed': return 'Finalizadas';
      default: return column;
    }
  };

  const getColumnColor = (column: ColumnKey) => {
    switch (column) {
      case 'pending': return '#FEF3C7';
      case 'review': return '#DBEAFE';
      case 'completed': return '#DCFCE7';
      default: return '#F3F4F6';
    }
  };

  const getCardProject = (card: ExtendedKanbanCard) => {
    const task = asTaskObject(card);
    if (task) {
      const project = task.project;
      if (project && typeof project === 'object') {
        const name =
          toOptionalString((project as { name?: string }).name) ??
          toOptionalString((project as { nombre?: string }).nombre);
        if (name) return name;
      }
      const projectName =
        toOptionalString((task as { projectName?: string }).projectName) ??
        toOptionalString((task as { project_label?: string }).project_label) ??
        toOptionalString((task as { projectTitle?: string }).projectTitle);
      if (projectName) return projectName;
    }
    const rawProject = (card as any).project;
    if (rawProject && typeof rawProject === 'object') {
      const name = (rawProject as { name?: string; nombre?: string }).name ?? (rawProject as { name?: string; nombre?: string }).nombre;
      if (typeof name === 'string' && name.trim()) return name;
    }
    if (typeof rawProject === 'string' && rawProject.trim()) return rawProject;
    return (
      card.project ??
      card.projectName ??
      (card as any).projectTitle ??
      (card as any).project_label ??
      'Proyecto sin nombre'
    );
  };

  const getCardAssignee = (card: ExtendedKanbanCard) => {
    const task = asTaskObject(card);
    if (task) {
      const assignee =
        toOptionalString((task as { assignee?: string }).assignee) ??
        toOptionalString((task as { assigneeName?: string }).assigneeName) ??
        toOptionalString((task as { assignedTo?: string }).assignedTo) ??
        toOptionalString((task as { assigned_to?: string }).assigned_to) ??
        toOptionalString((task as { responsable?: string }).responsable);
      if (assignee) return assignee;
      const assigneeObj = (task as { assignee?: { name?: string; nombre?: string } }).assignee;
      if (assigneeObj && typeof assigneeObj === 'object') {
        const name =
          toOptionalString((assigneeObj as { name?: string }).name) ??
          toOptionalString((assigneeObj as { nombre?: string }).nombre);
        if (name) return name;
      }
    }
    return (
      card.assignee ??
      card.assigneeName ??
      (card as any).assignedTo ??
      (card as any).assigned_to ??
      card.authorName ??
      'Sin asignar'
    );
  };

  const getCardType = (card: ExtendedKanbanCard) => {
    const task = asTaskObject(card);
    const normalized = (card.type ?? (task as { type?: string })?.type ?? '').toLowerCase();
    if (normalized === 'report' || normalized === 'reporte') return 'report';
    return 'task';
  };

  const getCardPriority = (card: ExtendedKanbanCard): string | undefined => {
    const task = asTaskObject(card);
    const priority =
      card.priority ??
      (card as any).priority ??
      (task as { priority?: string })?.priority ??
      (task as { prioridad?: string })?.prioridad ??
      (task as { priorityLabel?: string })?.priorityLabel ??
      (task as { prioridadLabel?: string })?.prioridadLabel;
    return toOptionalString(priority);
  };

  const resolveProjectId = (card: ExtendedKanbanCard, fallback?: string): string | undefined => {
    const task = asTaskObject(card);
    if (task) {
      const taskProject = (task as { project?: Record<string, unknown> | string }).project;
      if (taskProject && typeof taskProject === 'object') {
        const nested = toOptionalString(
          (taskProject as { id?: string | number }).id ??
          (taskProject as { projectId?: string | number }).projectId ??
          (taskProject as { project_id?: string | number }).project_id ??
          (taskProject as { proyectoId?: string | number }).proyectoId ??
          (taskProject as { proyecto_id?: string | number }).proyecto_id ??
          (taskProject as { id_proyecto?: string | number }).id_proyecto ??
          (taskProject as { cod_proy?: string | number }).cod_proy ??
          (taskProject as { cod_proyecto?: string | number }).cod_proyecto
        );
        if (nested) return nested;
      }
      const directTaskProjectId = toOptionalString(
        (task as { projectId?: string | number }).projectId ??
        (task as { project_id?: string | number }).project_id ??
        (task as { proyectoId?: string | number }).proyectoId ??
        (task as { proyecto_id?: string | number }).proyecto_id ??
        (task as { id_proyecto?: string | number }).id_proyecto ??
        (task as { cod_proy?: string | number }).cod_proy ??
        (task as { cod_proyecto?: string | number }).cod_proyecto
      );
      if (directTaskProjectId) return directTaskProjectId;
    }

    const directProject = (card as any).project;
    if (directProject && typeof directProject === 'object') {
      const nested = toOptionalString(
        (directProject as { id?: string | number }).id ??
        (directProject as { projectId?: string | number }).projectId ??
        (directProject as { project_id?: string | number }).project_id ??
        (directProject as { proyectoId?: string | number }).proyectoId ??
        (directProject as { proyecto_id?: string | number }).proyecto_id ??
        (directProject as { id_proyecto?: string | number }).id_proyecto ??
        (directProject as { cod_proy?: string | number }).cod_proy ??
        (directProject as { cod_proyecto?: string | number }).cod_proyecto
      );
      if (nested) return nested;
    }

    const resolved =
      toOptionalString(card.projectId) ??
      toOptionalString((card as any).projectId) ??
      toOptionalString((card as any).project_id) ??
      toOptionalString((card as any).proyectoId) ??
      toOptionalString((card as any).proyecto_id) ??
      toOptionalString((card as any).id_proyecto) ??
      toOptionalString((card as any).cod_proy) ??
      toOptionalString((card as any).cod_proyecto) ??
      toOptionalString((card.metadata as { projectId?: string | number })?.projectId) ??
      toOptionalString((card.metadata as { project_id?: string | number })?.project_id) ??
      toOptionalString((card.metadata as { proyectoId?: string | number })?.proyectoId) ??
      toOptionalString((card.metadata as { proyecto_id?: string | number })?.proyecto_id) ??
      toOptionalString((card.metadata as { id_proyecto?: string | number })?.id_proyecto) ??
      toOptionalString((card.metadata as { cod_proy?: string | number })?.cod_proy) ??
      toOptionalString((card.metadata as { cod_proyecto?: string | number })?.cod_proyecto);

    if (resolved) return resolved;
    return fallback;
  };

  const resolveTaskId = (card: ExtendedKanbanCard): string | undefined => {
    const task = asTaskObject(card);
    if (task) {
      const nestedTaskId = toOptionalString(
        (task as { id?: string | number }).id ??
        (task as { taskId?: string | number }).taskId ??
        (task as { task_id?: string | number }).task_id ??
        (task as { tareaId?: string | number }).tareaId ??
        (task as { tarea_id?: string | number }).tarea_id ??
        (task as { id_tarea?: string | number }).id_tarea ??
        (task as { cod_tarea?: string | number }).cod_tarea ??
        (task as { codigo?: string | number }).codigo ??
        (task as { taskCode?: string | number }).taskCode ??
        (task as { task_code?: string | number }).task_code
      );
      if (nestedTaskId) return nestedTaskId;
    }
    const directId = toOptionalString(
      card.taskId ??
        (card as any).taskId ??
        (card as any).task_id ??
        (card as any).tareaId ??
        (card as any).tarea_id ??
        (card as any).id_tarea ??
        (card as any).cod_tarea ??
        (card as any).codigo ??
        (card as any).taskCode ??
        (card as any).task_code ??
        (card.metadata as { taskId?: string | number })?.taskId ??
        (card.metadata as { task_id?: string | number })?.task_id ??
        (card.metadata as { tareaId?: string | number })?.tareaId ??
        (card.metadata as { tarea_id?: string | number })?.tarea_id ??
        (card.metadata as { id_tarea?: string | number })?.id_tarea ??
        (card.metadata as { cod_tarea?: string | number })?.cod_tarea ??
        (card.metadata as { codigo?: string | number })?.codigo ??
        (card.metadata as { taskCode?: string | number })?.taskCode ??
        (card.metadata as { task_code?: string | number })?.task_code
    );
    if (directId) return directId;
    return toOptionalString(card.id);
  };

  const handleCardPress = (card: ExtendedKanbanCard) => {
    const resolvedProjectId = resolveProjectId(card, projectId);
    const taskId = resolveTaskId(card);
    if (!resolvedProjectId || !taskId) {
      Alert.alert('Sin detalles disponibles', 'No se encontro informacion suficiente de la tarea.');
      return;
    }
    router.push({
      pathname: '/task-detail',
      params: { projectId: resolvedProjectId, taskId, fromKanban: 'true' },
    });
  };

  const renderColumn = (column: ColumnKey) => {
    const tasks = groupedBoard[column] ?? [];

    return (
      <View key={column} style={styles.column}>
        <View style={[styles.columnHeader, { backgroundColor: getColumnColor(column) }]}>
          {getColumnIcon(column)}
          <Text style={styles.columnTitle}>{getColumnTitle(column)}</Text>
          <View style={styles.columnBadge}>
            <Text style={styles.columnCount}>{tasks.length}</Text>
          </View>
        </View>

        <ScrollView style={styles.columnContent} showsVerticalScrollIndicator={false}>
          {tasks.length ? tasks.map(task => (
            <TouchableOpacity key={task.id} style={styles.taskCard} activeOpacity={0.85} onPress={() => handleCardPress(task)}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskType}>{getCardType(task) === 'report' ? 'REP' : 'TAR'}</Text>
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(getCardPriority(task)) }]} />
              </View>

              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskProject}>{getCardProject(task)}</Text>

              <View style={styles.taskFooter}>
                <Text style={styles.taskAssignee}>{getCardAssignee(task)}</Text>
              </View>
            </TouchableOpacity>
          )) : (
            <Text style={styles.emptyText}>Sin elementos</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.centerText}>Cargando tablero...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.centerText}>{error}</Text>
            <TouchableOpacity onPress={loadBoard} style={styles.retryButton}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kanbanBoard}
            refreshControl={(
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  loadBoard();
                }}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            )}
          >
            {columns.map(column => renderColumn(column))}
          </ScrollView>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  kanbanBoard: { padding: 12 },
  column: { width: 280, marginRight: 12 },
  columnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  columnTitle: { fontWeight: '700', color: '#111827' },
  columnBadge: { backgroundColor: '#FFFFFF', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 },
  columnCount: { fontWeight: '700', color: '#111827' },
  columnContent: { backgroundColor: '#FFFFFF', padding: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  taskCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskType: { fontSize: 12, color: '#6B7280' },
  priorityIndicator: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 6 },
  taskProject: { fontSize: 12, color: '#6B7280' },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  taskAssignee: { color: '#6B7280' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { marginTop: 8, color: '#6B7280', textAlign: 'center' },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.primary },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
});
