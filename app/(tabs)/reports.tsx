import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Plus, Calendar, FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, ChartBar as BarChart3 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

interface Report {
  id: string;
  title: string;
  project: string;
  date: string;
  type: 'progress' | 'incident' | 'quality';
  status: 'pending' | 'approved' | 'rejected';
  progress?: number;
}

const mockReports: Report[] = [
  {
    id: '1',
    title: 'Reporte de avance semanal',
    project: 'Edificio Residencial Norte',
    date: '2024-02-12',
    type: 'progress',
    status: 'approved',
    progress: 25,
  },
  {
    id: '2',
    title: 'Incidente menor - Piso 2',
    project: 'Centro Comercial Plaza',
    date: '2024-02-10',
    type: 'incident',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Control de calidad materiales',
    project: 'Edificio Residencial Norte',
    date: '2024-02-08',
    type: 'quality',
    status: 'approved',
  },
  {
    id: '4',
    title: 'Reporte de avance - Estructura',
    project: 'Complejo Deportivo',
    date: '2024-02-06',
    type: 'progress',
    status: 'rejected',
    progress: 15,
  },
];

export default function ReportsScreen() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredReports = mockReports.filter(report => {
    if (activeFilter === 'all') return true;
    return report.status === activeFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color="#10B981" />;
      case 'pending': return <Clock size={16} color="#F59E0B" />;
      case 'rejected': return <AlertTriangle size={16} color="#EF4444" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'progress': return <BarChart3 size={20} color="#2563EB" />;
      case 'incident': return <AlertTriangle size={20} color="#F59E0B" />;
      case 'quality': return <CheckCircle size={20} color="#10B981" />;
      default: return <FileText size={20} color="#6B7280" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'progress': return 'Avance';
      case 'incident': return 'Incidencia';
      case 'quality': return 'Calidad';
      default: return 'Otro';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Reportes</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/create-report')}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'Todos', count: mockReports.length },
              { key: 'pending', label: 'Pendientes', count: mockReports.filter(r => r.status === 'pending').length },
              { key: 'approved', label: 'Aprobados', count: mockReports.filter(r => r.status === 'approved').length },
              { key: 'rejected', label: 'Rechazados', count: mockReports.filter(r => r.status === 'rejected').length },
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  activeFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/kanban')}
          >
            <BarChart3 size={20} color="#2563EB" />
            <Text style={styles.quickActionText}>Kanban</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.reportsList} showsVerticalScrollIndicator={false}>
        {filteredReports.map(report => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => router.push({
              pathname: '/report-detail',
              params: { reportId: report.id }
            })}
          >
            <View style={styles.reportHeader}>
              <View style={styles.typeContainer}>
                {getTypeIcon(report.type)}
                <Text style={styles.typeText}>{getTypeText(report.type)}</Text>
              </View>
              <View style={styles.statusContainer}>
                {getStatusIcon(report.status)}
                <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                  {getStatusText(report.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportProject}>{report.project}</Text>

            {report.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Avance reportado</Text>
                  <Text style={styles.progressPercentage}>{report.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${report.progress}%`, backgroundColor: getStatusColor(report.status) }
                    ]} 
                  />
                </View>
              </View>
            )}

            <View style={styles.reportFooter}>
              <View style={styles.dateContainer}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.dateText}>{report.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#2563EB',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  quickActionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  reportsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  reportProject: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6B7280',
  },
});