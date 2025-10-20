import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

const mockProjectData = {
  id: '1',
  name: 'Edificio Residencial Norte',
  location: 'Av. Principal 123, Lima',
  progress: 75,
  status: 'active',
  startDate: '2023-10-01',
  endDate: '2024-03-15',
  budget: '$2,500,000',
  manager: 'Ing. Carlos Ruiz',
  team: 12,
};

const mockTabData: TabData = {
  tasks: [
    { id: '1', title: 'Instalación eléctrica piso 3', status: 'in_progress', assignee: 'Juan Pérez', dueDate: '2024-02-15' },
    { id: '2', title: 'Acabados sala principal', status: 'pending', assignee: 'María García', dueDate: '2024-02-20' },
    { id: '3', title: 'Revisión estructural', status: 'completed', assignee: 'Pedro López', dueDate: '2024-02-10' },
  ],
  reports: [
    { id: '1', title: 'Reporte de avance semanal', date: '2024-02-12', type: 'progress', status: 'approved' },
    { id: '2', title: 'Incidente menor - Piso 2', date: '2024-02-10', type: 'incident', status: 'pending' },
    { id: '3', title: 'Control de calidad materiales', date: '2024-02-08', type: 'quality', status: 'approved' },
  ],
  materials: [
    { id: '1', name: 'Cemento Portland', quantity: 50, unit: 'sacos', status: 'delivered' },
    { id: '2', name: 'Varillas de acero 3/8"', quantity: 100, unit: 'unidades', status: 'approved' },
    { id: '3', name: 'Cables eléctricos 12 AWG', quantity: 200, unit: 'metros', status: 'requested' },
  ],
};

export default function ProjectDetailScreen() {
  const { projectId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'tasks' | 'reports' | 'materials'>('tasks');

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
            onPress={() => router.push({
              pathname: '/report-detail',
              params: { reportId: report.id }
            })}
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del Proyecto</Text>
        </View>

        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{mockProjectData.name}</Text>
          <View style={styles.projectLocation}>
            <MapPin size={16} color="#BFDBFE" />
            <Text style={styles.projectLocationText}>{mockProjectData.location}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso del proyecto</Text>
            <Text style={styles.progressPercentage}>{mockProjectData.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${mockProjectData.progress}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Calendar size={20} color="#2563EB" />
            <Text style={styles.statValue}>{mockProjectData.endDate}</Text>
            <Text style={styles.statLabel}>Fecha límite</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color="#2563EB" />
            <Text style={styles.statValue}>{mockProjectData.team}</Text>
            <Text style={styles.statLabel}>Miembros</Text>
          </View>
          <View style={styles.statCard}>
            <BarChart3 size={20} color="#2563EB" />
            <Text style={styles.statValue}>{mockProjectData.budget}</Text>
            <Text style={styles.statLabel}>Presupuesto</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {[
            { key: 'tasks', label: 'Tareas', count: mockTabData.tasks.length },
            { key: 'reports', label: 'Reportes', count: mockTabData.reports.length },
            { key: 'materials', label: 'Materiales', count: mockTabData.materials.length },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {renderTabContent()}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/create-report')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Crear Reporte</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push('/request-material')}
          >
            <FileText size={20} color="#2563EB" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Solicitar Material
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  projectInfo: {
    marginBottom: 24,
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  projectLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectLocationText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#BFDBFE',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    color: '#BFDBFE',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  listItemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#2563EB',
  },
});