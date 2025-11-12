import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, Camera, MapPin, Save } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { getProject } from '@/services/projects';
import { createReport } from '@/services/reports';
import { getUser } from '@/services/auth';
import type { ProjectDetail } from '@/types/domain';

const reportTypes = [
  { key: 'progress', label: 'Avance de Instalación', color: '#2563EB' },
  { key: 'incident', label: 'Incidente de Seguridad', color: '#F59E0B' },
  { key: 'quality', label: 'Pruebas y Calidad', color: '#10B981' },
];

export default function CreateReportScreen() {
  const { projectId, taskId } = useLocalSearchParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [task, setTask] = useState<any>(null);
  const [reportType, setReportType] = useState('progress');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      getProject(String(projectId))
        .then((projectData) => {
          setProject(projectData);
          if (taskId) {
            const foundTask = projectData.tasks.find(t => t.id === String(taskId));
            if (foundTask) {
              setTask(foundTask);
              // Pre-llenar el título con el nombre de la tarea
              setTitle(`Reporte de avance: ${foundTask.title}`);
            }
          }
        })
        .catch((error) => {
          console.error('Error loading project:', error);
          Alert.alert('Error', 'No se pudo cargar la información del proyecto');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [projectId, taskId]);

  const handleSave = async () => {
    if (!projectId || !taskId) {
      Alert.alert('Error', 'Faltan parámetros necesarios (proyecto o tarea)');
      return;
    }

    if (!title || !description) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const user = getUser();
    if (!user || !user.id) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createReport({
        projectId: String(projectId),
        taskId: String(taskId),
        authorId: user.id,
        title,
        description,
        difficulties: difficulties || undefined,
        materialsUsed: materialsUsed || undefined,
        observations: observations || undefined,
      });

      Alert.alert(
        'Éxito',
        'Reporte guardado correctamente',
        [
          {
            text: 'Ver Tarea',
            onPress: () => router.push({
              pathname: '/task-detail',
              params: { projectId: String(projectId), taskId: String(taskId) }
            }),
          },
          {
            text: 'Continuar',
            onPress: () => router.back(),
            style: 'default',
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating report:', error);
      Alert.alert('Error', error?.message || 'No se pudo crear el reporte');
    } finally {
      setIsSubmitting(false);
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
        <Text style={styles.headerTitle}>Crear Reporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        ) : (
          <>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Información Básica</Text>
              
              {project && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Proyecto</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>{project.name}</Text>
                  </View>
                </View>
              )}

              {task && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tarea</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>{task.title}</Text>
                  </View>
                </View>
              )}

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
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Detalles del Reporte</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe el avance, incidencias o detalles del trabajo realizado..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Dificultades Encontradas</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe cualquier dificultad o problema encontrado durante el trabajo..."
                  value={difficulties}
                  onChangeText={setDifficulties}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Materiales Utilizados</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Lista los materiales utilizados en esta tarea..."
                  value={materialsUsed}
                  onChangeText={setMaterialsUsed}
                  multiline
                  numberOfLines={4}
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
          </>
        )}

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
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
