import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getProject } from '@/services/projects';
import { listReports } from '@/services/reports';
import type { ProjectDetail } from '@/types/domain';
import { ArrowLeft, Calendar, MapPin, Users, User, ChartBar as BarChart3, FileText } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';

export default function ProjectDetailScreen() {
  const { projectId } = useLocalSearchParams();
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'reports' | 'team'>('tasks');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProject = async () => {
    try {
      const targetId = String(projectId || '1');
      const [project, projectReports] = await Promise.all([
        getProject(targetId),
        listReports(targetId),
      ]);
      setData({ ...project, reports: projectReports });
    } catch {
      setData(null);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProject();
  };

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando...</Text>
      </View>
    );
  }
  const members = data.members ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'approved': case 'delivered': return '#10B981';
      case 'in_progress': case 'pending': case 'requested': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return 'Sin fecha';
    try {
      return new Date(value).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const formatBudget = (value: number | null | undefined) => {
    if (value == null) return 'Sin registro';
    if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
      }).format(value);
    }
    return `S/ ${value.toFixed(2)}`;
  };

  const getStatusText = (status: string, type: string) => {
    if (type === 'task') {
      switch (status) {
        case 'pending': return 'Pendiente';
        case 'in_progress': return 'En proceso';
        case 'completed': return 'Completada';
      }
    }
    if (type === 'report') {
      switch (status) {
        case 'pending': return 'Pendiente';
        case 'approved': return 'Aprobado';
        case 'rejected': return 'Rechazado';
      }
    }
    if (type === 'material') {
      switch (status) {
        case 'requested': return 'Solicitado';
        case 'approved': return 'Aprobado';
        case 'delivered': return 'Entregado';
      }
    }
    return status;
  };


  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del Proyecto</Text>
        </View>

        <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{data.name}</Text>
          <View style={styles.projectLocation}>
            <MapPin size={16} color={COLORS.primaryLight} />
            <Text style={styles.projectLocationText}>{data.location}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso del proyecto</Text>
            <Text style={styles.progressPercentage}>{data.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${data.progress}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{formatDate(data.deadline || data.endDate)}</Text>
            <Text style={styles.statLabel}>Fecha límite</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>Miembros</Text>
          </View>
          <View style={styles.statCard}>
            <BarChart3 size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{formatBudget(data.budget)}</Text>
            <Text style={styles.statLabel}>Presupuesto</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {[
            { key: 'tasks', label: 'Tareas', count: data.tasks.length },
            { key: 'reports', label: 'Reportes', count: data.reports.length },
            { key: 'team', label: 'Equipo', count: members.length || 1 },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === (tab.key as any) && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabText, activeTab === (tab.key as any) && styles.activeTabText]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          )}
        >
          {(() => {
            switch (activeTab) {
              case 'tasks':
                return data.tasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.listItem}
                    onPress={() => router.push({
                      pathname: '/task-detail',
                      params: { projectId: String(projectId), taskId: task.id }
                    })}
                  >
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemTitle}>{task.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                          {getStatusText(task.status, 'task')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.listItemSubtitle}>Asignado a: {task.assignee || 'Sin asignar'}</Text>
                    <Text style={styles.listItemDate}>Vence: {task.dueDate || 'Sin fecha'}</Text>
                  </TouchableOpacity>
                ));
              case 'reports':
                return data.reports.map(report => (
                  <TouchableOpacity key={report.id} style={styles.listItem} onPress={() => router.push({ pathname: '/report-detail', params: { reportId: report.id } })}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemTitle}>{report.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                          {getStatusText(report.status, 'report')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.listItemSubtitle}>Tipo: {report.type}</Text>
                    <Text style={styles.listItemDate}>{report.date}</Text>
                  </TouchableOpacity>
                ));
              case 'team':
                return (
                  <View style={styles.teamContent}>
                    <View style={styles.infoCard}>
                      <Text style={styles.sectionTitle}>Cronograma</Text>
                      <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Inicio</Text>
                          <Text style={styles.infoValue}>{formatDate(data.startDate)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Fin estimado</Text>
                          <Text style={styles.infoValue}>{formatDate(data.endDate)}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.infoCard}>
                      <Text style={styles.sectionTitle}>Equipo asignado</Text>
                      {members.length === 0 ? (
                        <Text style={styles.emptyMembersText}>Aún no hay colaboradores asignados.</Text>
                      ) : (
                        members.map(member => (
                          <View key={member.id} style={styles.memberRow}>
                            <View style={styles.memberAvatar}>
                              <User size={16} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.memberName}>{member.name}</Text>
                              {member.role ? <Text style={styles.memberRole}>{member.role}</Text> : null}
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                );
            }
          })()}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push({ pathname: '/kanban', params: { projectId: data.id } })}
          >
            <FileText size={20} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Ver Kanban</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  projectInfo: { marginTop: 16 },
  projectName: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  projectLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  projectLocationText: { color: COLORS.primaryLight, marginLeft: 6 },
  progressContainer: { marginTop: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#E5E7EB' },
  progressPercentage: { color: '#FFFFFF', fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: COLORS.primaryLight, borderRadius: 9999, marginTop: 6 },
  progressFill: { height: 8, backgroundColor: COLORS.primaryDark, borderRadius: 9999 },
  content: { flex: 1, padding: 16 },
  statsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, marginHorizontal: 4, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  infoCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  memberRole: { fontSize: 12, color: '#6B7280' },
  emptyMembersText: { fontSize: 13, color: '#9CA3AF' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#FFFFFF' },
  tabContent: { flex: 1, marginBottom: 20 },
  teamContent: { },
  listItem: { backgroundColor: '#FFFFFF', padding: 16, marginBottom: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  listItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  listItemTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1, marginRight: 12 },
  listItemSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  listItemDate: { fontSize: 12, color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 12, paddingBottom: 20 },
  actionButton: { flex: 1, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: COLORS.primary },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  secondaryButtonText: { color: COLORS.primary },
});
