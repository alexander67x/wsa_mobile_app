import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Plus,
  Package,
  Clock,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  Calendar,
  CircleDot,
  Truck,
} from 'lucide-react-native';
import { listMaterialRequests } from '@/services/materials';
import type { MaterialRequest } from '@/types/domain';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';

type FilterKey = 'all' | MaterialRequest['status'];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobados' },
  { key: 'sent', label: 'Enviados' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'rejected', label: 'Rechazados' },
  { key: 'draft', label: 'Borradores' },
];

export default function MaterialsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const data = await listMaterialRequests();
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = requests.filter(request => {
    if (activeFilter === 'all') return true;
    return request.status === activeFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#10B981';
      case 'approved': return COLORS.primaryMuted;
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      case 'sent': return COLORS.primary;
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} color="#10B981" />;
      case 'approved': return <Package size={16} color={COLORS.primaryMuted} />;
      case 'pending': return <Clock size={16} color="#F59E0B" />;
      case 'rejected': return <XCircle size={16} color="#EF4444" />;
      case 'sent': return <Truck size={16} color={COLORS.primary} />;
      case 'draft': return <CircleDot size={16} color="#6B7280" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregado';
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      case 'sent': return 'Enviado';
      case 'draft': return 'Borrador';
      default: return 'Desconocido';
    }
  };

  const getUrgencyColor = (urgent: boolean) => (urgent ? '#EF4444' : '#6B7280');
  const getUrgencyText = (urgent: boolean) => (urgent ? 'Urgente' : 'Normal');

  const renderProgress = (progress?: number | null, approved?: number, delivered?: number) => {
    if (progress === null || progress === undefined) {
      if (!approved || approved <= 0) return null;
      progress = Math.min(100, Math.round(((delivered ?? 0) / approved) * 100));
    }

    const safeProgress = Math.min(100, Math.max(0, progress));

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Avance de entrega</Text>
          <Text style={styles.progressValue}>{safeProgress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${safeProgress}%` }]} />
        </View>
      </View>
    );
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
            {FILTERS.map(filter => {
              const count =
                filter.key === 'all'
                  ? requests.length
                  : requests.filter(r => r.status === filter.key).length;
              return (
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
                    {filter.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.requestsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {filteredRequests.map(request => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              activeOpacity={0.9}
              onPress={() => {
                if (!request.id) return;
                router.push({
                  pathname: '/material-request-detail',
                  params: { id: String(request.id) },
                } as any);
              }}
            >
              <View style={styles.requestHeader}>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{request.materialName || 'Solicitud de materiales'}</Text>
                  <Text style={styles.projectName}>{request.projectName}</Text>
                </View>
                <View style={styles.statusBadge}>
                  {getStatusIcon(request.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {request.statusLabel || getStatusText(request.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.quantityContainer}>
                <View style={styles.quantityInfo}>
                  <Package size={16} color="#6B7280" />
                  <Text style={styles.quantityText}>
                    {(request.quantity ?? request.totalApprovedQuantity ?? request.totalDeliveredQuantity ?? 0)}{' '}
                    {request.unit || 'unidades'}
                  </Text>
                </View>
                <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(request.urgent)}20` }]}>
                  <Text style={[styles.urgencyText, { color: getUrgencyColor(request.urgent) }]}>
                    {getUrgencyText(request.urgent)}
                  </Text>
                </View>
              </View>

              {renderProgress(request.deliveryProgress, request.totalApprovedQuantity ?? request.quantity, request.totalDeliveredQuantity)}

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
            </TouchableOpacity>
          ))}

          {!filteredRequests.length && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hay solicitudes</Text>
              <Text style={styles.emptySubtitle}>
                Crea una nueva solicitud o ajusta los filtros para ver resultados.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
  filterButtonActive: { backgroundColor: COLORS.primary },
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
    paddingHorizontal: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  materialInfo: {
    flex: 1,
    paddingRight: 12,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
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
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  observationsContainer: {
    marginTop: 12,
  },
  observationsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  observationsText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  requestFooter: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
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
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressValue: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 999 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
