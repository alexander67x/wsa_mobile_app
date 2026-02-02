import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Clock } from 'lucide-react-native';
import { COLORS } from '@/theme';
import { AttendanceSession, getAttendanceCheck } from '@/services/attendance';

const ENABLE_DETAIL_API = true;
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY || '';

interface SessionView {
  startLocation: string;
  endLocation: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: string;
  startCoords?: { latitude: number; longitude: number } | null;
  endCoords?: { latitude: number; longitude: number } | null;
}

export default function WorkSessionDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const apiId = typeof params.apiId === 'string' ? params.apiId : undefined;
  const routeId = typeof params.id === 'string' ? params.id : undefined;
  const startLocationParam = typeof params.startLocation === 'string' ? params.startLocation : undefined;
  const endLocationParam = typeof params.endLocation === 'string' ? params.endLocation : undefined;
  const locationParam = typeof params.location === 'string' ? params.location : undefined;
  const dateParam = typeof params.date === 'string' ? params.date : undefined;
  const checkInParam = typeof params.checkIn === 'string' ? params.checkIn : undefined;
  const checkOutParam = typeof params.checkOut === 'string' ? params.checkOut : undefined;
  const hoursWorkedParam = typeof params.hoursWorked === 'string' ? params.hoursWorked : undefined;
  const startLatParam = typeof params.startLat === 'string' ? params.startLat : undefined;
  const startLngParam = typeof params.startLng === 'string' ? params.startLng : undefined;
  const endLatParam = typeof params.endLat === 'string' ? params.endLat : undefined;
  const endLngParam = typeof params.endLng === 'string' ? params.endLng : undefined;

  const formatTimeShort = (date: Date) =>
    date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const parseDateSafe = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getTimeLabel = (value?: string | null, fallbackIso?: string | null) => {
    if (value) return value;
    const parsed = parseDateSafe(fallbackIso || undefined);
    return parsed ? formatTimeShort(parsed) : '--:--';
  };

  const mapSessionToView = (data: AttendanceSession): SessionView => {
    const startLocation = data.startLocationLabel || data.location || 'Ubicación no disponible';
    const endLocation = data.endLocationLabel || data.location || 'Ubicación no disponible';
    const date = data.date || data.checkInAt?.slice(0, 10) || 'Fecha no disponible';
    const checkIn = getTimeLabel(data.checkIn, data.checkInAt);
    const checkOut = getTimeLabel(data.checkOut, data.checkOutAt);
    const hoursWorked = data.hoursWorked != null ? `${data.hoursWorked}h trabajadas` : 'Horas no calculadas';

    return {
      startLocation,
      endLocation,
      date,
      checkIn,
      checkOut,
      hoursWorked,
      startCoords: data.startCoords ?? null,
      endCoords: data.endCoords ?? null,
    };
  };

  const parseCoord = (value?: string): number | null => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const buildSessionFromParams = (): SessionView => {
    const startLocation = startLocationParam || locationParam || 'Ubicación no disponible';
    const endLocation = endLocationParam || locationParam || 'Ubicación no disponible';
    const date = dateParam || 'Fecha no disponible';
    const checkIn = checkInParam || '--:--';
    const checkOut = checkOutParam || '--:--';
    const hoursWorked = hoursWorkedParam ? `${hoursWorkedParam}h trabajadas` : 'Horas no calculadas';
    const startLat = parseCoord(startLatParam);
    const startLng = parseCoord(startLngParam);
    const endLat = parseCoord(endLatParam);
    const endLng = parseCoord(endLngParam);

    return {
      startLocation,
      endLocation,
      date,
      checkIn,
      checkOut,
      hoursWorked,
      startCoords: startLat != null && startLng != null ? { latitude: startLat, longitude: startLng } : null,
      endCoords: endLat != null && endLng != null ? { latitude: endLat, longitude: endLng } : null,
    };
  };

  const [session, setSession] = useState<SessionView>(buildSessionFromParams);

  useEffect(() => {
    const fetchDetail = async () => {
      const sessionId = apiId || routeId;
      if (!ENABLE_DETAIL_API || !sessionId) return;
      try {
        const apiSession = await getAttendanceCheck(String(sessionId));
        setSession(mapSessionToView(apiSession));
      } catch (error) {
        console.log('Detalle de jornada no disponible aún (solo frontend)', error);
      }
    };

    fetchDetail();
  }, [apiId, routeId]);

  useEffect(() => {
    setSession(buildSessionFromParams());
  }, [
    startLocationParam,
    endLocationParam,
    locationParam,
    dateParam,
    checkInParam,
    checkOutParam,
    hoursWorkedParam,
    startLatParam,
    startLngParam,
    endLatParam,
    endLngParam,
  ]);

  const LocationCard = ({
    title,
    location,
    time,
    mapLabel,
    coords,
  }: {
    title: string;
    location: string;
    time: string;
    mapLabel: string;
    coords?: { latitude: number; longitude: number } | null;
  }) => {
    const [mapError, setMapError] = useState(false);
    const mapReady = Boolean(coords && MAPTILER_KEY);
    useEffect(() => {
      setMapError(false);
    }, [coords?.latitude, coords?.longitude]);

    return (
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
          {coords ? (
            mapReady ? (
              mapError ? (
                <Text style={styles.mapSubLabel}>No se pudo cargar el mapa</Text>
              ) : (
                <MapTile coords={coords} onError={() => setMapError(true)} />
              )
            ) : (
              <Text style={styles.mapSubLabel}>Falta configurar EXPO_PUBLIC_MAPTILER_KEY</Text>
            )
          ) : (
            <Text style={styles.mapSubLabel}>Coordenadas no disponibles</Text>
          )}
          {mapReady ? (
            <Text style={styles.mapAttribution}>© MapTiler © OpenStreetMap contributors</Text>
          ) : null}
        </View>
      </View>
    );
  };

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
          coords={session.startCoords}
        />

        <LocationCard
          title="Lugar donde finalizó"
          location={session.endLocation}
          time={session.checkOut}
          mapLabel="Punto de salida"
          coords={session.endCoords}
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
    width: '100%',
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
  mapAttribution: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 8,
  },
  mapFrame: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: '#E5E7EB',
  },
  mapTile: {
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 15;

const latLngToTile = (latitude: number, longitude: number, zoom: number) => {
  const latRad = (latitude * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = ((longitude + 180) / 360) * n;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  return { x, y };
};

const buildMapTilerTileUrl = (zoom: number, tileX: number, tileY: number) =>
  `https://api.maptiler.com/maps/streets/${zoom}/${tileX}/${tileY}.png?key=${MAPTILER_KEY}`;

const MapTile = ({
  coords,
  onError,
}: {
  coords: { latitude: number; longitude: number };
  onError: () => void;
}) => {
  if (!MAPTILER_KEY) return null;
  const zoom = DEFAULT_ZOOM;
  const tile = latLngToTile(coords.latitude, coords.longitude, zoom);
  const tileX = Math.floor(tile.x);
  const tileY = Math.floor(tile.y);
  const url = buildMapTilerTileUrl(zoom, tileX, tileY);
  const offsetX = (tile.x - tileX) * TILE_SIZE;
  const offsetY = (tile.y - tileY) * TILE_SIZE;
  const markerLeft = Math.max(6, Math.min(TILE_SIZE - 6, offsetX)) - 7;
  const markerTop = Math.max(6, Math.min(TILE_SIZE - 6, offsetY)) - 7;

  return (
    <ImageBackground source={{ uri: url }} style={styles.mapFrame} imageStyle={styles.mapTile} onError={onError}>
      <View style={[styles.marker, { left: markerLeft, top: markerTop }]} />
    </ImageBackground>
  );
};
