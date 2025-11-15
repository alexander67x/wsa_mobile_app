import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Plus, Package, Clock, CircleCheck as CheckCircle, Circle as XCircle, Calendar } from 'lucide-react-native';
import { listMaterialRequests } from '@/services/materials';
import type { MaterialRequest } from '@/types/domain';
import { StatusBar } from 'expo-status-bar';

export default function MaterialsScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [requests, setRequests] = useState<MaterialRequest[]>([]);

  useEffect(() => {
    listMaterialRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  const filteredRequests = requests.filter(request => {
    if (activeFilter === 'all') return true;
    return request.status === (activeFilter as any);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#10B981';
      case 'approved': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} color="#10B981" />;
      case 'approved': return <Package size={16} color="#3B82F6" />;
      case 'pending': return <Clock size={16} color="#F59E0B" />;
      case 'rejected': return <XCircle size={16} color="#EF4444" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregado';
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Normal';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Solicitudes de Equipos de Seguridad</Text>
          <Text style={styles.subtitle}>
            Revisa el estado de cada pedido y crea nuevas solicitudes cuando lo necesites.
          </Text>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push('/request-material')}
          >
            <Plus size={20} color="#111827" />
            <Text style={styles.primaryActionText}>Nueva solicitud</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'Todos', count: requests.length },
              { key: 'pending', label: 'Pendientes', count: requests.filter(r => r.status === 'pending').length },
              { key: 'approved', label: 'Aprobados', count: requests.filter(r => r.status === 'approved').length },
              { key: 'delivered', label: 'Entregados', count: requests.filter(r => r.status === 'delivered').length },
              { key: 'rejected', label: 'Rechazados', count: requests.filter(r => r.status === 'rejected').length },
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

      <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
        {filteredRequests.map(request => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.materialInfo}>
                <Text style={styles.materialName}>{request.materialName}</Text>
                <Text style={styles.projectName}>{request.projectName}</Text>
              </View>
              <View style={styles.statusBadge}>
                {getStatusIcon(request.status)}
                <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                  {getStatusText(request.status)}
                </Text>
              </View>
            </View>

            <View style={styles.quantityContainer}>
              <View style={styles.quantityInfo}>
                <Package size={16} color="#6B7280" />
                <Text style={styles.quantityText}>
                  {request.quantity} {request.unit}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(request.priority) }]}>
                  {getPriorityText(request.priority)}
                </Text>
              </View>
            </View>

            {request.observations && (
              <View style={styles.observationsContainer}>
                <Text style={styles.observationsLabel}>Observaciones:</Text>
                <Text style={styles.observationsText}>{request.observations}</Text>
              </View>
            )}

            <View style={styles.requestFooter}>
              <View style={styles.dateContainer}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.dateText}>Solicitado: {request.requestDate}</Text>
              </View>
            </View>
          </View>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  primaryAction: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCD34D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryActionText: {
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  filterContainer: {
    marginBottom: 8,
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
  requestsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  projectName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  quantityContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    marginLeft: 8,
    color: '#374151',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  observationsContainer: {
    marginTop: 12,
  },
  observationsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  observationsText: {
    color: '#374151',
  },
  requestFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 8,
    color: '#6B7280',
  },
});
