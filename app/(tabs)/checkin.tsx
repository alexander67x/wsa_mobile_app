import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Clock, MapPin, CircleCheck as CheckCircle, Play, Square, Calendar, Check, Circle, Eye } from 'lucide-react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { COLORS } from '@/theme';
import { fetchJson } from '@/lib/http';

interface CheckInRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  location: string;
  hoursWorked?: number;
  startLocationLabel?: string;
  endLocationLabel?: string;
  startCoords?: Location.LocationObjectCoords | null;
  endCoords?: Location.LocationObjectCoords | null;
  apiId?: string;
}

type CheckEventType = 'check_in' | 'check_out';

interface CheckEventPayload {
  type: CheckEventType;
  occurred_at: string;
  location_label: string;
  latitude?: number;
  longitude?: number;
}

interface LocationSnapshot {
  label: string;
  coords: Location.LocationObjectCoords | null;
}

interface CheckPoint {
  time: string;
  location: string;
  coords: Location.LocationObjectCoords | null;
  iso: string;
}

const mockRecords: CheckInRecord[] = [
  {
    id: '1',
    date: '2024-02-12',
    checkIn: '08:00',
    checkOut: '17:30',
    location: 'Green Tower',
    hoursWorked: 9.5,
  },
  {
    id: '2',
    date: '2024-02-11',
    checkIn: '08:15',
    checkOut: '17:45',
    location: 'Data Center Norte',
    hoursWorked: 9.5,
  },
  {
    id: '3',
    date: '2024-02-10',
    checkIn: '08:00',
    checkOut: '17:00',
    location: 'Parque Industrial Orión',
    hoursWorked: 9,
  },
];

const ENABLE_ATTENDANCE_API = false; // Activa esto cuando el backend esté listo
const ATTENDANCE_PATH = '/attendance/checks';

