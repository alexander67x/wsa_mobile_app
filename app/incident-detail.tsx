import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, ShieldAlert, User as UserIcon } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';
import { getIncidencia, type IncidentDetail } from '@/services/incidencias';

type StatusInfo = { text: string; color: string };
type SeverityInfo = { text: string; color: string; bg: string };

const getStatusInfo = (status?: string): StatusInfo => {
  const normalized = (status || '').toLowerCase();
  if (!normalized || ['registrada', 'registrado', 'nuevo', 'nueva'].includes(normalized)) {
    return { text: 'Registrada', color: '#F59E0B' };
  }
  switch (normalized) {
    case 'abierta':
      return { text: 'Abierta', color: '#F97316' };
    case 'en_proceso':
      return { text: 'En proceso', color: COLORS.primary };
    case 'resuelta':
      return { text: 'Resuelta', color: '#10B981' };
    case 'verificacion':
      return { text: 'Verificacion', color: '#3B82F6' };
    case 'cerrada':
      return { text: 'Cerrada', color: '#6B7280' };
    case 'reabierta':
      return { text: 'Reabierta', color: '#EF4444' };
    default:
      return { text: 'Sin estado', color: '#6B7280' };
  }
};

const getSeverityInfo = (severity?: string): SeverityInfo => {
  const normalized = (severity || '').toLowerCase();
  switch (normalized) {
    case 'critica':
      return { text: 'Critica', color: '#B91C1C', bg: '#FEE2E2' };
    case 'alta':
      return { text: 'Alta', color: '#DC2626', bg: '#FECACA' };
    case 'media':
      return { text: 'Media', color: '#D97706', bg: '#FEF3C7' };
    case 'baja':
      return { text: 'Baja', color: '#047857', bg: '#D1FAE5' };
    default:
      return { text: 'Sin severidad', color: '#6B7280', bg: '#E5E7EB' };
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export default function IncidentDetailScreen() {
  const { incidentId } = useLocalSearchParams<{ incidentId?: string }>();
  const resolvedId = incidentId ? String(incidentId) : '';
  const [data, setData] = useState<IncidentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadIncident = useCallback(async () => {
    if (!resolvedId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const detail = await getIncidencia(resolvedId);
      setData(detail);
    } catch (error) {
      console.error('Error loading incident detail', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  const statusInfo = useMemo(() => getStatusInfo(data?.status), [data?.status]);
  const severityInfo = useMemo(() => getSeverityInfo(data?.severity), [data?.severity]);
  const dateLabel = formatDate(data?.date);
  const locationLabel = data?.location || data?.project || '';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando incidencia...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {resolvedId ? 'No se pudo cargar la incidencia.' : 'Falta el id de la incidencia.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <ArrowLeft size={24} color="#FFFFFF" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Detalle de Incidencia</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { borderColor: statusInfo.color }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
          </View>
          <View style={[styles.severityTag, { backgroundColor: severityInfo.bg }]}>
            <Text style={[styles.severityText, { color: severityInfo.color }]}>{severityInfo.text}</Text>
          </View>
        </View>

        <Text style={styles.title}>{data.title}</Text>
        {!!data.project && <Text style={styles.subtitle}>{data.project}</Text>}

        {!!dateLabel && (
          <View style={styles.metaRow}>
            <Calendar size={16} color={COLORS.mutedText} />
            <Text style={styles.metaText}>Fecha: {dateLabel}</Text>
          </View>
        )}
        {!!locationLabel && (
          <View style={styles.metaRow}>
            <MapPin size={16} color={COLORS.mutedText} />
            <Text style={styles.metaText}>Ubicacion: {locationLabel}</Text>
          </View>
        )}
        {!!data.author && (
          <View style={styles.metaRow}>
            <UserIcon size={16} color={COLORS.mutedText} />
            <Text style={styles.metaText}>Reportado por: {data.author}</Text>
          </View>
        )}
        {!!data.assignedTo && (
          <View style={styles.metaRow}>
            <ShieldAlert size={16} color={COLORS.mutedText} />
            <Text style={styles.metaText}>Asignado a: {data.assignedTo}</Text>
          </View>
        )}

        {!!data.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripcion</Text>
            <Text style={styles.sectionText}>{data.description}</Text>
          </View>
        )}

        {!!data.solution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solucion</Text>
            <Text style={styles.sectionText}>{data.solution}</Text>
          </View>
        )}

        {(data.images || []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidencias</Text>
            <View style={styles.imageGrid}>
              {data.images.map((img, index) => (
                <Image key={`${img.url}-${index}`} source={{ uri: img.url }} style={styles.image} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySurface },
  loadingText: { marginTop: 12, color: COLORS.mutedText },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statusText: { fontWeight: '700', fontSize: 12 },
  severityTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  severityText: { fontWeight: '700', fontSize: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 4, color: '#6B7280' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  metaText: { color: '#374151' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  sectionText: { color: '#111827', lineHeight: 20 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  image: { width: 120, height: 120, borderRadius: 10, backgroundColor: '#E5E7EB' },
});
