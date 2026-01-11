import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, User, Camera, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';
import { useEffect, useState, useCallback } from 'react';
import { getReport, approveReport, rejectReport } from '@/services/reports';
import { getRole, getRoleSlug, hasPermission, getUser } from '@/services/auth';
import type { HttpError } from '@/lib/http';
import type { ReportDetail as ReportDetailType } from '@/types/domain';

export default function ReportDetailScreen() {
  const { reportId } = useLocalSearchParams();
  const resolvedReportId = String(reportId || '1');
  const [data, setData] = useState<ReportDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | 'resend' | null>(null);
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string[]>([]);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const detail = await getReport(resolvedReportId);
      setData(detail);
    } catch (error) {
      console.error('Error loading report detail', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedReportId]);

  useEffect(() => { loadReport(); }, [loadReport]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No se pudo cargar el reporte.</Text>
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
  const role = getRole();
  const roleSlug = getRoleSlug();
  const user = getUser();
  const canReviewRole = role === 'supervisor' || roleSlug === 'responsable_proyecto';
  const canReviewReport = data.status === 'pending' && (canReviewRole || hasPermission('reports.approve'));
  const isWorkerRole = role === 'worker' && roleSlug !== 'responsable_proyecto';
  const normalizedAuthorId = data.authorId ? String(data.authorId) : undefined;
  const userIdentifiers = [user?.employeeId, user?.id].filter(Boolean).map(id => String(id));
  const isAuthor = normalizedAuthorId ? userIdentifiers.includes(normalizedAuthorId) : true;
  const canResendReport = data.status === 'rejected' && isWorkerRole && isAuthor;

  const describeMaterial = (entry: unknown): string => {
    if (!entry) return 'Material faltante';
    if (typeof entry === 'string' || typeof entry === 'number') return String(entry);
    if (Array.isArray(entry)) {
      return entry.map(sub => describeMaterial(sub)).join(', ');
    }
    if (typeof entry === 'object') {
      const material = entry as Record<string, unknown>;
      const name =
        material.name ??
        material.material ??
        material.materialName ??
        material.descripcion ??
        material.descripcionMaterial ??
        material.title ??
        material.titulo;
      const missing =
        material.missing ??
        material.faltante ??
        material.shortage ??
        material.qty ??
        material.quantity ??
        material.requerido ??
        material.requerida;
      if (name && missing !== undefined) {
        return `${String(name)}: faltan ${missing}`;
      }
      if (name) {
        return String(name);
      }
      return JSON.stringify(entry);
    }
    return String(entry);
  };

  const formatMaterialsFeedback = (materials: unknown): string[] => {
    if (!materials) return [];
    if (Array.isArray(materials)) {
      return materials.map(item => describeMaterial(item));
    }
    if (typeof materials === 'object') {
      const entries = Object.entries(materials as Record<string, unknown>);
      return entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.map(item => describeMaterial(item)).join(', ')}`;
        }
        if (typeof value === 'object' && value !== null) {
          const bag = value as Record<string, unknown>;
          return describeMaterial({ ...bag, name: bag.name ?? key });
        }
        return `${key}: ${String(value)}`;
      });
    }
    return [String(materials)];
  };

  const openReviewModal = (action: 'approve' | 'reject' | 'resend') => {
    setCurrentAction(action);
    setObservations('');
    setActionError(null);
    setMaterialsError([]);
    setModalVisible(true);
  };

  const closeReviewModal = () => {
    if (isSubmitting) return;
    setModalVisible(false);
    setCurrentAction(null);
    setObservations('');
    setActionError(null);
    setMaterialsError([]);
  };

  const handleSubmitReview = async () => {
    if (!currentAction) return;
    setIsSubmitting(true);
    setActionError(null);
    setMaterialsError([]);
    try {
      const payload = observations.trim() ? { observations: observations.trim() } : undefined;
      const actionFn = currentAction === 'reject' ? rejectReport : approveReport;
      const result = await actionFn(resolvedReportId, payload);
      setData(result.report);
      setModalVisible(false);
      setCurrentAction(null);
      setObservations('');
      const successMessage =
        currentAction === 'resend'
          ? 'Reporte reenviado para revisión.'
          : result.message || 'Acción completada correctamente.';
      Alert.alert('Acción completada', successMessage);
    } catch (error) {
      console.error('Error reviewing report', error);
      const httpError = error as HttpError;
      const message = httpError?.message || 'No se pudo completar la acción.';
      setActionError(message);
      if (httpError?.status === 422) {
        const materials = formatMaterialsFeedback((httpError as any)?.data?.materials);
        if (materials.length > 0) {
          setMaterialsError(materials);
        }
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {canReviewReport && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Revisar reporte</Text>
            <Text style={styles.actionsDescription}>
              Este reporte está pendiente de aprobación. Agrega observaciones si es necesario antes de tomar una decisión.
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => openReviewModal('reject')}>
                <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => openReviewModal('approve')}>
                <Text style={[styles.actionButtonText, styles.approveButtonText]}>Aprobar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {canResendReport && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Reenviar reporte</Text>
            <Text style={styles.actionsDescription}>
              Este reporte fue rechazado. Corrige los detalles necesarios y vuelve a enviarlo para su revisión.
            </Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionButton, styles.resendButton]} onPress={() => openReviewModal('resend')}>
                <Text style={[styles.actionButtonText, styles.resendButtonText]}>Reenviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeReviewModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentAction === 'approve'
                ? 'Aprobar reporte'
                : currentAction === 'reject'
                  ? 'Rechazar reporte'
                  : currentAction === 'resend'
                    ? 'Reenviar reporte'
                    : 'Revisión'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {currentAction === 'reject'
                ? 'Describe el motivo del rechazo para que el trabajador sepa qué corregir.'
                : currentAction === 'resend'
                  ? 'Describe los ajustes realizados antes de volver a enviar el reporte.'
                  : 'Confirma la aprobación e indica observaciones si lo consideras necesario.'}
            </Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              placeholder="Observaciones (opcional)"
              placeholderTextColor="#9CA3AF"
              value={observations}
              onChangeText={setObservations}
              editable={!isSubmitting}
            />

            {materialsError.length > 0 && (
              <View style={styles.modalAlertBox}>
                <Text style={styles.modalAlertTitle}>Materiales pendientes</Text>
                {materialsError.map((item, index) => (
                  <Text key={`material-${index}`} style={styles.modalAlertText}>
                    • {item}
                  </Text>
                ))}
              </View>
            )}

            {actionError ? <Text style={styles.modalErrorText}>{actionError}</Text> : null}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={closeReviewModal}
                disabled={isSubmitting}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  currentAction === 'reject' && styles.modalRejectButton,
                ]}
                onPress={handleSubmitReview}
                disabled={isSubmitting}
              >
                <Text
                  style={[
                    styles.modalButtonPrimaryText,
                    currentAction === 'reject' && styles.modalRejectButtonText,
                  ]}
                >
                  {isSubmitting
                    ? 'Enviando...'
                    : currentAction === 'approve'
                      ? 'Aprobar'
                      : currentAction === 'reject'
                        ? 'Rechazar'
                        : 'Reenviar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  actionsDescription: { fontSize: 14, color: '#4B5563', marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { fontSize: 16, fontWeight: '600' },
  approveButton: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  approveButtonText: { color: '#065F46' },
  rejectButton: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  rejectButtonText: { color: '#991B1B' },
  resendButton: { backgroundColor: COLORS.primarySurface },
  resendButtonText: { color: COLORS.primary },
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, minHeight: 100, textAlignVertical: 'top', color: '#111827' },
  modalButtonsRow: { flexDirection: 'row', marginTop: 16 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalButtonSecondary: { backgroundColor: '#E5E7EB', marginRight: 8 },
  modalButtonPrimary: { backgroundColor: COLORS.primary, marginLeft: 8 },
  modalButtonText: { color: '#111827', fontWeight: '600' },
  modalButtonPrimaryText: { color: '#FFFFFF', fontWeight: '600' },
  modalRejectButton: { backgroundColor: '#DC2626' },
  modalRejectButtonText: { color: '#FFFFFF' },
  modalErrorText: { color: '#DC2626', fontSize: 14, marginTop: 12 },
  modalAlertBox: { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderRadius: 12, padding: 12, marginTop: 8 },
  modalAlertTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 8 },
  modalAlertText: { fontSize: 14, color: '#92400E', marginBottom: 4 },
});
