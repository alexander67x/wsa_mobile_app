import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Package,
    Truck,
    XCircle,
} from 'lucide-react-native';

import {
    approveMaterialRequest,
    deliverMaterialRequest,
    getMaterialRequest,
    rejectMaterialRequest,
} from '@/services/materials';
import type { MaterialRequestDetail } from '@/types/domain';

const STATUS_COLORS: Record<string, string> = {
    draft: '#6B7280',
    pending: '#F59E0B',
    approved: '#3B82F6',
    sent: '#2563EB',
    delivered: '#10B981',
    rejected: '#EF4444',
};

const PRIORITY_COLORS: Record<string, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#6B7280',
};

type DeliveryInput = {
    quantity: string;
    lotNumber: string;
    observations: string;
};

type ActionState = 'approve' | 'reject' | 'deliver' | null;

export default function MaterialRequestDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const requestId = params.id ? String(params.id) : undefined;

    const [detail, setDetail] = useState<MaterialRequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [actionState, setActionState] = useState<ActionState>(null);
    const [approveNotes, setApproveNotes] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');
    const [deliveryInputs, setDeliveryInputs] = useState<Record<string, DeliveryInput>>({});
    const [globalDeliveryNotes, setGlobalDeliveryNotes] = useState('');

    const statusColor = STATUS_COLORS[detail?.status ?? 'pending'] ?? '#6B7280';

    const loadDetail = useCallback(async () => {
        if (!requestId) return;
        try {
            if (!isRefreshing) setIsLoading(true);
            const data = await getMaterialRequest(requestId);
            setDetail(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo cargar la solicitud. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [isRefreshing, requestId]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    useEffect(() => {
        if (!detail?.items) return;
        setDeliveryInputs(current => {
            const next: Record<string, DeliveryInput> = {};
            for (const item of detail.items) {
                next[item.id] = current[item.id] ?? { quantity: '', lotNumber: '', observations: '' };
            }
            return next;
        });
    }, [detail?.items]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadDetail();
    }, [loadDetail]);

    const handleApprove = useCallback(async () => {
        if (!detail || !requestId) return;
        setActionState('approve');
        try {
            const updated = await approveMaterialRequest(requestId, {
                observations: approveNotes.trim() || undefined,
            });
            setDetail(updated);
            setApproveNotes('');
            Alert.alert('Solicitud aprobada', 'La solicitud fue aprobada correctamente.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo aprobar la solicitud.');
        } finally {
            setActionState(null);
        }
    }, [approveNotes, detail, requestId]);

    const handleReject = useCallback(async () => {
        if (!detail || !requestId) return;
        if (!rejectNotes.trim()) {
            Alert.alert('Observaciones requeridas', 'Ingresa el motivo del rechazo.');
            return;
        }

        setActionState('reject');
        try {
            const updated = await rejectMaterialRequest(requestId, {
                observations: rejectNotes.trim(),
            });
            setDetail(updated);
            setRejectNotes('');
            Alert.alert('Solicitud rechazada', 'La solicitud fue rechazada.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo rechazar la solicitud.');
        } finally {
            setActionState(null);
        }
    }, [detail, rejectNotes, requestId]);

    const deliverableItems = useMemo(() => detail?.items ?? [], [detail?.items]);

    const handleDeliveries = useCallback(async () => {
        if (!detail || !requestId) return;

        const deliveries = deliverableItems
            .map(item => ({
                itemId: item.id,
                quantity: Number(deliveryInputs[item.id]?.quantity ?? 0),
                lotNumber: deliveryInputs[item.id]?.lotNumber.trim() || undefined,
                observations: deliveryInputs[item.id]?.observations.trim() || undefined,
            }))
            .filter(entry => Number.isFinite(entry.quantity) && entry.quantity > 0);

        if (!deliveries.length) {
            Alert.alert('Sin cantidades', 'Ingresa cantidades válidas para registrar entregas.');
            return;
        }

        setActionState('deliver');
        try {
            const updated = await deliverMaterialRequest(requestId, {
                deliveries,
                observations: globalDeliveryNotes.trim() || undefined,
            });
            setDetail(updated);
            setGlobalDeliveryNotes('');
            setDeliveryInputs(inputs => {
                const next: Record<string, DeliveryInput> = {};
                for (const item of deliverableItems) {
                    next[item.id] = { quantity: '', lotNumber: inputs[item.id]?.lotNumber ?? '', observations: '' };
                }
                return next;
            });
            Alert.alert('Entregas registradas', 'Se registraron las entregas correctamente.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron registrar las entregas.');
        } finally {
            setActionState(null);
        }
    }, [deliverableItems, deliveryInputs, globalDeliveryNotes, detail, requestId]);

    if (!requestId) {
        return (
            <View style={styles.container}>
                <View style={styles.headerBar}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Solicitud</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>No se especificó una solicitud válida.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de solicitud</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading && !isRefreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Cargando información...</Text>
                </View>
            ) : detail ? (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                >
                    <View style={styles.section}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusPill, { backgroundColor: `${statusColor}15` }]}>
                                {detail.status === 'delivered' ? (
                                    <CheckCircle2 size={18} color={statusColor} />
                                ) : detail.status === 'rejected' ? (
                                    <XCircle size={18} color={statusColor} />
                                ) : detail.status === 'sent' ? (
                                    <Truck size={18} color={statusColor} />
                                ) : detail.status === 'approved' ? (
                                    <Package size={18} color={statusColor} />
                                ) : (
                                    <Clock size={18} color={statusColor} />
                                )}
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {detail.statusLabel || detail.status}
                                </Text>
                            </View>
                            <View style={styles.priorityPill}>
                                <Text style={[styles.priorityText, { color: PRIORITY_COLORS[detail.priority] ?? '#6B7280' }]}>Prioridad {detail.priority}</Text>
                            </View>
                        </View>

                        <Text style={styles.title}>{detail.materialName || 'Solicitud de materiales'}</Text>
                        {detail.projectName ? <Text style={styles.subtitle}>{detail.projectName}</Text> : null}

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Calendar size={16} color="#6B7280" />
                                <Text style={styles.metaText}>Solicitud: {detail.requestDate || 'N/D'}</Text>
                            </View>
                            {detail.code ? (
                                <View style={styles.metaItem}>
                                    <Package size={16} color="#6B7280" />
                                    <Text style={styles.metaText}>Código: {detail.code}</Text>
                                </View>
                            ) : null}
                        </View>

                        {detail.observations ? (
                            <View style={styles.box}>
                                <Text style={styles.boxLabel}>Observaciones</Text>
                                <Text style={styles.boxText}>{detail.observations}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Materiales solicitados</Text>
                        {detail.items.map(item => {
                            const input = deliveryInputs[item.id] ?? { quantity: '', lotNumber: '', observations: '' };
                            const approved = item.approvedQty ?? item.requestedQty;
                            const delivered = item.deliveredQty ?? 0;
                            const pending = Math.max(approved - delivered, 0);
                            const pendingLabel = pending > 0 ? `${pending} ${item.unit || ''}`.trim() : 'Completo';

                            return (
                                <View key={item.id} style={styles.itemCard}>
                                    <View style={styles.itemHeader}>
                                        <Text style={styles.itemName}>{item.materialName}</Text>
                                        <Text style={styles.itemUnit}>{item.unit}</Text>
                                    </View>
                                    <View style={styles.itemStatsRow}>
                                        <Text style={styles.itemStat}>Solicitado: {item.requestedQty}</Text>
                                        <Text style={styles.itemStat}>Aprobado: {approved}</Text>
                                        <Text style={styles.itemStat}>Entregado: {delivered}</Text>
                                    </View>
                                    <Text style={styles.pendingLabel}>Pendiente: {pendingLabel}</Text>

                                    {detail.status !== 'delivered' && detail.status !== 'rejected' ? (
                                        <View style={styles.deliveryForm}>
                                            <Text style={styles.deliveryFormLabel}>Registrar entrega</Text>
                                            <View style={styles.deliveryInputsRow}>
                                                <View style={styles.deliveryInputWrapper}>
                                                    <Text style={styles.inputLabel}>Cantidad</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        keyboardType="numeric"
                                                        value={input.quantity}
                                                        onChangeText={value =>
                                                            setDeliveryInputs(state => ({
                                                                ...state,
                                                                [item.id]: {
                                                                    ...state[item.id],
                                                                    quantity: value,
                                                                    lotNumber: state[item.id]?.lotNumber ?? '',
                                                                    observations: state[item.id]?.observations ?? '',
                                                                },
                                                            }))
                                                        }
                                                        placeholder="0"
                                                        placeholderTextColor="#9CA3AF"
                                                    />
                                                </View>
                                                <View style={styles.deliveryInputWrapper}>
                                                    <Text style={styles.inputLabel}>Lote (opcional)</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        value={input.lotNumber}
                                                        onChangeText={value =>
                                                            setDeliveryInputs(state => ({
                                                                ...state,
                                                                [item.id]: {
                                                                    ...state[item.id],
                                                                    quantity: state[item.id]?.quantity ?? '',
                                                                    lotNumber: value,
                                                                    observations: state[item.id]?.observations ?? '',
                                                                },
                                                            }))
                                                        }
                                                        placeholder="Ej. LOTE-001"
                                                        placeholderTextColor="#9CA3AF"
                                                    />
                                                </View>
                                            </View>
                                            <Text style={styles.inputLabel}>Observaciones (opcional)</Text>
                                            <TextInput
                                                style={[styles.input, styles.textArea]}
                                                multiline
                                                numberOfLines={3}
                                                value={input.observations}
                                                onChangeText={value =>
                                                    setDeliveryInputs(state => ({
                                                        ...state,
                                                        [item.id]: {
                                                            ...state[item.id],
                                                            quantity: state[item.id]?.quantity ?? '',
                                                            lotNumber: state[item.id]?.lotNumber ?? '',
                                                            observations: value,
                                                        },
                                                    }))
                                                }
                                                placeholder="Notas sobre la entrega"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>

                    {detail.deliveries && detail.deliveries.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Entregas registradas</Text>
                            {detail.deliveries.map(delivery => (
                                <View key={delivery.id} style={styles.deliveryRecord}>
                                    <View style={styles.deliveryRecordRow}>
                                        <Truck size={16} color="#2563EB" />
                                        <Text style={styles.deliveryRecordText}>{delivery.quantity} unidades</Text>
                                    </View>
                                    <Text style={styles.deliveryRecordMeta}>
                                        {delivery.deliveredAt ? `Fecha: ${delivery.deliveredAt}` : 'Fecha no registrada'}
                                    </Text>
                                    {delivery.lotNumber ? (
                                        <Text style={styles.deliveryRecordMeta}>Lote: {delivery.lotNumber}</Text>
                                    ) : null}
                                    {delivery.observations ? (
                                        <Text style={styles.deliveryRecordMeta}>Notas: {delivery.observations}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Acciones</Text>

                        {(detail.status === 'pending' || detail.status === 'draft') && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Aprobar solicitud</Text>
                                <Text style={styles.cardSubtitle}>Opcionalmente agrega observaciones para la aprobación.</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    numberOfLines={3}
                                    value={approveNotes}
                                    onChangeText={setApproveNotes}
                                    placeholder="Observaciones de aprobación"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    style={[styles.primaryButton, actionState === 'approve' && styles.disabledButton]}
                                    onPress={handleApprove}
                                    disabled={actionState === 'approve'}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        {actionState === 'approve' ? 'Aprobando...' : 'Aprobar solicitud'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(detail.status === 'pending' || detail.status === 'draft' || detail.status === 'approved') && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Rechazar solicitud</Text>
                                <Text style={styles.cardSubtitle}>Indica el motivo del rechazo para notificar al solicitante.</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    numberOfLines={3}
                                    value={rejectNotes}
                                    onChangeText={setRejectNotes}
                                    placeholder="Motivo del rechazo"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    style={[styles.dangerButton, actionState === 'reject' && styles.disabledButton]}
                                    onPress={handleReject}
                                    disabled={actionState === 'reject'}
                                >
                                    <Text style={styles.dangerButtonText}>
                                        {actionState === 'reject' ? 'Rechazando...' : 'Rechazar solicitud'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(detail.status === 'approved' || detail.status === 'sent') && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Registrar entregas</Text>
                                <Text style={styles.cardSubtitle}>
                                    Completa la cantidad entregada por material y, si aplica, el número de lote.
                                </Text>

                                <Text style={styles.inputLabel}>Observaciones generales (opcional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    numberOfLines={3}
                                    value={globalDeliveryNotes}
                                    onChangeText={setGlobalDeliveryNotes}
                                    placeholder="Notas generales de la entrega"
                                    placeholderTextColor="#9CA3AF"
                                />

                                <TouchableOpacity
                                    style={[styles.primaryButton, actionState === 'deliver' && styles.disabledButton]}
                                    onPress={handleDeliveries}
                                    disabled={actionState === 'deliver'}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        {actionState === 'deliver' ? 'Guardando...' : 'Registrar entregas'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>No se encontró la información de la solicitud.</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    scrollView: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    loadingText: {
        marginTop: 12,
        color: '#4B5563',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#111827',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 1,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        marginLeft: 8,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    priorityPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    priorityText: {
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        marginTop: 4,
        color: '#6B7280',
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
    },
    metaText: {
        marginLeft: 6,
        color: '#4B5563',
    },
    box: {
        marginTop: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
    },
    boxLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 6,
    },
    boxText: {
        color: '#1F2937',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    itemCard: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    itemUnit: {
        color: '#6B7280',
    },
    itemStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    itemStat: {
        fontSize: 12,
        color: '#4B5563',
    },
    pendingLabel: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#2563EB',
    },
    deliveryForm: {
        marginTop: 12,
    },
    deliveryFormLabel: {
        fontWeight: '600',
        marginBottom: 8,
        color: '#1F2937',
    },
    deliveryInputsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    deliveryInputWrapper: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#111827',
        backgroundColor: '#FFFFFF',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    deliveryRecord: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
    },
    deliveryRecordRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deliveryRecordText: {
        marginLeft: 8,
        fontWeight: '600',
        color: '#1F2937',
    },
    deliveryRecordMeta: {
        marginTop: 4,
        fontSize: 12,
        color: '#6B7280',
    },
    card: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    cardSubtitle: {
        marginTop: 4,
        color: '#6B7280',
        lineHeight: 18,
    },
    primaryButton: {
        marginTop: 12,
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    dangerButton: {
        marginTop: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    dangerButtonText: {
        color: '#EF4444',
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
