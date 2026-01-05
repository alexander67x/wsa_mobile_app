import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, User, FileText, Camera, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';
import { useEffect, useState } from 'react';
import { getReport } from '@/services/reports';
import type { ReportDetail as ReportDetailType } from '@/types/domain';

export default function ReportDetailScreen() {
  const { reportId } = useLocalSearchParams();
  const [data, setData] = useState<ReportDetailType | null>(null);
  useEffect(() => { getReport(String(reportId || '1')).then(setData).catch(() => setData(null)); }, [reportId]);

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const normalizeStatus = (status: string) => (typeof status === 'string' ? status.toLowerCase() : '');

  const getStatusColor = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'approved':
      case 'aprobado':
      case 'aprobada':
        return '#10B981';
      case 'pending':
      case 'pendiente':
        return '#F59E0B';
      case 'rejected':
      case 'rechazado':
      case 'rechazada':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'approved':
      case 'aprobado':
      case 'aprobada':
        return <CheckCircle size={20} color="#10B981" />;
      case 'pending':
      case 'pendiente':
        return <Clock size={20} color="#F59E0B" />;
      case 'rejected':
      case 'rechazado':
      case 'rechazada':
        return <AlertTriangle size={20} color="#EF4444" />;
      default:
        return <Clock size={20} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (normalizeStatus(status)) {
      case 'approved':
      case 'aprobado':
      case 'aprobada':
        return 'Aprobado';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'rejected':
      case 'rechazado':
      case 'rechazada':
        return 'Rechazado';
      default:
        return 'Desconocido';
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

  const statusNormalized = normalizeStatus(data.status);
  const isApproved = ['approved', 'aprobado', 'aprobada'].includes(statusNormalized);
  const isRejected = ['rejected', 'rechazado', 'rechazada'].includes(statusNormalized);
  const reviewer =
    (isApproved ? data.approvedBy : data.rejectedBy) ??
    data.approvedBy ??
    data.rejectedBy;
  const reviewDate =
    (isApproved ? data.approvedDate : data.rejectedDate) ??
    data.approvedDate ??
    data.rejectedDate;
  const reviewTitle = isApproved ? 'Aprobacion' : 'Rechazo';
  const reviewIcon = isApproved ? <CheckCircle size={20} color="#166534" /> : <AlertTriangle size={20} color="#991B1B" />;
  const reviewLabelColor = isApproved ? '#166534' : '#991B1B';
  const reviewCardStyle = isApproved ? styles.approvalCard : styles.rejectionCard;
  const reviewBorderColor = isApproved ? '#10B981' : '#EF4444';
  const feedbackText = data.feedback || 'Sin comentarios';
  const hasImages = (data.images?.length ?? 0) > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Reporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              {getStatusIcon(data.status)}
              <Text style={[styles.statusText, { color: getStatusColor(data.status) }]}>
                {getStatusText(data.status)}
              </Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{getTypeText(data.type)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.reportTitle}>{data.title}</Text>
          <Text style={styles.reportProject}>{data.project}</Text>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <User size={16} color="#6B7280" />
              <Text style={styles.metaText}>{data.author}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.metaText}>{data.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.metaText}>{data.location || 'Sin ubicacion registrada'}</Text>
            </View>
          </View>

          {data.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Avance reportado</Text>
                <Text style={styles.progressPercentage}>{data.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${data.progress}%`, backgroundColor: '#10B981' }]} />
              </View>
            </View>
          )}
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.cardTitle}>Descripción</Text>
          <Text style={styles.descriptionText}>{data.description}</Text>
        </View>

        <View style={styles.imagesCard}>
          <View style={styles.imagesHeader}>
            <Camera size={20} color="#6B7280" />
            <Text style={[styles.cardTitle, { marginLeft: 8 }]}>Evidencias</Text>
          </View>
          {hasImages ? (
            <View style={styles.imagesContainer}>
              {data.images.map((uri, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.evidenceImage} />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noImagesText}>Sin evidencias adjuntas</Text>
          )}
        </View>

        {(isApproved || isRejected) && (
          <View style={[styles.reviewCard, reviewCardStyle, { borderLeftColor: reviewBorderColor }]}>
            <View style={styles.approvalHeader}>
              {reviewIcon}
              <Text style={[styles.cardTitle, { marginLeft: 8, color: reviewLabelColor }]}>{reviewTitle}</Text>
            </View>
            <View style={styles.approvalInfo}>
              <Text style={[styles.approvalLabel, { color: reviewLabelColor }]}>
                {isApproved ? 'Aprobado por' : 'Rechazado por'}
              </Text>
              <Text style={[styles.approvalValue, { color: reviewLabelColor }]}>{reviewer || 'No registrado'}</Text>
            </View>
            <View style={styles.approvalInfo}>
              <Text style={[styles.approvalLabel, { color: reviewLabelColor }]}>Fecha</Text>
              <Text style={[styles.approvalValue, { color: reviewLabelColor }]}>{reviewDate || 'No registrada'}</Text>
            </View>
            <View style={[styles.feedbackContainer, { borderTopColor: isApproved ? 'rgba(22, 101, 52, 0.2)' : 'rgba(185, 28, 28, 0.2)' }]}>
              <Text style={[styles.feedbackLabel, { color: reviewLabelColor }]}>Comentarios</Text>
              <Text style={[styles.feedbackText, { color: reviewLabelColor }]}>{feedbackText}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  statusCard: { padding: 16 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusInfo: { flexDirection: 'row', alignItems: 'center' },
  statusText: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
  typeBadge: { backgroundColor: COLORS.primarySurface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  typeText: { color: COLORS.primary, fontWeight: '700' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  reportTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  reportProject: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  metaInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 6, color: '#6B7280' },
  progressContainer: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  progressPercentage: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 },
  progressFill: { height: '100%', borderRadius: 4 },
  descriptionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  descriptionText: { fontSize: 16, color: '#374151', lineHeight: 24 },
  imagesCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  imagesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  imageWrapper: { marginRight: 12, marginBottom: 12 },
  evidenceImage: { width: 120, height: 120, borderRadius: 8, backgroundColor: '#F3F4F6' },
  noImagesText: { color: '#6B7280', fontSize: 14 },
  reviewCard: { borderRadius: 16, padding: 20, marginBottom: 32, borderLeftWidth: 4 },
  approvalCard: { backgroundColor: '#DCFCE7' },
  rejectionCard: { backgroundColor: '#FEE2E2' },
  approvalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  approvalInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  approvalLabel: { fontSize: 14, color: '#166534', fontWeight: '500' },
  approvalValue: { fontSize: 14, color: '#166534', fontWeight: '600' },
  feedbackContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  feedbackLabel: { fontSize: 14, color: '#166534', fontWeight: '500', marginBottom: 8 },
  feedbackText: { fontSize: 16, color: '#166534', lineHeight: 22 },
});
