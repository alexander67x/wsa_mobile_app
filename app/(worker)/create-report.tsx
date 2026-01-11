import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Save, Camera } from 'lucide-react-native';
import { addCard } from '@/services/kanban';
import { getUser } from '@/services/auth';
import { router } from 'expo-router';
import { COLORS } from '@/theme';
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';

export default function WorkerCreateReport() {
  const [description, setDescription] = useState('');
  const [photosCount, setPhotosCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { scrollRef, handleInputFocus, keyboardPadding } = useKeyboardScroll(48, 24);

  const takePhoto = () => {
    // Placeholder para demo – integrar expo-camera o image-picker cuando se conecte
    setPhotosCount(c => c + 1);
  };

  const handleSubmit = async () => {
    if (!description || photosCount === 0) {
      Alert.alert('Faltan datos', 'Agrega al menos una foto y una descripción.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(async () => {
      setIsSubmitting(false);
      const me = getUser();
      const authorId = me?.employeeId || me?.id;
      await addCard('En revisión', {
        id: String(Date.now()),
        title: description.trim().slice(0, 60) || 'Reporte',
        authorId,
        authorName: me?.name,
        description,
        photos: photosCount > 0 ? ['https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=400'] : [],
        createdAt: new Date().toISOString().slice(0, 10),
      });
      Alert.alert('Enviado', 'Reporte enviado al supervisor para revisión.', [
        { text: 'OK', onPress: () => router.push('/(worker)/kanban') },
      ]);
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Nuevo Reporte</Text></View>
      <KeyboardAvoidingView
        style={styles.bodyWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: keyboardPadding }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.card}>
          <Text style={styles.label}>Proyecto</Text>
          <Text style={styles.value}>Green Tower</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe la incidencia o avance..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            onFocus={handleInputFocus}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Evidencias fotográficas</Text>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Camera size={20} color="#FFFFFF" />
            <Text style={styles.photoBtnText}>Tomar foto</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Fotos añadidas: {photosCount}</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} disabled={isSubmitting} onPress={handleSubmit}>
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>{isSubmitting ? 'Enviando...' : 'Enviar Reporte'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  body: { flex: 1 },
  bodyWrapper: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8 },
  value: { color: '#111827' },
  textArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, minHeight: 120, textAlignVertical: 'top', color: '#111827' },
  photoBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, height: 44, borderRadius: 10 },
  photoBtnText: { color: '#FFFFFF', fontWeight: '600' },
  hint: { marginTop: 8, color: '#6B7280' },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E5E7EB' },
  submitBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, height: 48, borderRadius: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
