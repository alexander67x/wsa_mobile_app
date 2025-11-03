import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Clock, Play, CircleCheck as CheckCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

interface KanbanTask {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  type: 'task' | 'report';
}

interface KanbanData {
  pending: KanbanTask[];
  in_progress: KanbanTask[];
  completed: KanbanTask[];
}

const mockKanbanData: KanbanData = {
  pending: [
    { id: '1', title: 'Tendido de UTP – Nivel 2', project: 'Green Tower', assignee: 'Luis M.', priority: 'high', type: 'task' },
    { id: '2', title: 'Reporte de pruebas de sensores', project: 'Parque Industrial Orión', assignee: 'Karla G.', priority: 'medium', type: 'report' },
    { id: '3', title: 'Montaje de cámaras – Lobby', project: 'Green Tower', assignee: 'Carlos R.', priority: 'medium', type: 'task' },
  ],
  in_progress: [
    { id: '4', title: 'Configuración NVR principal', project: 'Data Center Norte', assignee: 'Ana T.', priority: 'high', type: 'task' },
    { id: '5', title: 'Incidente: caída de enlace PoE', project: 'Campus Corporativo Andina', assignee: 'Pedro L.', priority: 'high', type: 'report' },
  ],
  completed: [
    { id: '6', title: 'Instalación sirenas exteriores', project: 'Green Tower', assignee: 'Roberto S.', priority: 'high', type: 'task' },
    { id: '7', title: 'Avance semanal – Data Center', project: 'Data Center Norte', assignee: 'Lucía M.', priority: 'medium', type: 'report' },
    { id: '8', title: 'Calibración de cámaras PTZ', project: 'Parque Industrial Orión', assignee: 'Diego F.', priority: 'low', type: 'task' },
  ],
};

export default function KanbanScreen() {
  const [kanbanData, setKanbanData] = useState(mockKanbanData);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getColumnIcon = (column: string) => {
    switch (column) {
      case 'pending': return <Clock size={20} color="#F59E0B" />;
      case 'in_progress': return <Play size={20} color="#2563EB" />;
      case 'completed': return <CheckCircle size={20} color="#10B981" />;
      default: return null;
    }
  };

  const getColumnTitle = (column: string) => {
    switch (column) {
      case 'pending': return 'Pendientes';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Finalizadas';
      default: return column;
    }
  };

  const getColumnColor = (column: string) => {
    switch (column) {
      case 'pending': return '#FEF3C7';
      case 'in_progress': return '#DBEAFE';
      case 'completed': return '#DCFCE7';
      default: return '#F3F4F6';
    }
  };

  const renderColumn = (column: keyof KanbanData) => {
    const tasks = kanbanData[column];

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
          {tasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskType}>{task.type === 'report' ? 'REP' : 'TAR'}</Text>
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
              </View>

              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskProject}>{task.project}</Text>

              <View style={styles.taskFooter}>
                <Text style={styles.taskAssignee}>{task.assignee}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addTaskButton}>
            <Plus size={16} color="#6B7280" />
            <Text style={styles.addTaskText}>Agregar {column === 'pending' ? 'tarea' : 'elemento'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tablero Kanban</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kanbanBoard}>
          {renderColumn('pending')}
          {renderColumn('in_progress')}
          {renderColumn('completed')}
        </ScrollView>
      </View>

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Prioridades:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Alta</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Media</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Baja</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#2563EB', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  addTaskButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8 },
  addTaskText: { marginLeft: 6, color: '#6B7280' },
  legendContainer: { padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E5E7EB' },
  legendTitle: { fontWeight: '700', color: '#111827' },
  legendItems: { flexDirection: 'row', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { color: '#6B7280' },
});

