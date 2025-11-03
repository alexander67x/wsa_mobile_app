import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Clock, MapPin, CircleCheck as CheckCircle, Play, Square, Calendar } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

interface CheckInRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  location: string;
  hoursWorked?: number;
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

export default function CheckInScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [currentLocation] = useState('Green Tower');
  const [isProcessing, setIsProcessing] = useState(false);

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
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCheckIn = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const now = new Date();
      setCheckInTime(formatTime(now));
      setIsCheckedIn(true);
      setIsProcessing(false);
      
      Alert.alert(
        'Check-in Exitoso',
        `Has iniciado tu jornada a las ${formatTime(now)} en ${currentLocation}`,
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const handleCheckOut = () => {
    Alert.alert(
      'Confirmar Check-out',
      '¿Estás seguro de que deseas finalizar tu jornada laboral?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setIsProcessing(true);
            
            setTimeout(() => {
              const now = new Date();
              setIsCheckedIn(false);
              setCheckInTime(null);
              setIsProcessing(false);
              
              Alert.alert(
                'Check-out Exitoso',
                `Has finalizado tu jornada a las ${formatTime(now)}`,
                [{ text: 'OK' }]
              );
            }, 2000);
          },
        },
      ]
    );
  };

  const getTotalHoursThisWeek = () => {
    return mockRecords.reduce((total, record) => total + (record.hoursWorked || 0), 0);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
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
            <Text style={styles.statusTime}>Desde las {checkInTime}</Text>
            
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
        
        {mockRecords.slice(0, 3).map(record => (
          <View key={record.id} style={styles.historyItem}>
            <View style={styles.historyDate}>
              <Calendar size={16} color="#2563EB" />
              <Text style={styles.historyDateText}>{record.date}</Text>
            </View>
            <View style={styles.historyDetails}>
              <Text style={styles.historyLocation}>{record.location}</Text>
              <View style={styles.historyTimes}>
                <Text style={styles.historyTime}>
                  {record.checkIn} - {record.checkOut}
                </Text>
                <Text style={styles.historyHours}>
                  {record.hoursWorked}h trabajadas
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  currentTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 12,
  },
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
    marginBottom: 24,
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
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
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDateText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
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
