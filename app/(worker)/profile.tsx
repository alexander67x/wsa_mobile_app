import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { User, LogOut, Phone, Mail, MapPin, ClipboardList, Shield } from 'lucide-react-native';
import { COLORS } from '@/theme';

interface ProfileData {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  location?: string;
  department?: string;
  company?: string;
  employeeId?: string;
}

function mapProfileData(me: any, authUser: any, permissions: string[]): ProfileData {
  const employee = me?.empleado || me?.employee || null;
  return {
    name: me?.name || me?.nombre || employee?.name || employee?.nombre || authUser?.name || '',
    role: me?.cargo || me?.puesto || me?.role?.nombre || me?.role?.name || employee?.cargo || employee?.puesto || authUser?.role || '',
    email: me?.email || me?.correo || employee?.email || employee?.correo || '',
    phone: me?.telefono || me?.phone || me?.celular || employee?.telefono || employee?.phone || '',
    location: me?.ubicacion || me?.location || employee?.ubicacion || employee?.location || '',
    department: me?.departamento || me?.department || employee?.departamento || employee?.area || '',
    company: me?.empresa || me?.company || employee?.empresa || employee?.company || '',
    employeeId: authUser?.employeeId || me?.employeeId || employee?.cod_empleado || employee?.codEmpleado || employee?.id || '',
  };
}

export default function WorkerProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const Auth = await import('@/services/auth');
        const me = await Auth.fetchMe();
        if (!isMounted) return;
        setProfile(mapProfileData(me, Auth.getUser(), Auth.getPermissions()));
      } catch (err) {
        console.error('Error cargando perfil de trabajador', err);
        if (isMounted) setError('No se pudo cargar tu perfil');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    const Auth = await import('@/services/auth');
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await Auth.logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const assignmentLines = useMemo(() => {
    const lines: string[] = [];
    if (profile?.department) lines.push(profile.department);
    if (profile?.company) lines.push(profile.company);
    if (profile?.employeeId) lines.push(`ID: ${profile.employeeId}`);
    return lines;
  }, [profile]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}><User size={40} color="#FFFFFF" /></View>
          <Text style={styles.name}>{profile?.name || 'Usuario'}</Text>
          <Text style={styles.role}>{profile?.role || 'Rol no disponible'}</Text>
          {profile?.company ? <Text style={styles.company}>{profile.company}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Asignación</Text>
          <View style={styles.row}>
            <ClipboardList size={18} color={COLORS.mutedText} />
            <Text style={styles.rowText}>{assignmentLines.length ? assignmentLines.join(' • ') : 'Sin datos de asignación'}</Text>
          </View>
          {profile?.location ? (
            <View style={styles.row}>
              <MapPin size={18} color={COLORS.mutedText} />
              <Text style={styles.rowText}>{profile.location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Contacto</Text>
          <View style={styles.row}><Mail size={18} color={COLORS.mutedText} /><Text style={styles.rowText}>{profile?.email || 'Sin correo'}</Text></View>
          <View style={styles.row}><Phone size={18} color={COLORS.mutedText} /><Text style={styles.rowText}>{profile?.phone || 'Sin teléfono'}</Text></View>
          {profile?.department ? <View style={styles.row}><Shield size={18} color={COLORS.mutedText} /><Text style={styles.rowText}>{profile.department}</Text></View> : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primarySurface },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySurface },
  loadingText: { marginTop: 10, color: COLORS.mutedText },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 24, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: COLORS.primaryShadow, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  role: { color: COLORS.mutedText },
  company: { color: COLORS.mutedText },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginHorizontal: 16, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowText: { marginLeft: 10, color: COLORS.text, flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, margin: 16, gap: 8 },
  logoutText: { marginLeft: 8, color: '#EF4444', fontWeight: '600' },
  error: { color: '#B91C1C', textAlign: 'center', marginTop: 12 },
});

