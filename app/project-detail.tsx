import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getProject } from '@/services/projects';
import type { ProjectDetail } from '@/types/domain';
import { ArrowLeft, Calendar, MapPin, Users, ChartBar as BarChart3, Plus, FileText } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

interface TabData {
  tasks: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignee: string;
    dueDate: string;
  }>;
  reports: Array<{
    id: string;
    title: string;
    date: string;
    type: 'progress' | 'incident' | 'quality';
    status: 'pending' | 'approved' | 'rejected';
  }>;
  materials: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    status: 'requested' | 'approved' | 'delivered';
  }>;
}

export default function ProjectDetailScreen() {
  const { projectId } = useLocalSearchParams();
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'reports' | 'materials'>('tasks');

  useEffect(() => {
    getProject(String(projectId || '1')).then(setData).catch(() => setData(null));
  }, [projectId]);

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'approved': case 'delivered': return '#10B981';
      case 'in_progress': case 'pending': case 'requested': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return mockTabData.tasks.map(task => (
          <View key={task.id} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <Text style={styles.listItemTitle}>{task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                  {getStatusText(task.status, 'task')}
                </Text>
              </View>
            </View>
            <Text style={styles.listItemSubtitle}>Asignado a: {task.assignee}</Text>
            <Text style={styles.listItemDate}>Vence: {task.dueDate}</Text>
          </View>
        ));

      case 'reports':
        return mockTabData.reports.map(report => (
          <TouchableOpacity
            key={report.id}
            style={styles.listItem}
            onPress={() => router.push({ pathname: '/report-detail', params: { reportId: report.id } })}
          >
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

      case 'materials':
        return mockTabData.materials.map(material => (
          <View key={material.id} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <Text style={styles.listItemTitle}>{material.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(material.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(material.status) }]}>
                  {getStatusText(material.status, 'material')}
                </Text>
              </View>
            </View>
            <Text style={styles.listItemSubtitle}>
              Cantidad: {material.quantity} {material.unit}
            </Text>
          </View>
        ));
    }
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
            <MapPin size={16} color="#BFDBFE" />
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
            <Calendar size={20} color="#2563EB" />
            <Text style={styles.statValue}>{data.endDate}</Text>
            <Text style={styles.statLabel}>Fecha límite</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color="#2563EB" />
            <Text style={styles.statValue}>{data.team}</Text>
            <Text style={styles.statLabel}>Miembros</Text>
          </View>
          <View style={styles.statCard}>
            <BarChart3 size={20} color="#2563EB" />
            <Text style={styles.statValue}>{data.budget}</Text>
            <Text style={styles.statLabel}>Presupuesto</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {[
            { key: 'tasks', label: 'Tareas', count: data.tasks.length },
            { key: 'reports', label: 'Reportes', count: data.reports.length },
            { key: 'materials', label: 'Equipos', count: data.materials.length },
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

        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {(() => {
            switch (activeTab) {
              case 'tasks':
                return data.tasks.map(task => (
                  <View key={task.id} style={styles.listItem}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemTitle}>{task.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                          {getStatusText(task.status, 'task')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.listItemSubtitle}>Asignado a: {task.assignee}</Text>
                    <Text style={styles.listItemDate}>Vence: {task.dueDate}</Text>
                  </View>
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
              case 'materials':
                return data.materials.map(material => (
                  <View key={material.id} style={styles.listItem}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemTitle}>{material.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(material.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(material.status) }]}>
                          {getStatusText(material.status, 'material')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.listItemSubtitle}>Cantidad: {material.quantity} {material.unit}</Text>
                  </View>
                ));
            }
          })()}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/create-report')}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Crear Reporte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => router.push('/kanban')}>
            <FileText size={20} color="#2563EB" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Ver Kanban</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#2563EB', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  projectInfo: { marginTop: 16 },
  projectName: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  projectLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  projectLocationText: { color: '#BFDBFE', marginLeft: 6 },
  progressContainer: { marginTop: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#E5E7EB' },
  progressPercentage: { color: '#FFFFFF', fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: '#93C5FD', borderRadius: 9999, marginTop: 6 },
  progressFill: { height: 8, backgroundColor: '#1D4ED8', borderRadius: 9999 },
  content: { flex: 1, padding: 16 },
  statsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, marginHorizontal: 4, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#FFFFFF' },
  tabContent: { flex: 1, marginBottom: 20 },
  listItem: { backgroundColor: '#FFFFFF', padding: 16, marginBottom: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  listItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  listItemTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1, marginRight: 12 },
  listItemSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  listItemDate: { fontSize: 12, color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 12, paddingBottom: 20 },
  actionButton: { flex: 1, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#2563EB' },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  secondaryButtonText: { color: '#2563EB' },
});
