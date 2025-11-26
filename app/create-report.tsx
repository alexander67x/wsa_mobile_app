import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, MapPin, Save, Trash2, Plus, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getProject } from '@/services/projects';
import { createReport, type ReportImage, type ReportMaterial } from '@/services/reports';
import { createIncident, type IncidentImage } from '@/services/incidencias';
import { getUser } from '@/services/auth';
import { uploadImagesToCloudinary } from '@/services/cloudinary';
import { listCatalog } from '@/services/materials';
import type { ProjectDetail } from '@/types/domain';
import type { CatalogItem } from '@/types/domain';
import { Switch } from 'react-native';
import { COLORS } from '@/theme';

interface ImageWithTimestamp {
  uri: string;
  takenAt: string; // ISO 8601 format
}

interface SelectedMaterial {
  materialId: string | number;
  materialName: string;
  quantity: string;
  unit: string;
  observations: string;
}

const reportTypes = [
  { key: 'progress', label: 'Avance de Instalación', color: COLORS.primary },
  { key: 'incident', label: 'Incidente de Seguridad', color: '#F59E0B' },
  { key: 'quality', label: 'Pruebas y Calidad', color: '#10B981' },
];

export default function CreateReportScreen() {
  const { projectId, taskId, sendAsIncident: sendAsIncidentParam } = useLocalSearchParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [task, setTask] = useState<any>(null);
  const [reportType, setReportType] = useState('progress');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [observations, setObservations] = useState('');
  const [images, setImages] = useState<ImageWithTimestamp[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [catalogMaterials, setCatalogMaterials] = useState<CatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedMaterialForAdd, setSelectedMaterialForAdd] = useState<string>('');
  const [materialQuantity, setMaterialQuantity] = useState('');
  const [materialObservations, setMaterialObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [sendAsIncident, setSendAsIncident] = useState(sendAsIncidentParam === 'true');
  const [incidentType, setIncidentType] = useState<'falla_equipos' | 'accidente' | 'retraso_material' | 'problema_calidad' | 'otro'>('otro');
  const [incidentSeverity, setIncidentSeverity] = useState<'critica' | 'alta' | 'media' | 'baja'>('media');

  const handleToggleChange = (value: boolean) => {
    setSendAsIncident(value);
    // Limpiar campos específicos cuando se cambia el modo
    if (value) {
      // Cambiando a incidencia: limpiar campos de reporte
      setDifficulties('');
      setObservations('');
      setSelectedMaterials([]);
    } else {
      // Cambiando a reporte: limpiar campos de incidencia
      setIncidentType('otro');
      setIncidentSeverity('media');
    }
  };

  useEffect(() => {
    // Request camera, media library and location permissions
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Se necesitan permisos de cámara y galería para agregar imágenes al reporte.'
        );
      }
      
      if (locationStatus !== 'granted') {
        Alert.alert(
          'Permiso de ubicación',
          'Se necesita permiso de ubicación para asociar el reporte con tu ubicación actual.'
        );
      }
    })();

    if (projectId) {
      getProject(String(projectId))
        .then((projectData) => {
          setProject(projectData);
          if (taskId) {
            const foundTask = projectData.tasks.find(t => t.id === String(taskId));
            if (foundTask) {
              setTask(foundTask);
              // Pre-llenar el título con el nombre de la tarea
              if (!sendAsIncident && !sendAsIncidentParam) {
                setTitle(`Reporte de avance: ${foundTask.title}`);
              }
            }
          }
        })
        .catch((error) => {
          console.error('Error loading project:', error);
          Alert.alert('Error', 'No se pudo cargar la información del proyecto');
        })
        .finally(() => setIsLoading(false));

      // Load catalog materials with projectId
      setIsLoadingCatalog(true);
      listCatalog(String(projectId))
        .then((materials) => {
          setCatalogMaterials(materials || []);
          if (materials.length > 0) {
            setSelectedMaterialForAdd(materials[0].id);
          }
        })
        .catch((error) => {
          console.error('Error loading catalog:', error);
          // Don't show error, just continue without catalog
        })
        .finally(() => setIsLoadingCatalog(false));
    } else {
      setIsLoading(false);
    }
  }, [projectId, taskId]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const now = new Date().toISOString();
        const newImages: ImageWithTimestamp[] = result.assets.map(asset => {
          // Try to get timestamp from EXIF data, otherwise use current time
          let takenAt = now;
          if (asset.exif?.DateTimeOriginal) {
            takenAt = new Date(asset.exif.DateTimeOriginal).toISOString();
          } else if (asset.exif?.DateTime) {
            takenAt = new Date(asset.exif.DateTime).toISOString();
          }
          return {
            uri: asset.uri,
            takenAt,
          };
        });
        setImages([...images, ...newImages]);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const now = new Date().toISOString();
        const asset = result.assets[0];
        // Try to get timestamp from EXIF data, otherwise use current time
        let takenAt = now;
        if (asset.exif?.DateTimeOriginal) {
          takenAt = new Date(asset.exif.DateTimeOriginal).toISOString();
        } else if (asset.exif?.DateTime) {
          takenAt = new Date(asset.exif.DateTime).toISOString();
        }
        const newImage: ImageWithTimestamp = {
          uri: asset.uri,
          takenAt,
        };
        setImages([...images, newImage]);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que deseas eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setImages(images.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Agregar imagen',
      '¿Cómo deseas agregar la imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: takePhoto },
        { text: 'Seleccionar de galería', onPress: pickImage },
      ]
    );
  };

  const openMaterialModal = () => {
    if (catalogMaterials.length === 0) {
      Alert.alert('Sin materiales', 'No hay materiales disponibles en el catálogo');
      return;
    }
    
    // Get available materials (not already added)
    const availableMaterials = catalogMaterials.filter(
      m => !selectedMaterials.some(sm => String(sm.materialId) === String(m.id))
    );
    
    if (availableMaterials.length === 0) {
      Alert.alert('Sin materiales', 'Todos los materiales disponibles ya han sido agregados');
      return;
    }
    
    setMaterialQuantity('');
    setMaterialObservations('');
    // Select first available material
    setSelectedMaterialForAdd(availableMaterials[0].id);
    setShowMaterialModal(true);
  };

  const getSelectedMaterialData = (): CatalogItem | null => {
    return catalogMaterials.find(m => String(m.id) === String(selectedMaterialForAdd)) || null;
  };

  const addMaterial = () => {
    if (!selectedMaterialForAdd) {
      Alert.alert('Error', 'Por favor selecciona un material');
      return;
    }

    const material = getSelectedMaterialData();
    if (!material) {
      Alert.alert('Error', 'Material no encontrado');
      return;
    }

    const quantity = parseFloat(materialQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Por favor ingresa una cantidad válida');
      return;
    }

    // Check if material is already added
    if (selectedMaterials.some(m => String(m.materialId) === String(selectedMaterialForAdd))) {
      Alert.alert('Error', 'Este material ya ha sido agregado');
      return;
    }

    const newMaterial: SelectedMaterial = {
      materialId: selectedMaterialForAdd,
      materialName: material.name,
      quantity: materialQuantity,
      unit: material.unit,
      observations: materialObservations,
    };
    const updatedSelectedMaterials = [...selectedMaterials, newMaterial];
    setSelectedMaterials(updatedSelectedMaterials);
    setShowMaterialModal(false);
    
    // Select first available material for next time
    const availableMaterials = catalogMaterials.filter(
      m => !updatedSelectedMaterials.some(sm => String(sm.materialId) === String(m.id))
    );
    setSelectedMaterialForAdd(availableMaterials[0]?.id || '');
  };

  const removeMaterial = (index: number) => {
    Alert.alert(
      'Eliminar material',
      '¿Estás seguro de que deseas eliminar este material?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setSelectedMaterials(selectedMaterials.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!projectId) {
      Alert.alert('Error', 'Faltan parámetros necesarios (proyecto)');
      return;
    }

    if (!title || !description) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (sendAsIncident && !incidentType) {
      Alert.alert('Error', 'Por favor selecciona el tipo de incidencia');
      return;
    }

    const user = getUser();
    if (!user || !user.id) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario');
      return;
    }
    const ensuredEmployeeId = await (await import('@/services/auth')).ensureEmployeeId();
    const authorId = ensuredEmployeeId || user.employeeId || user.id;
    if (!authorId) {
      Alert.alert('Error', 'No se pudo obtener el código de empleado para el reporte');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get device location
      let deviceLocation: { latitude: number; longitude: number } | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          deviceLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        }
      } catch (locationError: any) {
        console.warn('Error getting location:', locationError);
        // Continue without location if it fails
      }

      let reportImages: ReportImage[] = [];

      // Upload images to Cloudinary first if there are any
      if (images.length > 0) {
        if (!deviceLocation) {
          Alert.alert(
            'Ubicación requerida',
            'Se necesita la ubicación del dispositivo para subir imágenes. ¿Deseas continuar sin imágenes?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => setIsSubmitting(false) },
              { text: 'Continuar sin imágenes', onPress: () => {} },
            ]
          );
          return;
        }

        setIsUploadingImages(true);
        try {
          const imageUris = images.map(img => img.uri);
          const imageUrls = await uploadImagesToCloudinary(imageUris, 'reports');
          
          // Map uploaded URLs with location and timestamps
          reportImages = imageUrls.map((url, index) => ({
            url,
            latitude: deviceLocation!.latitude,
            longitude: deviceLocation!.longitude,
            takenAt: images[index].takenAt,
          }));
        } catch (uploadError: any) {
          console.error('Error uploading images:', uploadError);
          Alert.alert(
            'Error al subir imágenes',
            uploadError?.message || 'No se pudieron subir las imágenes. ¿Deseas continuar sin las imágenes?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => setIsSubmitting(false) },
              { text: 'Continuar sin imágenes', onPress: () => {} },
            ]
          );
          setIsUploadingImages(false);
          return;
        } finally {
          setIsUploadingImages(false);
        }
      }

      if (sendAsIncident) {
        // Create incident instead of report
        const incidentImages: IncidentImage[] = reportImages.map((img) => ({
          url: img.url,
          latitude: img.latitude,
          longitude: img.longitude,
          takenAt: img.takenAt,
          // description can be added later if needed
        }));

        await createIncident({
          projectId: String(projectId),
          taskId: taskId ? (Number(taskId) || String(taskId)) : undefined,
          authorId: Number(authorId) || String(authorId),
          title,
          description,
          tipo: incidentType,
          severidad: incidentSeverity,
          latitude: deviceLocation?.latitude,
          longitude: deviceLocation?.longitude,
          images: incidentImages.length > 0 ? incidentImages : undefined,
        });

        Alert.alert(
          'Éxito',
          'Incidencia creada correctamente',
          [
            ...(taskId ? [{
              text: 'Ver Tarea',
              onPress: () => router.push({
                pathname: '/task-detail',
                params: { projectId: String(projectId), taskId: String(taskId) }
              }),
            }] : []),
            {
              text: 'Continuar',
              onPress: () => router.back(),
              style: 'default',
            },
          ]
        );
      } else {
        // Create normal report
        const reportMaterials: ReportMaterial[] = selectedMaterials.map(m => ({
          materialId: Number(m.materialId) || m.materialId,
          quantity: parseFloat(m.quantity),
          unit: m.unit,
          observations: m.observations || undefined,
        }));

        await createReport({
          projectId: String(projectId),
          taskId: taskId ? (Number(taskId) || String(taskId)) : undefined,
          authorId: Number(authorId) || String(authorId),
          title,
          description,
          difficulties: difficulties || undefined,
          observations: observations || undefined,
          images: reportImages.length > 0 ? reportImages : undefined,
          materials: reportMaterials.length > 0 ? reportMaterials : undefined,
        });

        Alert.alert(
          'Éxito',
          'Reporte guardado correctamente',
          [
            ...(taskId ? [{
              text: 'Ver Tarea',
              onPress: () => router.push({
                pathname: '/task-detail',
                params: { projectId: String(projectId), taskId: String(taskId) }
              }),
            }] : []),
            {
              text: 'Continuar',
              onPress: () => router.back(),
              style: 'default',
            },
          ]
        );
      }
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
        <Text style={styles.headerTitle}>
          {sendAsIncident ? 'Crear Incidencia' : 'Crear Reporte'}
        </Text>
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

              {/* Solo mostrar toggle si no viene desde select-project-type */}
              {!sendAsIncidentParam && (
                <View style={styles.formGroup}>
                  <View style={styles.switchContainer}>
                    <View style={styles.switchLabelContainer}>
                      <Text style={styles.label}>Enviar como Incidencia</Text>
                      <Text style={styles.switchHint}>
                        {sendAsIncident 
                          ? 'Se creará una incidencia con campos específicos' 
                          : 'Se creará un reporte normal con campos de avance'}
                      </Text>
                    </View>
                    <Switch
                      value={sendAsIncident}
                      onValueChange={handleToggleChange}
                      trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
                      thumbColor={sendAsIncident ? '#FFFFFF' : '#F3F4F6'}
                    />
                  </View>
                </View>
              )}
            </View>

            {sendAsIncident ? (
              // Formulario de Incidencia
              <>
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Detalles de la Incidencia</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Título de la Incidencia <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ingresa el título de la incidencia"
                      value={title}
                      onChangeText={setTitle}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Descripción <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Describe la incidencia en detalle..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tipo de Incidencia <Text style={styles.required}>*</Text></Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerContainer}>
                      {[
                        { key: 'falla_equipos', label: 'Falla de Equipos' },
                        { key: 'accidente', label: 'Accidente' },
                        { key: 'retraso_material', label: 'Retraso de Material' },
                        { key: 'problema_calidad', label: 'Problema de Calidad' },
                        { key: 'otro', label: 'Otro' },
                      ].map((type) => (
                        <TouchableOpacity
                          key={type.key}
                          style={[
                            styles.pickerOption,
                            incidentType === type.key && styles.pickerOptionActive
                          ]}
                          onPress={() => setIncidentType(type.key as any)}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            incidentType === type.key && styles.pickerOptionTextActive
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Severidad</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerContainer}>
                      {[
                        { key: 'critica', label: 'Crítica', color: '#DC2626' },
                        { key: 'alta', label: 'Alta', color: '#F59E0B' },
                        { key: 'media', label: 'Media', color: COLORS.primaryMuted },
                        { key: 'baja', label: 'Baja', color: '#10B981' },
                      ].map((severity) => (
                        <TouchableOpacity
                          key={severity.key}
                          style={[
                            styles.pickerOption,
                            incidentSeverity === severity.key && styles.pickerOptionActive
                          ]}
                          onPress={() => setIncidentSeverity(severity.key as any)}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            incidentSeverity === severity.key && styles.pickerOptionTextActive
                          ]}>
                            {severity.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </>
            ) : (
              // Formulario de Reporte Normal
              <>
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Detalles del Reporte</Text>

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
                
                    <TouchableOpacity
                      style={styles.addMaterialButton}
                      onPress={openMaterialModal}
                      disabled={isLoadingCatalog || catalogMaterials.length === 0}
                    >
                      <Plus size={20} color={COLORS.primary} />
                      <Text style={styles.addMaterialButtonText}>
                        {isLoadingCatalog ? 'Cargando catálogo...' : 'Agregar Material'}
                      </Text>
                    </TouchableOpacity>

                    {selectedMaterials.length > 0 && (
                      <View style={styles.materialsList}>
                        {selectedMaterials.map((material, index) => (
                          <View key={index} style={styles.materialItem}>
                            <View style={styles.materialInfo}>
                              <Text style={styles.materialName}>{material.materialName}</Text>
                              <Text style={styles.materialDetails}>
                                {material.quantity} {material.unit}
                                {material.observations && ` • ${material.observations}`}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeMaterialButton}
                              onPress={() => removeMaterial(index)}
                            >
                              <X size={18} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {catalogMaterials.length > 0 && (
                      <Text style={styles.materialHint}>
                        {catalogMaterials.length} material{catalogMaterials.length !== 1 ? 'es' : ''} disponible{catalogMaterials.length !== 1 ? 's' : ''} en el catálogo
                      </Text>
                    )}
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

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Evidencias Fotográficas</Text>
              
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
                  <Camera size={20} color={COLORS.primary} />
                  <Text style={styles.addImageButtonText}>Agregar Imágenes</Text>
                </TouchableOpacity>
              </View>

              {images.length > 0 && (
                <View style={styles.imagesContainer}>
                  <Text style={styles.imagesCountText}>
                    {images.length} {images.length === 1 ? 'imagen' : 'imágenes'} seleccionada{images.length === 1 ? '' : 's'}
                  </Text>
                  <View style={styles.imagesGrid}>
                    {images.map((image, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Trash2 size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.actionSection}>
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
              {isUploadingImages 
                ? 'Subiendo imágenes...' 
                : isSubmitting 
                ? 'Guardando...' 
                : sendAsIncident 
                ? 'Guardar Incidencia' 
                : 'Guardar Reporte'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Material Selection Modal */}
      <Modal
        visible={showMaterialModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMaterialModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Material</Text>
              <TouchableOpacity
                onPress={() => setShowMaterialModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>
                  Seleccionar Material <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {catalogMaterials
                      .filter(m => !selectedMaterials.some(sm => String(sm.materialId) === String(m.id)))
                      .map(material => (
                        <TouchableOpacity
                          key={material.id}
                          style={[
                            styles.pickerOption,
                            String(selectedMaterialForAdd) === String(material.id) && styles.pickerOptionActive
                          ]}
                          onPress={() => setSelectedMaterialForAdd(material.id)}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            String(selectedMaterialForAdd) === String(material.id) && styles.pickerOptionTextActive
                          ]}>
                            {material.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
                {catalogMaterials.filter(m => !selectedMaterials.some(sm => String(sm.materialId) === String(m.id))).length === 0 && (
                  <Text style={styles.modalWarning}>
                    Todos los materiales disponibles ya han sido agregados
                  </Text>
                )}
              </View>

              {(() => {
                const availableMaterials = catalogMaterials.filter(
                  m => !selectedMaterials.some(sm => String(sm.materialId) === String(m.id))
                );
                const selectedMaterial = availableMaterials.find(m => String(m.id) === String(selectedMaterialForAdd)) || availableMaterials[0];
                
                if (!selectedMaterial) {
                  return (
                    <View style={styles.modalFormGroup}>
                      <Text style={styles.modalWarning}>
                        No hay materiales disponibles para agregar
                      </Text>
                    </View>
                  );
                }

                return (
                  <>
                    <View style={styles.modalFormGroup}>
                      <Text style={styles.modalLabel}>
                        Cantidad ({selectedMaterial.unit}) <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Ingresa la cantidad"
                        value={materialQuantity}
                        onChangeText={setMaterialQuantity}
                        keyboardType="decimal-pad"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={styles.modalFormGroup}>
                      <Text style={styles.modalLabel}>Observaciones (opcional)</Text>
                      <TextInput
                        style={[styles.modalInput, styles.modalTextArea]}
                        placeholder="Ej: Material usado en cimientos"
                        value={materialObservations}
                        onChangeText={setMaterialObservations}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.modalAddButton, (!materialQuantity || parseFloat(materialQuantity) <= 0) && styles.modalAddButtonDisabled]}
                      onPress={addMaterial}
                      disabled={!materialQuantity || parseFloat(materialQuantity) <= 0 || !selectedMaterialForAdd}
                    >
                      <Text style={styles.modalAddButtonText}>Agregar</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  pickerOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
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
  saveButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imageButtonsContainer: {
    marginBottom: 16,
  },
  addImageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySurface, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, gap: 8 },
  addImageButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  imagesContainer: {
    marginTop: 16,
  },
  imagesCountText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMaterialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySurface, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, gap: 8, marginBottom: 12 },
  addMaterialButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  materialsList: {
    marginTop: 12,
    gap: 12,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  materialDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  removeMaterialButton: {
    padding: 8,
  },
  materialHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalFormGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  modalTextArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  modalWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  modalAddButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  modalAddButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
