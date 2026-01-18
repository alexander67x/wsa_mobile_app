import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Search, MapPin, Calendar, ChartBar as BarChart3, Plus } from 'lucide-react-native';
import { getMyProjects, getProject } from '@/services/projects';
import { listReports } from '@/services/reports';
import type { Project } from '@/types/domain';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProjects = async () => {
    try {
      const projectList = await getMyProjects();
      const enrichedProjects = await Promise.all(
        projectList.map(async (project) => {
          try {
            const [detail, projectReports] = await Promise.all([
              getProject(project.id),
              listReports(project.id),
            ]);

            const tasks = detail.tasks || [];
            const completedTasks = tasks.filter(task => task.status === 'completed').length;
            const derivedProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : undefined;
            const normalizedProgress = Number(detail.progress);
            const resolvedProgress = Number.isFinite(normalizedProgress)
              ? Math.max(normalizedProgress, derivedProgress ?? 0)
              : derivedProgress ?? project.progress ?? 0;

            return {
              ...project,
              progress: resolvedProgress,
              tasksCount: tasks.length || project.tasksCount || 0,
              reportsCount: projectReports.length || project.reportsCount || 0,
            };
          } catch (error) {
            console.warn('Error loading project detail:', error);
            return {
              ...project,
              tasksCount: project.tasksCount ?? 0,
              reportsCount: project.reportsCount ?? 0,
            };
          }
        })
      );
      setProjects(enrichedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProjects();
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || project.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      default: return 'Desconocido';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Bienvenido</Text>
          <Text style={styles.userName}>Supervisor de Seguridad</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Search size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Activos' },
              { key: 'pending', label: 'Pendientes' },
              { key: 'completed', label: 'Completados' },
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.filterButtonTextActive,
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        style={styles.projectsList}
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando proyectos...</Text>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {projects.length === 0 
                ? 'No hay proyectos disponibles' 
                : 'No se encontraron proyectos con los filtros seleccionados'}
            </Text>
          </View>
        ) : (
          filteredProjects.map(project => {
            const progressValue = Number.isFinite(project.progress) ? Math.round(project.progress) : 0;
            const tasksCount = project.tasksCount ?? 0;
            const reportsCount = project.reportsCount ?? 0;
            const dueDateLabel =
              project.dueDate && !Number.isNaN(new Date(project.dueDate).getTime())
                ? new Date(project.dueDate).toLocaleDateString('es-ES')
                : 'Sin fecha';
            return (
          <TouchableOpacity
            key={project.id}
            style={styles.projectCard}
            onPress={() => router.push({ pathname: '/project-detail', params: { projectId: project.id } })}
          >
            <View style={styles.projectHeader}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{project.name}</Text>
                <View style={styles.projectLocation}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.projectLocationText}>{project.location}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                  {getStatusText(project.status)}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progreso</Text>
                <Text style={styles.progressPercentage}>{progressValue}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressValue}%`, backgroundColor: getStatusColor(project.status) }
                  ]}
                />
              </View>
            </View>
            <View style={styles.projectStats}>
              <View style={styles.statItem}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.statText}>Vence: {dueDateLabel}</Text>
              </View>
              <View style={styles.statItem}>
                <BarChart3 size={16} color="#6B7280" />
                <Text style={styles.statText}>{tasksCount} tareas</Text>
              </View>
              <View style={styles.statItem}>
                <Plus size={16} color="#6B7280" />
                <Text style={styles.statText}>{reportsCount} reportes</Text>
              </View>
            </View>
          </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  headerTop: { marginBottom: 24 },
  greeting: { fontSize: 16, color: '#6B7280' },
  userName: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  searchContainer: { marginBottom: 20 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#1F2937' },
  filterContainer: { marginBottom: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 12, backgroundColor: '#F3F4F6', borderRadius: 20 },
  filterButtonActive: { backgroundColor: COLORS.primary },
  filterButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  filterButtonTextActive: { color: '#FFFFFF' },
  projectsList: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  projectCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  projectLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  projectLocationText: { fontSize: 14, color: '#6B7280', marginLeft: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  progressContainer: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: '#6B7280' },
  progressPercentage: { color: '#1F2937', fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 9999 },
  progressFill: { height: 8, borderRadius: 9999 },
  projectStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: { marginLeft: 6, color: '#6B7280' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
});
