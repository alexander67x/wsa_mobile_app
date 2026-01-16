import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { getMyProjects } from '@/services/projects';
import type { Project } from '@/types/domain';
import { COLORS } from '@/theme';
import { getRoleSlug } from '@/services/auth';

export default function SelectProjectTypeScreen() {
  const roleSlug = getRoleSlug();
  const isIncidentOnlyRole = roleSlug === 'responsable_proyecto' || roleSlug === 'supervisor';
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'report' | 'incident' | null>(isIncidentOnlyRole ? 'incident' : null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const myProjects = await getMyProjects();
      setProjects(myProjects);
      
      if (myProjects.length === 0) {
        Alert.alert(
          'Sin proyectos',
          'No tienes proyectos asignados. Contacta a tu supervisor para que te asigne a un proyecto.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'No se pudieron cargar los proyectos');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedProject) {
      Alert.alert('Error', 'Por favor selecciona un proyecto');
      return;
    }

    if (!selectedType) {
      Alert.alert('Error', 'Por favor selecciona si deseas crear un reporte o una incidencia');
      return;
    }

    if (selectedType === 'incident') {
      router.push({
        pathname: '/create-report',
        params: { 
          projectId: selectedProject,
          sendAsIncident: 'true'
        }
      });
    } else {
      router.push({
        pathname: '/create-report',
        params: { 
          projectId: selectedProject
        }
      });
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
        <Text style={styles.headerTitle}>Nuevo Reporte/Incidencia</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando proyectos...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Paso 1: Selecciona un Proyecto</Text>
              <Text style={styles.sectionSubtitle}>
                Elige el proyecto al que pertenece el reporte o incidencia
              </Text>

              {projects.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No tienes proyectos asignados</Text>
                </View>
              ) : (
                <View style={styles.projectsList}>
                  {projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.projectCard,
                        selectedProject === project.id && styles.projectCardSelected
                      ]}
                      onPress={() => setSelectedProject(project.id)}
                    >
                      <View style={styles.projectInfo}>
                        <Text style={[
                          styles.projectName,
                          selectedProject === project.id && styles.projectNameSelected
                        ]}>
                          {project.name}
                        </Text>
                        <Text style={[
                          styles.projectLocation,
                          selectedProject === project.id && styles.projectLocationSelected
                        ]}>
                          {project.location}
                        </Text>
                        {project.dueDate && (
                          <Text style={styles.projectDate}>
                            Fecha límite: {new Date(project.dueDate).toLocaleDateString('es-ES')}
                          </Text>
                        )}
                      </View>
                      {selectedProject === project.id && (
                        <View style={styles.checkmark}>
                          <CheckCircle size={24} color={COLORS.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {selectedProject && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Paso 2: Selecciona el Tipo</Text>
                <Text style={styles.sectionSubtitle}>
                  ¿Qué deseas crear?
                </Text>

                <View style={styles.typeContainer}>
                  {!isIncidentOnlyRole && (
                    <TouchableOpacity
                      style={[
                        styles.typeCard,
                        selectedType === 'report' && styles.typeCardSelected
                      ]}
                      onPress={() => setSelectedType('report')}
                    >
                      <View style={[
                        styles.typeIconContainer,
                        selectedType === 'report' && styles.typeIconContainerSelected
                      ]}>
                        <FileText size={32} color={selectedType === 'report' ? '#FFFFFF' : COLORS.primary} />
                      </View>
                      <Text style={[
                        styles.typeTitle,
                        selectedType === 'report' && styles.typeTitleSelected
                      ]}>
                        Reporte de Avance
                      </Text>
                      <Text style={styles.typeDescription}>
                        Documenta el progreso del trabajo, materiales utilizados y observaciones
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.typeCard,
                      selectedType === 'incident' && styles.typeCardSelected
                    ]}
                    onPress={() => setSelectedType('incident')}
                  >
                    <View style={[
                      styles.typeIconContainer,
                      selectedType === 'incident' && styles.typeIconContainerSelected,
                      { backgroundColor: selectedType === 'incident' ? '#F59E0B' : '#FEF3C7' }
                    ]}>
                      <AlertTriangle size={32} color={selectedType === 'incident' ? '#FFFFFF' : '#F59E0B'} />
                    </View>
                    <Text style={[
                      styles.typeTitle,
                      selectedType === 'incident' && styles.typeTitleSelected
                    ]}>
                      Incidencia
                    </Text>
                    <Text style={styles.typeDescription}>
                      Reporta problemas, fallas, accidentes o situaciones que requieren atención
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            )}

            {selectedProject && selectedType && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={handleContinue}
                >
                  <Text style={styles.continueButtonText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySurface },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  projectNameSelected: { color: COLORS.primary },
  projectLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  projectLocationSelected: { color: COLORS.primaryMuted },
  projectDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  checkmark: {
    marginLeft: 12,
  },
  typeContainer: {
    gap: 16,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySurface },
  typeIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primarySurface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  typeIconContainerSelected: { backgroundColor: COLORS.primary },
  typeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeTitleSelected: { color: COLORS.primary },
  typeDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  continueButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});



