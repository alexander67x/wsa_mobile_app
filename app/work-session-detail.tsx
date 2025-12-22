import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Clock } from 'lucide-react-native';
import { COLORS } from '@/theme';
import { fetchJson } from '@/lib/http';

const ENABLE_DETAIL_API = false; // Activa cuando el backend esté listo
const DETAIL_PATH = (id: string) => `/attendance/checks/${id}`;

export default function WorkSessionDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const session = useMemo(() => {
    const startLocation = (params.startLocation as string) || (params.location as string) || 'Ubicación no disponible';
    const endLocation = (params.endLocation as string) || (params.location as string) || 'Ubicación no disponible';
    const date = (params.date as string) || 'Fecha no disponible';
    const checkIn = (params.checkIn as string) || '--:--';
    const checkOut = (params.checkOut as string) || '--:--';
    const hoursWorked = params.hoursWorked ? `${params.hoursWorked}h trabajadas` : 'Horas no calculadas';

    return { startLocation, endLocation, date, checkIn, checkOut, hoursWorked };
  }, [params]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!ENABLE_DETAIL_API || !params.id) return;
      try {
        // TODO: Conectar al backend cuando esté listo
        await fetchJson<void, undefined>(DETAIL_PATH(String(params.id)), { method: 'GET' });
      } catch (error) {
        console.log('Detalle de jornada no disponible aún (solo frontend)', error);
      }
    };

    fetchDetail();
  }, [params.id]);

  const LocationCard = ({
    title,
    location,
    time,
    mapLabel,
  }: {
    title: string;
    location: string;
    time: string;
    mapLabel: string;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.timePill}>
          <Clock size={14} color={COLORS.primary} />
          <Text style={styles.timeText}>{time}</Text>
        </View>
      </View>
      <View style={styles.locationRow}>
        <MapPin size={18} color="#059669" />
        <Text style={styles.locationText}>{location}</Text>
      </View>
      <View style={styles.mapPreview}>
        <Text style={styles.mapLabel}>{mapLabel}</Text>
        <Text style={styles.mapSubLabel}>Vista de mapa simulada (solo frontend)</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de jornada</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.meta}>
          <Text style={styles.metaDate}>{session.date}</Text>
          <Text style={styles.metaHours}>{session.hoursWorked}</Text>
        </View>

        <LocationCard
          title="Lugar donde se inició el trabajo"
          location={session.startLocation}
          time={session.checkIn}
          mapLabel="Punto de inicio"
        />

        <LocationCard
          title="Lugar donde finalizó"
          location={session.endLocation}
          time={session.checkOut}
          mapLabel="Punto de salida"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 18,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
    paddingTop: 8,
  },
  meta: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  metaDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  metaHours: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
    flexBasis: '60%',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  mapPreview: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  mapLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  mapSubLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
