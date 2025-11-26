import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, MapPin, Trash2, Send, Plus } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';

interface Photo {
  id: string;
  uri: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const mockPhotos: Photo[] = [
  {
    id: '1',
    uri: 'https://images.pexels.com/photos/834892/pexels-photo-834892.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '2024-02-12 10:30',
    location: {
      latitude: -12.0464,
      longitude: -77.0428,
      address: 'Av. Principal 123, Lima'
    }
  },
  {
    id: '2',
    uri: 'https://images.pexels.com/photos/1872564/pexels-photo-1872564.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '2024-02-12 10:35',
    location: {
      latitude: -12.0464,
      longitude: -77.0428,
      address: 'Av. Principal 123, Lima'
    }
  },
];

export default function AttachEvidenceScreen() {
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const takePhoto = () => {
    const newPhoto: Photo = {
      id: Date.now().toString(),
      uri: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=400',
      timestamp: new Date().toLocaleString(),
      location: {
        latitude: -12.0464,
        longitude: -77.0428,
        address: 'Av. Principal 123, Lima'
      }
    };
    setPhotos([...photos, newPhoto]);
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de que deseas eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPhotos(photos.filter(photo => photo.id !== photoId));
          },
        },
      ]
    );
  };

  const sendReport = () => {
    if (photos.length === 0) {
      Alert.alert('Sin evidencias', '¿Deseas enviar el reporte sin evidencias fotográficas?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => submitReport(),
        },
      ]);
      return;
    }
    
    submitReport();
  };

  const submitReport = () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Reporte Enviado',
        'Tu reporte ha sido enviado exitosamente y está siendo revisado.',
        [
          {
            text: 'Ver Reportes',
            onPress: () => router.push('/(tabs)/reports'),
          },
          {
            text: 'Ir al Inicio',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    }, 2000);
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
        <Text style={styles.headerTitle}>Evidencias</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MapPin size={20} color="#10B981" />
            <Text style={styles.infoTitle}>Geolocalización Activada</Text>
          </View>
          <Text style={styles.infoText}>
            Las fotos se guardarán con la ubicación actual para mayor precisión del reporte.
          </Text>
        </View>

        <View style={styles.cameraSection}>
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Camera size={32} color="#FFFFFF" />
            <Text style={styles.cameraButtonText}>Tomar Foto</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>
              Evidencias Capturadas ({photos.length})
            </Text>
            
            <View style={styles.photosGrid}>
              {photos.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deletePhoto(photo.id)}
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoTimestamp}>{photo.timestamp}</Text>
                    {photo.location && (
                      <View style={styles.locationInfo}>
                        <MapPin size={12} color="#6B7280" />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {photo.location.address}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Consejos para buenas evidencias:</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>• Toma fotos con buena iluminación</Text>
            <Text style={styles.instructionItem}>• Incluye elementos de referencia (regla, escalas)</Text>
            <Text style={styles.instructionItem}>• Captura diferentes ángulos del trabajo</Text>
            <Text style={styles.instructionItem}>• Asegúrate de que las fotos sean nítidas</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.addMoreButton}
            onPress={takePhoto}
          >
            <Plus size={20} color={COLORS.primary} />
            <Text style={styles.addMoreButtonText}>Agregar Más Fotos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
            onPress={sendReport}
            disabled={isSubmitting}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: COLORS.primary,
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  infoText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  cameraSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cameraButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photosSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  photosGrid: {
    gap: 16,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInfo: {
    marginTop: 12,
  },
  photoTimestamp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  actionButtons: {
    paddingBottom: 40,
    gap: 12,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  addMoreButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  sendButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
