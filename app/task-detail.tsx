import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, FileText, Plus, CheckCircle, Clock, Play } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';
import { getProject } from '@/services/projects';
import { listReports } from '@/services/reports';
import type { ProjectDetail, Report } from '@/types/domain';
import { getRoleSlug } from '@/services/auth';

export default function TaskDetailScreen() {
  const { projectId, taskId, fromKanban } = useLocalSearchParams();
  const roleSlug = getRoleSlug();
  const canCreateProgressReport = roleSlug === 'personal_obra';
  const isIncidentOnlyRole = !canCreateProgressReport;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [task, setTask] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTask = async () => {
    if (!projectId || !taskId) {
      Alert.alert('Error', 'Faltan parámetros necesarios');
      router.back();
      return;
    }

    setIsLoading(true);
    try {
      const [projectData, reportsData] = await Promise.all([
        getProject(String(projectId)),
        listReports(String(projectId), String(taskId)),
      ]);
      setProject(projectData);
      const foundTask = projectData.tasks.find(t => t.id === String(taskId));
      if (foundTask) {
        setTask(foundTask);
        // Los reportes ya vienen filtrados por taskId desde la API
        setReports(reportsData);
      } else {
        Alert.alert('Error', 'Tarea no encontrada');
        router.back();
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la tarea');
      router.back();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [projectId, taskId]);

  if (isLoading || !task || !project) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando tarea...</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return COLORS.primary;
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} color="#10B981" />;
      case 'in_progress': return <Play size={20} color={COLORS.primary} />;
      case 'pending': return <Clock size={20} color="#F59E0B" />;
      default: return <Clock size={20} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En proceso';
      case 'completed': return 'Completada';
      default: return 'Desconocido';
    }
  };
  const isTaskCompleted = task.status === 'completed';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de Tarea</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.taskInfo}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
              {getStatusIcon(task.status)}
              <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                {getStatusText(task.status)}
              </Text>
            </View>
          </View>

          <View style={styles.projectInfo}>
            <Text style={styles.projectLabel}>Proyecto:</Text>
            <Text style={styles.projectName}>{project.name}</Text>
          </View>

          {task.assignee && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Asignado a:</Text>
              <Text style={styles.infoValue}>{task.assignee}</Text>
            </View>
          )}

          {task.dueDate && (
            <View style={styles.infoRow}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Fecha límite:</Text>
              <Text style={styles.infoValue}>{task.dueDate}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadTask();
            }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        )}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de la tarea</Text>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Descripcion</Text>
            <Text style={styles.detailValue}>{task.description || 'Sin descripcion registrada'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Reportes de Avance</Text>
            <Text style={styles.reportCount}>({reports.length})</Text>
          </View>

          {reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay reportes para esta tarea</Text>
              <Text style={styles.emptySubtext}>
                {isIncidentOnlyRole
                  ? 'Registra una incidencia para documentar esta tarea.'
                  : 'Crea un reporte para registrar el avance de esta tarea'}
              </Text>
            </View>
          ) : (
            reports.map(report => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => router.push({ pathname: '/report-detail', params: { reportId: report.id } })}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <View style={[styles.reportStatusBadge, { backgroundColor: report.status === 'approved' ? '#10B98120' : report.status === 'rejected' ? '#EF444420' : '#F59E0B20' }]}>
                    <Text style={[styles.reportStatusText, { color: report.status === 'approved' ? '#10B981' : report.status === 'rejected' ? '#EF4444' : '#F59E0B' }]}>
                      {report.status === 'approved' ? 'Aprobado' : report.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reportDate}>{report.date}</Text>
                {report.authorName && (
                  <Text style={styles.reportAuthor}>Por: {report.authorName}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {fromKanban !== 'true' && !isTaskCompleted && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.createReportButton}
            onPress={() => {
              if (!projectId || !taskId) return;
              const params: Record<string, string> = {
                projectId: String(projectId),
                taskId: String(taskId),
              };
              if (isIncidentOnlyRole) {
                params.sendAsIncident = 'true';
              }
              router.push({ pathname: '/create-report', params });
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createReportButtonText}>
              {isIncidentOnlyRole ? 'Reportar Incidencia' : 'Crear Reporte de Avance'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  taskInfo: { marginTop: 8 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  taskTitle: { flex: 1, color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginRight: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  projectInfo: { marginBottom: 8 },
  projectLabel: { color: '#BFDBFE', fontSize: 14 },
  projectName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  infoLabel: { color: '#BFDBFE', fontSize: 14 },
  infoValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  detailCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  detailValue: { fontSize: 14, color: '#1F2937' },
  reportCount: { fontSize: 16, color: '#6B7280', marginLeft: 'auto' },
  emptyContainer: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  reportCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  reportTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1F2937', marginRight: 12 },
  reportStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  reportStatusText: { fontSize: 12, fontWeight: '600' },
  reportDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  reportAuthor: { fontSize: 14, color: '#6B7280' },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E5E7EB' },
  createReportButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  createReportButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

