import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ClipboardList, FileText } from 'lucide-react-native';
import { getMyProjects, getProject } from '@/services/projects';
import { listReports } from '@/services/reports';
import { ensureEmployeeId, getUser } from '@/services/auth';
import type { Project, Report } from '@/types/domain';
import { COLORS } from '@/theme';
import { router } from 'expo-router';

type AssignedTask = {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
  dueDate?: string;
  projectId: string;
  projectName: string;
};

export default function WorkerAssignments() {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = async () => {
    try {
      setError(null);
      const [projects, reportsData] = await Promise.all([getMyProjects(), listReports()]);
      const user = getUser();
      const employeeId = await ensureEmployeeId();
      const normalizedName = user?.name?.toLowerCase().trim();
      const normalizedEmployeeId = employeeId ? String(employeeId).toLowerCase() : undefined;

      const details = await Promise.all(
        projects.map(async (project) => {
          try {
            const detail = await getProject(project.id);
            return { project, detail };
          } catch {
            return null;
          }
        }),
      );

      const assignedTasks: AssignedTask[] = [];
      details.forEach((entry) => {
        if (!entry) return;
        const { project, detail } = entry;
        detail.tasks.forEach((task) => {
          const assignee = (task.assignee || task.responsible || '').toLowerCase().trim();
          const matchesName = normalizedName ? assignee.includes(normalizedName) : false;
          const matchesEmployeeId = normalizedEmployeeId ? assignee.includes(normalizedEmployeeId) : false;
          if (!matchesName && !matchesEmployeeId) return;

          assignedTasks.push({
            id: String(task.id),
            title: task.title,
            status: task.status,
            assignee: task.assignee || task.responsible || undefined,
            dueDate: task.dueDate || undefined,
            projectId: String(project.id),
            projectName: project.name,
          });
        });
      });

      setTasks(assignedTasks);
      setReports(reportsData);
    } catch (err) {
      console.error('Error loading assignments', err);
      setError('No se pudieron cargar tus asignaciones');
      setTasks([]);
      setReports([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAssignments();
  };

  const getTaskStatusText = (status: AssignedTask['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En proceso';
      case 'completed':
        return 'Completada';
      default:
        return 'Desconocido';
    }
  };

  const getTaskStatusColor = (status: AssignedTask['status']) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return COLORS.primary;
      case 'completed':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Sin fecha';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-ES');
    }
    return value;
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando asignaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis reportes y tareas asignadas</Text>
      </View>
      <ScrollView
        style={styles.content}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        )}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ClipboardList size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Tareas asignadas</Text>
            <Text style={styles.sectionCount}>{tasks.length}</Text>
          </View>
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>No tienes tareas asignadas</Text>
          ) : (
            tasks.map((task) => (
              <TouchableOpacity
                key={`${task.projectId}-${task.id}`}
                style={styles.card}
                onPress={() => router.push({ pathname: '/task-detail', params: { projectId: task.projectId, taskId: task.id } })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{task.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: getTaskStatusColor(task.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getTaskStatusColor(task.status) }]}>
                      {getTaskStatusText(task.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>Proyecto: {task.projectName}</Text>
                <Text style={styles.cardMeta}>Fecha limite: {formatDate(task.dueDate)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Mis reportes</Text>
            <Text style={styles.sectionCount}>{reports.length}</Text>
          </View>
          {reports.length === 0 ? (
            <Text style={styles.emptyText}>No tienes reportes registrados</Text>
          ) : (
            reports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/report-detail', params: { reportId: report.id } })}
              >
                <Text style={styles.cardTitle}>{report.title}</Text>
                <Text style={styles.cardMeta}>{report.project}</Text>
                <Text style={styles.cardMeta}>Fecha: {report.date || 'Sin fecha'}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionCount: { marginLeft: 'auto', fontSize: 14, color: '#6B7280' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardMeta: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  emptyText: { color: '#6B7280', fontSize: 13 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  error: { color: '#DC2626', marginBottom: 12 },
});