export default function CheckInScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInMeta, setCheckInMeta] = useState<CheckPoint | null>(null);
  const [checkOutMeta, setCheckOutMeta] = useState<CheckPoint | null>(null);
  const [currentLocation] = useState('Green Tower');
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<CheckInRecord[]>(mockRecords);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLocationSnapshot = async (): Promise<LocationSnapshot> => {
    try {
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        throw new Error('Permiso de ubicación no otorgado');
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let label = 'Ubicación detectada';
      try {
        const [place] = await Location.reverseGeocodeAsync(position.coords);
        label =
          [
            place?.city || place?.district || place?.subregion || place?.region,
            place?.street,
          ]
            .filter(Boolean)
            .join(' • ') || 'Ubicación detectada';
      } catch {
        // Si no se puede geocodificar, usamos el fallback
      }

      return { label, coords: position.coords };
    } catch (error) {
      const fallback = 'Ubicación no disponible';
      if (error instanceof Error) {
        setLocationError(error.message);
      }
      return { label: fallback, coords: null };
    }
  };

  const recordCheckEvent = async (type: CheckEventType, snapshot: LocationSnapshot, at: Date) => {
    const payload: CheckEventPayload = {
      type,
      occurred_at: at.toISOString(),
      location_label: snapshot.label,
      latitude: snapshot.coords?.latitude,
      longitude: snapshot.coords?.longitude,
    };

    try {
      if (ENABLE_ATTENDANCE_API) {
        await fetchJson<void, CheckEventPayload>(ATTENDANCE_PATH, {
          method: 'POST',
          body: payload,
        });
      } else {
        console.log('Payload listo para la API', payload);
      }
    } catch (error) {
      console.log('La marca está lista pero la API aún no respondió', error);
    }
  };

  const archiveSession = (entry: CheckPoint, exit: CheckPoint) => {
    const date = exit.iso ? exit.iso.slice(0, 10) : new Date().toISOString().slice(0, 10);
    let hoursWorked: number | undefined;

    if (entry.iso && exit.iso) {
      const diffMs = new Date(exit.iso).getTime() - new Date(entry.iso).getTime();
      if (diffMs > 0) {
        hoursWorked = Number((diffMs / (1000 * 60 * 60)).toFixed(1));
      }
    }

    const record: CheckInRecord = {
      id: `${Date.now()}`,
      apiId: undefined, // Completar cuando llegue id del backend
      date,
      checkIn: entry.time,
      checkOut: exit.time,
      location: exit.location || entry.location,
      hoursWorked,
      startLocationLabel: entry.location,
      endLocationLabel: exit.location,
      startCoords: entry.coords,
      endCoords: exit.coords,
    };

    setHistoryRecords((prev) => [record, ...prev]);
    setCheckInMeta(null);
    setCheckOutMeta(null);
  };

  const handleCheckIn = () => {
    if (isProcessing) return;

    Alert.alert('Confirmar inicio', 'Deseas iniciar tu jornada laboral ahora?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Iniciar', onPress: processCheckIn },
    ]);
  };

  const processCheckIn = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const previousCheckIn = checkInMeta;
      const previousCheckOut = checkOutMeta;

      if (previousCheckIn && previousCheckOut) {
        archiveSession(previousCheckIn, previousCheckOut);
      }

      const now = new Date();
      const locationSnapshot = await getLocationSnapshot();
      const point: CheckPoint = {
        time: formatTime(now),
        location: locationSnapshot.label,
        coords: locationSnapshot.coords,
        iso: now.toISOString(),
      };

      await recordCheckEvent('check_in', locationSnapshot, now);

      setCheckInMeta(point);
      setCheckOutMeta(null);
      setIsCheckedIn(true);

      Alert.alert(
        'Check-in Exitoso',
        `Has iniciado tu jornada a las ${point.time} en ${point.location}`,
        [{ text: 'OK' }],
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = () => {
    if (isProcessing) return;

    Alert.alert('Confirmar salida', 'Deseas finalizar tu jornada laboral ahora?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Finalizar', onPress: processCheckOut },
    ]);
  };

  const processCheckOut = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const now = new Date();
      const locationSnapshot = await getLocationSnapshot();
      const point: CheckPoint = {
        time: formatTime(now),
        location: locationSnapshot.label,
        coords: locationSnapshot.coords,
        iso: now.toISOString(),
      };

      await recordCheckEvent('check_out', locationSnapshot, now);

      setIsCheckedIn(false);
      setCheckOutMeta(point);

      Alert.alert('Check-out Exitoso', `Has finalizado tu jornada a las ${point.time} en ${point.location}`, [
        { text: 'OK' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = (record: CheckInRecord) => {
    router.push({
      pathname: '/work-session-detail',
      params: {
        id: record.id,
        apiId: record.apiId,
        date: record.date,
        location: record.location,
        checkIn: record.checkIn || '',
        checkOut: record.checkOut || '',
        startLocation: record.startLocationLabel || record.location,
        endLocation: record.endLocationLabel || record.location,
        hoursWorked: record.hoursWorked ? String(record.hoursWorked) : '',
      },
    });
  };

  const getTotalHoursThisWeek = () => {
    return historyRecords.reduce((total, record) => total + (record.hoursWorked || 0), 0);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Turno de Instalación</Text>
          <Text style={styles.date}>{formatDate(currentTime)}</Text>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.locationText}>{currentLocation}</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          {isCheckedIn ? (
            <View style={styles.statusContent}>
              <View style={styles.statusIcon}>
                <CheckCircle size={24} color="#10B981" />
              </View>
              <Text style={styles.statusTitle}>Turno Iniciado</Text>
              <Text style={styles.statusTime}>Desde las {checkInMeta?.time}</Text>
              {checkInMeta?.location ? (
                <View style={styles.statusLocation}>
                  <MapPin size={14} color="#047857" />
                  <Text style={styles.statusLocationText}>{checkInMeta.location}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.actionButton, styles.checkOutButton, isProcessing && styles.buttonDisabled]}
                onPress={handleCheckOut}
                disabled={isProcessing}
              >
                <Square size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {isProcessing ? 'Procesando...' : 'Finalizar Turno'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusContent}>
              <View style={[styles.statusIcon, styles.statusIconInactive]}>
                <Clock size={24} color="#6B7280" />
              </View>
              <Text style={styles.statusTitle}>Turno No Iniciado</Text>
              <Text style={styles.statusSubtitle}>Presiona para iniciar tu día</Text>

              <TouchableOpacity
                style={[styles.actionButton, styles.checkInButton, isProcessing && styles.buttonDisabled]}
                onPress={handleCheckIn}
                disabled={isProcessing}
              >
                <Play size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {isProcessing ? 'Procesando...' : 'Iniciar Jornada'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.checklistContainer}>
          <Text style={styles.historyTitle}>Marcas de jornada</Text>
          <View style={styles.checklistItem}>
            <View style={[styles.checklistIcon, checkInMeta ? styles.checklistIconDone : styles.checklistIconPending]}>
              {checkInMeta ? <Check size={18} color="#FFFFFF" /> : <Circle size={18} color="#6B7280" />}
            </View>
            <View style={styles.checklistInfo}>
              <Text style={styles.checklistLabel}>Entrada</Text>
              <Text style={styles.checklistMeta}>
                {checkInMeta ? `${checkInMeta.time} • ${checkInMeta.location}` : 'Pendiente de marcar'}
              </Text>
            </View>
          </View>
          <View style={styles.checklistItem}>
            <View style={[styles.checklistIcon, checkOutMeta ? styles.checklistIconDone : styles.checklistIconPending]}>
              {checkOutMeta ? <Check size={18} color="#FFFFFF" /> : <Circle size={18} color="#6B7280" />}
            </View>
            <View style={styles.checklistInfo}>
              <Text style={styles.checklistLabel}>Salida</Text>
              <Text style={styles.checklistMeta}>
                {checkOutMeta ? `${checkOutMeta.time} • ${checkOutMeta.location}` : 'Pendiente de marcar'}
              </Text>
            </View>
          </View>
          {locationError ? <Text style={styles.locationWarning}>{locationError}</Text> : null}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getTotalHoursThisWeek()}h</Text>
            <Text style={styles.statLabel}>Esta Semana</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mockRecords.length}</Text>
            <Text style={styles.statLabel}>Días Trabajados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>8.5h</Text>
            <Text style={styles.statLabel}>Promedio Diario</Text>
          </View>
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Historial Reciente</Text>

          {historyRecords.slice(0, 3).map((record) => (
            <View key={record.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={styles.historyDate}>
                  <Calendar size={16} color={COLORS.primary} />
                  <Text style={styles.historyDateText}>{record.date}</Text>
                </View>
                <TouchableOpacity style={styles.historyAction} onPress={() => handleViewDetails(record)}>
                  <Eye size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.historyDetails}>
                <Text style={styles.historyLocation}>{record.location}</Text>
                <View style={styles.historyTimes}>
                  <Text style={styles.historyTime}>
                    {record.checkIn} - {record.checkOut}
                  </Text>
                  <Text style={styles.historyHours}>{record.hoursWorked}h trabajadas</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  currentTime: { fontSize: 48, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12 },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusIconInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusTime: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 16,
  },
  statusLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    marginBottom: 16,
  },
  statusLocationText: {
    fontSize: 13,
    color: '#065F46',
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  checkInButton: {
    backgroundColor: '#10B981',
  },
  checkOutButton: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checklistContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checklistIconDone: {
    backgroundColor: '#10B981',
  },
  checklistIconPending: {
    backgroundColor: '#E5E7EB',
  },
  checklistInfo: {
    flex: 1,
  },
  checklistLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  checklistMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  locationWarning: {
    marginTop: 2,
    fontSize: 12,
    color: '#B45309',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyAction: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  historyDateText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: COLORS.primary },
  historyDetails: {
    marginLeft: 24,
  },
  historyLocation: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  historyTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyHours: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
});
