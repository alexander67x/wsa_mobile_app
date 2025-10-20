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
    {
      id: '1',
      title: 'Instalación eléctrica piso 3',
      project: 'Edificio Residencial Norte',
      assignee: 'Juan Pérez',
      priority: 'high',
      type: 'task',
    },
    {
      id: '2',
      title: 'Reporte de calidad materiales',
      project: 'Centro Comercial Plaza',
      assignee: 'María García',
      priority: 'medium',
      type: 'report',
    },
    {
      id: '3',
      title: 'Acabados sala principal',
      project: 'Edificio Residencial Norte',
      assignee: 'Carlos Ruiz',
      priority: 'medium',
      type: 'task',
    },
  ],
  in_progress: [
    {
      id: '4',
      title: 'Pintura fachada norte',
      project: 'Complejo Deportivo',
      assignee: 'Ana Torres',
      priority: 'high',
      type: 'task',
    },
    {
      id: '5',
      title: 'Inspección estructural',
      project: 'Oficinas Corporativas',
      assignee: 'Pedro López',
      priority: 'high',
      type: 'report',
    },
  ],
  completed: [
    {
      id: '6',
      title: 'Cimentación completa',
      project: 'Edificio Residencial Norte',
      assignee: 'Roberto Silva',
      priority: 'high',
      type: 'task',
    },
    {
      id: '7',
      title: 'Reporte avance semanal',
      project: 'Centro Comercial Plaza',
      assignee: 'Lucía Mendoza',
      priority: 'medium',
      type: 'report',
    },
    {
      id: '8',
      title: 'Instalación plomería',
      project: 'Complejo Deportivo',
      assignee: 'Diego Fernández',
      priority: 'low',
      type: 'task',
    },
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

  const getTypeIcon = (type: string) => {
    return type === 'report' ? '📊' : '🔧';
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
                <Text style={styles.taskType}>{getTypeIcon(task.type)}</Text>
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tablero Kanban</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kanbanBoard}
        >
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  kanbanBoard: {
    paddingHorizontal: 20,
    gap: 16,
  },
  column: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  columnBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  columnCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  columnContent: {
    padding: 16,
    maxHeight: 500,
  },
  taskCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskType: {
    fontSize: 16,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  taskProject: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskAssignee: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 6,
  },
  addTaskText: {
    fontSize: 12,
    color: '#6B7280',
  },
  legendContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});