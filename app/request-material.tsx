import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Package, Plus, Minus, Save } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { listCatalog } from '@/services/materials';
import { getMyProjects } from '@/services/projects';
import type { CatalogItem } from '@/types/domain';

let materialsStatic: CatalogItem[] = [];

const priorities = [
  { key: 'low', label: 'Baja', color: '#10B981' },
  { key: 'medium', label: 'Media', color: '#F59E0B' },
  { key: 'high', label: 'Alta', color: '#EF4444' },
];

interface MaterialRequest {
  materialId: string;
  quantity: number;
  name: string;
  unit?: string;
  sku?: string;
}

export default function RequestMaterialScreen() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const apiProjects = await getMyProjects();
        const mapped = apiProjects.map(p => ({ id: p.id, name: p.name }));
        if (!mounted) return;
        setProjects(mapped);
        if (!selectedProject && mapped[0]?.id) {
          setSelectedProject(mapped[0].id);
        }
      } catch (error) {
        console.error('Error loading projects', error);
        if (mounted) {
          Alert.alert('Error', 'No se pudieron cargar tus proyectos asignados');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedProject) {
      materialsStatic = [];
      setSelectedMaterial('');
      listCatalog(selectedProject)
        .then(items => {
          materialsStatic = items;
          setSelectedMaterial(items[0]?.id || '');
        })
        .catch(() => {});
    } else {
      materialsStatic = [];
      setSelectedMaterial('');
    }
  }, [selectedProject]);

  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  const onDatePickerChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setDeliveryDate(formatDate(date));
    }
    if (Platform.OS === 'ios') {
      setShowIosDatePicker(false);
    }
  };

  const openDatePicker = () => {
    const currentDate = deliveryDate ? new Date(deliveryDate) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: 'date',
        onChange: onDatePickerChange,
      });
    } else {
      setShowIosDatePicker(true);
    }
  };

  const addMaterialRequest = () => {
    if (!selectedMaterial || !quantity || isNaN(Number(quantity))) {
      Alert.alert('Error', 'Selecciona un material y una cantidad valida');
      return;
    }

    const material = materialsStatic.find(m => m.id === selectedMaterial);
    if (!material) {
      Alert.alert('Error', 'No se pudo obtener la información del material seleccionado');
      return;
    }

    const newRequest: MaterialRequest = {
      materialId: selectedMaterial,
      quantity: Number(quantity),
      name: material.name,
      unit: material.unit,
      sku: material.sku,
    };

    setMaterialRequests([...materialRequests, newRequest]);
    setSelectedMaterial(materialsStatic[0]?.id || '');
    setQuantity('1');
  };

  const removeMaterialRequest = (index: number) => {
    const updatedRequests = materialRequests.filter((_, i) => i !== index);
    setMaterialRequests(updatedRequests);
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedRequests = [...materialRequests];
    updatedRequests[index].quantity = newQuantity;
    setMaterialRequests(updatedRequests);
  };

  const getMaterialName = (materialId: string) => {
    const material = materialsStatic.find(m => m.id === materialId);
    return material ? material.name : '';
  };

  const getMaterialUnit = (materialId: string) => {
    const material = materialsStatic.find(m => m.id === materialId);
    return material ? material.unit : '';
  };

  const getMaterialSku = (materialId: string) => {
    const material = materialsStatic.find(m => m.id === materialId);
    return material?.sku;
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      Alert.alert('Error', 'Selecciona un proyecto');
      return;
    }

    if (!deliveryDate.trim()) {
      Alert.alert('Error', 'Selecciona la fecha de entrega');
      return;
    }

    if (materialRequests.length === 0) {
      Alert.alert('Error', 'Agrega al menos un material');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Solicitud enviada',
        'Tu solicitud fue enviada y esta en revision.',
        [
          {
            text: 'Ver solicitudes',
            onPress: () => router.push('/material-requests'),
          },
          {
            text: 'Crear nueva',
            onPress: () => {
              setSelectedProject('');
              setMaterialRequests([]);
              setPriority('medium');
              setObservations('');
              setDeliveryDate('');
            },
          },
        ]
      );
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Equipos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informacion Basica</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Asignacion de proyecto <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              {projects.length === 0 ? (
                <Text style={{ color: '#9CA3AF' }}>No tienes proyectos asignados</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {projects.map(project => (
                    <TouchableOpacity
                      key={project.id}
                      style={[styles.pickerOption, selectedProject === project.id && styles.pickerOptionActive]}
                      onPress={() => setSelectedProject(project.id)}
                    >
                      <Text style={[styles.pickerOptionText, selectedProject === project.id && styles.pickerOptionTextActive]}>
                        {project.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha de entrega <Text style={styles.required}>*</Text></Text>
            <Pressable style={styles.input} onPress={openDatePicker}>
              <Text style={{ color: deliveryDate ? '#111827' : '#9CA3AF' }}>
                {deliveryDate || 'Selecciona una fecha'}
              </Text>
            </Pressable>
            {Platform.OS === 'ios' && showIosDatePicker && (
              <DateTimePicker
                value={deliveryDate ? new Date(deliveryDate) : new Date()}
                mode="date"
                display="spinner"
                onChange={onDatePickerChange}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Prioridad <Text style={styles.required}>*</Text></Text>
            <View style={styles.typeContainer}>
              {priorities.map(prio => (
                <TouchableOpacity
                  key={prio.key}
                  style={[styles.typeOption, { borderColor: prio.color }, priority === prio.key && { backgroundColor: prio.color + '20' }]}
                  onPress={() => setPriority(prio.key)}
                >
                  <View style={[styles.typeIndicator, { backgroundColor: prio.color }]} />
                  <Text style={[styles.typeText, { color: priority === prio.key ? prio.color : '#6B7280' }]}>
                    {prio.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Agregar Equipos</Text>

          <View style={styles.addMaterialContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Equipo <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {materialsStatic.map(material => (
                    <TouchableOpacity
                      key={material.id}
                      style={[styles.pickerOption, selectedMaterial === material.id && styles.pickerOptionActive]}
                      onPress={() => setSelectedMaterial(material.id)}
                    >
                      <Text style={[styles.pickerOptionText, selectedMaterial === material.id && styles.pickerOptionTextActive]}>
                        {material.name}
                      </Text>
                      {material.sku ? (
                        <Text style={[styles.pickerSku, selectedMaterial === material.id && styles.pickerOptionTextActive]}>
                          {material.sku}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {selectedMaterial ? (
                <View style={styles.materialMeta}>
                  <Text style={styles.materialMetaText}>
                    Codigo / SKU: {getMaterialSku(selectedMaterial) || selectedMaterial}
                  </Text>
                  <Text style={styles.materialMetaText}>
                    Unidad: {getMaterialUnit(selectedMaterial) || 'N/D'}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Producto</Text>
              <Text style={styles.readonlyValue}>
                {selectedMaterial ? getMaterialName(selectedMaterial) : 'Selecciona un material'}
              </Text>
            </View>

            <View style={styles.quantityRow}>
              <Text style={styles.label}>Cantidad</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(String(Math.max(1, Number(quantity) - 1)))}>
                  <Minus size={18} color="#1F2937" />
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(String(Number(quantity) + 1))}>
                  <Plus size={18} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.unitText}>{getMaterialUnit(selectedMaterial)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={addMaterialRequest}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Agregar a la solicitud</Text>
            </TouchableOpacity>
          </View>

          {materialRequests.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen</Text>
              {materialRequests.map((item, index) => (
                <View key={index} style={styles.summaryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryName}>{item.name}</Text>
                    <Text style={styles.summaryMeta}>
                      {item.sku || item.materialId} • {item.unit || 'unidad'}
                    </Text>
                  </View>
                  <View style={styles.summaryControls}>
                    <TouchableOpacity onPress={() => updateQuantity(index, item.quantity - 1)} style={styles.smallBtn}>
                      <Minus size={16} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.summaryQty}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(index, item.quantity + 1)} style={styles.smallBtn}>
                      <Plus size={16} color="#1F2937" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeMaterialRequest(index)} style={styles.removeBtn}>
                      <Text style={styles.removeText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Observaciones</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Detalles de la instalacion, ubicacion, referencias, etc."
            multiline
            numberOfLines={4}
            value={observations}
            onChangeText={setObservations}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  formSection: { backgroundColor: '#FFFFFF', margin: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#111827' },
  formGroup: { marginBottom: 16 },
  label: { color: '#374151', marginBottom: 8, fontWeight: '600' },
  required: { color: '#EF4444' },
  input: {
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  pickerContainer: { flexDirection: 'row' },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, backgroundColor: '#F3F4F6', borderRadius: 16 },
  pickerOptionActive: { backgroundColor: COLORS.primary },
  pickerOptionText: { color: '#6B7280' },
  pickerOptionTextActive: { color: '#FFFFFF', fontWeight: '600' },
  pickerSku: { color: '#9CA3AF', fontSize: 12 },
  materialMeta: { marginTop: 8 },
  materialMetaText: { color: '#6B7280', fontSize: 12 },
  readonlyValue: { paddingVertical: 10, color: '#111827' },
  typeContainer: { flexDirection: 'row' },
  typeOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  typeIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  typeText: { fontWeight: '600' },
  addMaterialContainer: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
  quantityRow: { marginTop: 12 },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  qtyButton: { backgroundColor: '#E5E7EB', padding: 8, borderRadius: 8 },
  qtyInput: { width: 60, height: 40, textAlign: 'center', marginHorizontal: 8, borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 8, color: '#111827' },
  unitText: { marginLeft: 8, color: '#6B7280' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, backgroundColor: COLORS.primary, padding: 12, borderRadius: 12 },
  addButtonText: { color: '#FFFFFF', fontWeight: '600', marginLeft: 8 },
  summaryCard: { marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 },
  summaryTitle: { fontWeight: '700', marginBottom: 8, color: '#111827' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  summaryName: { color: '#111827', fontWeight: '600' },
  summaryMeta: { color: '#6B7280', fontSize: 12 },
  summaryControls: { flexDirection: 'row', alignItems: 'center' },
  smallBtn: { backgroundColor: '#E5E7EB', padding: 6, borderRadius: 8 },
  summaryQty: { width: 36, textAlign: 'center', color: '#111827' },
  removeBtn: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEE2E2' },
  removeText: { color: '#B91C1C', fontWeight: '600' },
  textArea: { borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 96, textAlignVertical: 'top', color: '#111827' },
  compactTextArea: { minHeight: 72 },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E5E7EB' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: 14, borderRadius: 12 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 8 },
});
