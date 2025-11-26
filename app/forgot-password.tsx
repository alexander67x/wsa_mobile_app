import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Mail, FileText } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!email) {
      Alert.alert('Falta correo', 'Coloca tu gmail para continuar.');
      return;
    }
    Alert.alert('Solicitud enviada', 'Revisaremos tu solicitud y te contactaremos.');
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recuperar acceso</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Coloca tu gmail</Text>
        <View style={styles.inputWrapper}>
          <Mail size={20} color={COLORS.mutedText} />
          <TextInput
            style={styles.input}
            placeholder="tu-correo@gmail.com"
            placeholderTextColor={COLORS.mutedText}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Justificación</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <FileText size={20} color={COLORS.mutedText} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cuéntanos por qué necesitas restablecer tu contraseña"
            placeholderTextColor={COLORS.mutedText}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Enviar solicitud</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primarySurface },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  body: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: COLORS.primaryBorder, paddingHorizontal: 16, paddingVertical: 12, shadowColor: COLORS.primaryShadow, shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  textAreaWrapper: { alignItems: 'flex-start' },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  textArea: { minHeight: 100, textAlignVertical: 'top', paddingTop: 6 },
  submitButton: { marginTop: 28, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: COLORS.primaryShadow, shadowOpacity: 0.16, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10, elevation: 4 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

