import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, User, Lock } from 'lucide-react-native';

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
      if (token) router.replace(role === 'worker' ? '/(worker)' : '/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>SECURITY OPS</Text>
          <Text style={styles.logoSubtext}>FIELD MANAGER</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Iniciar Sesión</Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#9CA3AF"
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

        <TouchableOpacity style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} onPress={handleLogin} disabled={isLoading}>
          <Text style={styles.loginButtonText}>{isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</Text>
        </TouchableOpacity>

        <View style={styles.credentialsContainer}>
          <Text style={styles.credentialsTitle}>Credenciales de prueba:</Text>
          <Text style={styles.credentialsText}>Supervisor → usuario: admin / clave: 123456</Text>
          <Text style={styles.credentialsText}>Personal de obra → usuario: obra / clave: 123456</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  logoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  logoPlaceholder: { backgroundColor: '#2563EB', padding: 24, borderRadius: 16, alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },
  logoSubtext: { fontSize: 12, color: '#BFDBFE', letterSpacing: 2, marginTop: 4 },
  formContainer: { flex: 1.5, backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 32 },
  inputContainer: { marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  eyeIcon: { padding: 4 },
  checkboxContainer: { marginBottom: 24 },
  checkbox: { flexDirection: 'row', alignItems: 'center' },
  checkboxBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkboxMark: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 16, color: '#6B7280' },
  loginButton: { backgroundColor: '#2563EB', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  loginButtonDisabled: { backgroundColor: '#9CA3AF' },
  loginButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  credentialsContainer: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, alignItems: 'center' },
  credentialsTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  credentialsText: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
});

