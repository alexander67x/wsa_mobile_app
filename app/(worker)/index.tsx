import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Calendar, ChartBar as BarChart3, Plus } from 'lucide-react-native';
import { getProject } from '@/services/projects';
import type { ProjectDetail } from '@/types/domain';

export default function WorkerHome() {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  useEffect(() => { getProject('1').then(setProject).catch(() => setProject(null)); }, []);

  if (!project) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Cargando...</Text></View>;
  }

  const statusColor = '#10B981';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{project.name}</Text>
        <View style={styles.projectLocation}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.projectLocationText}>{project.location}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Progreso</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${project.progress}%`, backgroundColor: statusColor }]} /></View>
          <Text style={styles.progressPercent}>{project.progress}%</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Calendar size={18} color="#2563EB" /><Text style={styles.statValue}>{project.endDate}</Text><Text style={styles.statLabel}>Fecha límite</Text></View>
            <View style={styles.statItem}><BarChart3 size={18} color="#2563EB" /><Text style={styles.statValue}>{project.tasks.length}</Text><Text style={styles.statLabel}>Tareas</Text></View>
            <View style={styles.statItem}><Plus size={18} color="#2563EB" /><Text style={styles.statValue}>{project.reports.length}</Text><Text style={styles.statLabel}>Reportes</Text></View>
          </View>
          {/* Botón de reportes del equipo eliminado por redundante (se ven en Kanban) */}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Equipo</Text>
          <Text style={styles.text}>Supervisor: {project.manager}</Text>
          <Text style={styles.text}>Miembros: {project.team}</Text>
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(worker)/team')}>
            <Text style={styles.linkText}>Ver integrantes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  projectLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  projectLocationText: { fontSize: 14, color: '#6B7280', marginLeft: 6 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  progressBar: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 9999 },
  progressFill: { height: 10, borderRadius: 9999 },
  progressPercent: { marginTop: 6, color: '#6B7280' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: '#1F2937', fontWeight: '600', marginTop: 6 },
  statLabel: { color: '#6B7280', fontSize: 12 },
  text: { color: '#1F2937' },
});
