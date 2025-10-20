import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, User, FileText, Camera, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const mockReportDetail = {
  id: '1',
  title: 'Reporte de avance semanal',
  project: 'Edificio Residencial Norte',
  type: 'progress',
  status: 'approved',
  progress: 25,
  author: 'Carlos Mendoza',
  date: '2024-02-12 14:30',
  location: 'Av. Principal 123, Lima',
  description: 'Avance significativo en la instalación eléctrica del tercer piso. Se completó el 25% del cableado principal y se instalaron 15 de 20 tomas eléctricas planificadas. El trabajo se desarrolló sin contratiempos y cumpliendo con los estándares de seguridad.',
  observations: 'Se recomienda acelerar el proceso para mantener el cronograma. Material adicional requerido para la próxima semana.',
  images: [
    'https://images.pexels.com/photos/834892/pexels-photo-834892.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1872564/pexels-photo-1872564.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=400',
  ],
  approvedBy: 'Ing. Roberto Silva',
  approvedDate: '2024-02-13 09:15',
  feedback: 'Excelente trabajo. El avance está acorde con lo planificado.',
};

export default function ReportDetailScreen() {
  const { reportId } = useLocalSearchParams();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={20} color="#10B981" />;
      case 'pending': return <Clock size={20} color="#F59E0B" />;
      case 'rejected': return <AlertTriangle size={20} color="#EF4444" />;
      default: return <Clock size={20} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'progress': return 'Reporte de Avance';
      case 'incident': return 'Reporte de Incidencia';
      case 'quality': return 'Control de Calidad';
      default: return 'Reporte';
    }
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
        <Text style={styles.headerTitle}>Detalle del Reporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              {getStatusIcon(mockReportDetail.status)}
              <Text style={[styles.statusText, { color: getStatusColor(mockReportDetail.status) }]}>
                {getStatusText(mockReportDetail.status)}
              </Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{getTypeText(mockReportDetail.type)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.reportTitle}>{mockReportDetail.title}</Text>
          <Text style={styles.reportProject}>{mockReportDetail.project}</Text>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <User size={16} color="#6B7280" />
              <Text style={styles.metaText}>{mockReportDetail.author}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.metaText}>{mockReportDetail.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.metaText}>{mockReportDetail.location}</Text>
            </View>
          </View>

          {mockReportDetail.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Avance Reportado</Text>
                <Text style={styles.progressPercentage}>{mockReportDetail.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${mockReportDetail.progress}%`, backgroundColor: getStatusColor(mockReportDetail.status) }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.cardTitle}>Descripción</Text>
          <Text style={styles.descriptionText}>{mockReportDetail.description}</Text>
        </View>

        {mockReportDetail.observations && (
          <View style={styles.observationsCard}>
            <Text style={styles.cardTitle}>Observaciones</Text>
            <Text style={styles.observationsText}>{mockReportDetail.observations}</Text>
          </View>
        )}

        {mockReportDetail.images.length > 0 && (
          <View style={styles.imagesCard}>
            <View style={styles.imagesHeader}>
              <Camera size={20} color="#1F2937" />
              <Text style={styles.cardTitle}>Evidencias ({mockReportDetail.images.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {mockReportDetail.images.map((imageUri, index) => (
                <TouchableOpacity key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.evidenceImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {mockReportDetail.status === 'approved' && (
          <View style={styles.approvalCard}>
            <View style={styles.approvalHeader}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.cardTitle}>Información de Aprobación</Text>
            </View>
            <View style={styles.approvalInfo}>
              <Text style={styles.approvalLabel}>Aprobado por:</Text>
              <Text style={styles.approvalValue}>{mockReportDetail.approvedBy}</Text>
            </View>
            <View style={styles.approvalInfo}>
              <Text style={styles.approvalLabel}>Fecha de aprobación:</Text>
              <Text style={styles.approvalValue}>{mockReportDetail.approvedDate}</Text>
            </View>
            {mockReportDetail.feedback && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>Comentarios:</Text>
                <Text style={styles.feedbackText}>{mockReportDetail.feedback}</Text>
              </View>
            )}
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  infoCard: {
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
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  reportProject: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  metaInfo: {
    gap: 8,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  descriptionCard: {
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
  observationsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  observationsText: {
    fontSize: 16,
    color: '#92400E',
    lineHeight: 24,
  },
  imagesCard: {
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
  imagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
  },
  imageWrapper: {
    marginRight: 12,
  },
  evidenceImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  approvalCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  approvalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  approvalLabel: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  approvalValue: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
  },
  feedbackContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(22, 101, 52, 0.2)',
  },
  feedbackLabel: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 16,
    color: '#166534',
    lineHeight: 22,
  },
});