import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Package, Plus, Minus, Save } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const projects = [
  { id: '1', name: 'Edificio Residencial Norte' },
  { id: '2', name: 'Centro Comercial Plaza' },
  { id: '3', name: 'Complejo Deportivo' },
  { id: '4', name: 'Oficinas Corporativas' },
];

const materials = [
  { id: '1', name: 'Cemento Portland', unit: 'sacos' },
  { id: '2', name: 'Varillas de acero 3/8"', unit: 'unidades' },
  { id: '3', name: 'Varillas de acero 1/2"', unit: 'unidades' },
  { id: '4', name: 'Cables eléctricos 12 AWG', unit: 'metros' },
  { id: '5', name: 'Cables eléctricos 14 AWG', unit: 'metros' },
  { id: '6', name: 'Pintura exterior blanca', unit: 'galones' },
  { id: '7', name: 'Pintura interior', unit: 'galones' },
  { id: '8', name: 'Tubería PVC 4"', unit: 'metros' },
  { id: '9', name: 'Tubería PVC 2"', unit: 'metros' },
  { id: '10', name: 'Ladrillos King Kong', unit: 'millares' },
];

const priorities = [
  { key: 'low', label: 'Baja', color: '#10B981' },
  { key: 'medium', label: 'Media', color: '#F59E0B' },
  { key: 'high', label: 'Alta', color: '#EF4444' },
];

interface MaterialRequest {
  materialId: string;
  quantity: number;
}

export default function RequestMaterialScreen() {
  const [selectedProject, setSelectedProject] = useState('');
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [priority, setPriority] = useState('medium');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMaterialRequest = () => {
    if (!selectedMaterial || !quantity || isNaN(Number(quantity))) {
      Alert.alert('Error', 'Por favor selecciona un material y cantidad válida');
      return;
    }

    const newRequest: MaterialRequest = {
      materialId: selectedMaterial,
      quantity: Number(quantity),
    };

    setMaterialRequests([...materialRequests, newRequest]);
    setSelectedMaterial('');
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
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : '';
  };

  const getMaterialUnit = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    return material ? material.unit : '';
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      Alert.alert('Error', 'Por favor selecciona un proyecto');
      return;
    }

    if (materialRequests.length === 0) {
      Alert.alert('Error', 'Por favor agrega al menos un material');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Solicitud Enviada',
        'Tu solicitud de materiales ha sido enviada exitosamente y está siendo revisada.',
        [
          {
            text: 'Ver Solicitudes',
            onPress: () => router.push('/(tabs)/materials'),
          },
          {
            text: 'Crear Nueva',
            onPress: () => {
              // Reset form
              setSelectedProject('');
              setMaterialRequests([]);
              setPriority('medium');
              setObservations('');
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Material</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Proyecto <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {projects.map(project => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.pickerOption,
                      selectedProject === project.id && styles.pickerOptionActive
                    ]}
                    onPress={() => setSelectedProject(project.id)}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      selectedProject === project.id && styles.pickerOptionTextActive
                    ]}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Prioridad <Text style={styles.required}>*</Text></Text>
            <View style={styles.typeContainer}>
              {priorities.map(prio => (
                <TouchableOpacity
                  key={prio.key}
                  style={[
                    styles.typeOption,
                    { borderColor: prio.color },
                    priority === prio.key && { backgroundColor: prio.color + '20' }
                  ]}
                  onPress={() => setPriority(prio.key)}
                >
                  <View style={[styles.typeIndicator, { backgroundColor: prio.color }]} />
                  <Text style={[
                    styles.typeText,
                    { color: priority === prio.key ? prio.color : '#6B7280' }
                  ]}>
                    {prio.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Agregar Materiales</Text>
          
          <View style={styles.addMaterialContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Material</Text>
              <View style={styles.materialPickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {materials.map(material => (
                    <TouchableOpacity
                      key={material.id}
                      style={[
                        styles.materialOption,
                        selectedMaterial === material.id && styles.materialOptionActive
                      ]}
                      onPress={() => setSelectedMaterial(material.id)}
                    >
                      <Package size={16} color={selectedMaterial === material.id ? '#FFFFFF' : '#6B7280'} />
                      <Text style={[
                        styles.materialOptionText,
                        selectedMaterial === material.id && styles.materialOptionTextActive
                      ]}>
                        {material.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.quantityRow}>
              <View style={styles.quantityContainer}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addMaterialRequest}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {materialRequests.length > 0 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Materiales Solicitados ({materialRequests.length})
            </Text>
            
            {materialRequests.map((request, index) => (
              <View key={index} style={styles.materialRequestCard}>
                <View style={styles.materialRequestHeader}>
                  <View style={styles.materialRequestInfo}>
                    <Text style={styles.materialRequestName}>
                      {getMaterialName(request.materialId)}
                    </Text>
                    <Text style={styles.materialRequestUnit}>
                      {getMaterialUnit(request.materialId)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeMaterialRequest(index)}
                  >
                    <Minus size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.quantityControls}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(index, request.quantity - 1)}
                  >
                    <Minus size={16} color="#6B7280" />
                  </TouchableOpacity>
                  <Text style={styles.quantityDisplay}>{request.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(index, request.quantity + 1)}
                  >
                    <Plus size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Observaciones Adicionales</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Detalles o comentarios especiales</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Necesario para entrega antes del viernes, material de alta calidad requerido..."
              value={observations}
              onChangeText={setObservations}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud'}
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
  formSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  pickerContainer: {
    maxHeight: 60,
  },
  pickerOption: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 120,
  },
  pickerOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  typeContainer: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  addMaterialContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  materialPickerContainer: {
    maxHeight: 60,
  },
  materialOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 140,
  },
  materialOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  materialOptionText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  materialOptionTextActive: {
    color: '#FFFFFF',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialRequestCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  materialRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  materialRequestInfo: {
    flex: 1,
  },
  materialRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  materialRequestUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});