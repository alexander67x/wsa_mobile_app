import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { User, LogOut, Phone, Mail, MapPin } from 'lucide-react-native';

const worker = {
  name: 'Juan Pérez',
  role: 'Personal de Obra',
  email: 'jperez@securetech.pe',
  phone: '+51 987 654 321',
  company: 'SecureTech Solutions',
  location: 'Lima, Perú',
  project: 'Green Tower',
  supervisor: 'Supervisor J. Salazar',
};

export default function WorkerProfile() {
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    const Auth = await import('@/services/auth');
    await Auth.logout();
    setLoggingOut(false);
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}><User size={40} color="#FFFFFF" /></View>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.role}>{worker.role}</Text>
          <Text style={styles.company}>{worker.company}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Asignación</Text>
          <Text style={styles.item}>Proyecto: {worker.project}</Text>
          <Text style={styles.item}>Supervisor: {worker.supervisor}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Contacto</Text>
          <View style={styles.row}><Mail size={18} color="#6B7280" /><Text style={styles.rowText}>{worker.email}</Text></View>
          <View style={styles.row}><Phone size={18} color="#6B7280" /><Text style={styles.rowText}>{worker.phone}</Text></View>
          <View style={styles.row}><MapPin size={18} color="#6B7280" /><Text style={styles.rowText}>{worker.location}</Text></View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} disabled={loggingOut}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{loggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 24, backgroundColor: '#FFFFFF' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  role: { color: '#6B7280' },
  company: { color: '#6B7280' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginHorizontal: 16, marginTop: 16 },
  title: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  item: { color: '#1F2937', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowText: { marginLeft: 10, color: '#1F2937' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, margin: 16 },
  logoutText: { marginLeft: 8, color: '#EF4444', fontWeight: '600' },
});

