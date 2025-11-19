import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Plus, Calendar, FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, ChartBar as BarChart3 } from 'lucide-react-native';
import { listReports } from '@/services/reports';
import type { Report } from '@/types/domain';
import { StatusBar } from 'expo-status-bar';

export default function ReportsScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    listReports().then(setReports).catch(() => setReports([]));
  }, []);

  const filteredReports = reports.filter(report => {
    if (activeFilter === 'all') return true;
    return report.status === (activeFilter as any);
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
            onPress={() => router.push('/select-project-type')}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'Todos', count: reports.length },
              { key: 'pending', label: 'Pendientes', count: reports.filter(r => r.status === 'pending').length },
              { key: 'approved', label: 'Aprobados', count: reports.filter(r => r.status === 'approved').length },
              { key: 'rejected', label: 'Rechazados', count: reports.filter(r => r.status === 'rejected').length },
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
                  activeFilter === filter.key && styles.filterButtonTextActive,
                ]}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView style={styles.reportsList} showsVerticalScrollIndicator={false}>
        {filteredReports.map(report => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => router.push({ pathname: '/report-detail', params: { reportId: report.id } })}
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  addButton: { backgroundColor: '#2563EB', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  filterContainer: { marginBottom: 16 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 12, backgroundColor: '#F3F4F6', borderRadius: 20 },
  filterButtonActive: { backgroundColor: '#2563EB' },
  filterButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  filterButtonTextActive: { color: '#FFFFFF' },
  quickActions: { flexDirection: 'row' },
  quickActionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 12 },
  quickActionText: { marginLeft: 8, fontSize: 14, fontWeight: '500', color: '#2563EB' },
  reportsList: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  reportCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeContainer: { flexDirection: 'row', alignItems: 'center' },
  typeText: { marginLeft: 8, color: '#2563EB', fontWeight: '600' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusText: { marginLeft: 6, fontWeight: '600' },
  reportTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  reportProject: { fontSize: 14, color: '#6B7280' },
  progressContainer: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#6B7280' },
  progressPercentage: { fontWeight: '600', color: '#111827' },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 9999, marginTop: 6 },
  progressFill: { height: 8, borderRadius: 9999 },
  reportFooter: { marginTop: 12 },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dateText: { marginLeft: 8, color: '#6B7280' },
});
