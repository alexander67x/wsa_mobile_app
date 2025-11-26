import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, User, Lock } from 'lucide-react-native';
import { registerDevicePushToken } from '@/services/notifications';
import { COLORS } from '@/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const Auth = await import('@/services/auth');
      const { token, role } = await Auth.login(username, password);
      if (token) {
        await registerDevicePushToken();
        router.replace(role === 'worker' ? '/(worker)' : '/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Credenciales invalidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroShapes}>
            <View style={[styles.heroCircle, styles.heroCircleSmall]} />
            <View style={[styles.heroCircle, styles.heroCircleLarge]} />
          </View>
          <Text style={styles.heroWelcome}>Bienvenido a</Text>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>SECURITY OPS</Text>
            <Text style={styles.heroSubtitle}>GESTOR DE CAMPO</Text>
          </View>
          <Text style={styles.heroDescription}>
            Supervisa las operaciones con una experiencia mas limpia y ordenada.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>Iniciar Sesion</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Usuario</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu usuario"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity style={styles.checkbox} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkboxBox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Recordarme</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPasswordWrapper}>
            <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  hero: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 48, backgroundColor: COLORS.primary },
  heroShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 200,
  },
  heroCircleSmall: {
    width: 120,
    height: 120,
    top: 40,
    left: 20,
  },
  heroCircleLarge: {
    width: 200,
    height: 200,
    right: -30,
    top: 10,
  },
  heroWelcome: { color: '#FFEBD6', fontSize: 18, marginBottom: 16 },
  heroCard: {
    backgroundColor: COLORS.primaryDark,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  heroSubtitle: { color: '#FFD1A3', fontSize: 12, marginTop: 4, letterSpacing: 3 },
  heroDescription: { color: '#FFEBD6', marginTop: 20, fontSize: 14, lineHeight: 20 },
  formCard: {
    marginTop: -30,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 24 },
  inputContainer: { marginBottom: 18 },
  inputLabel: { color: '#475569', marginBottom: 8, fontSize: 14, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFAF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE6CC',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0F172A' },
  eyeIcon: { padding: 4 },
  checkboxContainer: { marginBottom: 24 },
  checkbox: { flexDirection: 'row', alignItems: 'center' },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxMark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { fontSize: 15, color: '#475569' },
  forgotPasswordWrapper: { alignItems: 'flex-end', marginBottom: 12 },
  forgotPassword: { color: COLORS.primary, fontWeight: '700' },
  loginButton: { backgroundColor: COLORS.primaryDark, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginButtonDisabled: { backgroundColor: '#94A3B8' },
  loginButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  credentialsContainer: {
    backgroundColor: COLORS.primarySurface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  credentialsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  credentialsText: { fontSize: 14, color: COLORS.text, marginBottom: 4, textAlign: 'center' },
});
