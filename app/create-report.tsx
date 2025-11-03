import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileText, Camera, MapPin, Save } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const reportTypes = [
  { key: 'progress', label: 'Avance de Instalación', color: '#2563EB' },
  { key: 'incident', label: 'Incidente de Seguridad', color: '#F59E0B' },
  { key: 'quality', label: 'Pruebas y Calidad', color: '#10B981' },
];

const projects = [
  { id: '1', name: 'Green Tower' },
  { id: '2', name: 'Data Center Norte' },
  { id: '3', name: 'Parque Industrial Orión' },
  { id: '4', name: 'Campus Corporativo Andina' },
];

export default function CreateReportScreen() {
  const [selectedProject, setSelectedProject] = useState('');
  const [reportType, setReportType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!selectedProject || !reportType || !title || !description) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (reportType === 'progress' && (!progress || isNaN(Number(progress)))) {
      Alert.alert('Error', 'Por favor ingresa un porcentaje de avance válido');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Éxito',
        'Reporte guardado correctamente',
        [
          {
            text: 'Agregar Evidencias',
            onPress: () => router.push('/attach-evidence'),
          },
          {
            text: 'Continuar',
            onPress: () => router.back(),
            style: 'default',
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
        <Text style={styles.headerTitle}>Crear Reporte</Text>
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
            <Text style={styles.label}>Tipo de Reporte <Text style={styles.required}>*</Text></Text>
            <View style={styles.typeContainer}>
              {reportTypes.map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    { borderColor: type.color },
                    reportType === type.key && { backgroundColor: type.color + '20' }
                  ]}
                  onPress={() => setReportType(type.key)}
                >
                  <View style={[styles.typeIndicator, { backgroundColor: type.color }]} />
                  <Text style={[
                    styles.typeText,
                    { color: reportType === type.key ? type.color : '#6B7280' }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Título del Reporte <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el título del reporte"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {reportType === 'progress' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Porcentaje de Avance <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="0-100"
                value={progress}
                onChangeText={setProgress}
                keyboardType="numeric"
                maxLength={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe los detalles del reporte..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Observaciones Adicionales</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observaciones, recomendaciones o comentarios adicionales..."
              value={observations}
              onChangeText={setObservations}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.evidenceButton}>
            <Camera size={20} color="#6B7280" />
            <Text style={styles.evidenceButtonText}>Agregar evidencias más tarde</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.locationButton}>
            <MapPin size={20} color="#6B7280" />
            <Text style={styles.locationButtonText}>Ubicación será agregada automáticamente</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Guardando...' : 'Guardar Reporte'}
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
  actionSection: {
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
  evidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  evidenceButtonText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  locationButtonText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
