import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { User, Settings, FolderSync as Sync, LogOut, Bell, Shield, CircleHelp as HelpCircle, Phone, Mail, MapPin } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface ProfileData {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  department?: string;
  privileges?: string;
  joinDate?: string;
  active?: boolean;
  employeeId?: string;
}

interface ProfileStats {
  projects: number;
  reports: number;
  efficiency?: number;
}

function mapProfileData(me: any, authUser: any, permissions: string[]): ProfileData {
  const employee = me?.empleado || me?.employee || null;
  const role =
    me?.cargo ||
    me?.puesto ||
    me?.role?.nombre ||
    me?.role?.name ||
    me?.role?.title ||
    me?.role?.slug ||
    employee?.cargo ||
    employee?.puesto ||
    authUser?.role ||
    '';

  const department =
    me?.departamento ||
    me?.department ||
    employee?.departamento ||
    employee?.area ||
    employee?.department ||
    '';

  const privilegeSource =
    (Array.isArray(me?.privilegios) && me?.privilegios) ||
    (Array.isArray(me?.privileges) && me?.privileges) ||
    (Array.isArray(employee?.privilegios) && employee?.privilegios) ||
    (Array.isArray(employee?.privileges) && employee?.privileges) ||
    permissions;

  const privileges =
    Array.isArray(privilegeSource) ? privilegeSource.join(', ') :
    typeof privilegeSource === 'string' ? privilegeSource :
    '';

  return {
    name: me?.name || me?.nombre || employee?.name || employee?.nombre || authUser?.name || '',
    role,
    email: me?.email || me?.correo || employee?.email || employee?.correo || '',
    phone: me?.telefono || me?.phone || me?.celular || employee?.telefono || employee?.phone || '',
    company: me?.empresa || me?.company || employee?.empresa || employee?.company || '',
    location: me?.ubicacion || me?.location || employee?.ubicacion || employee?.location || employee?.city || '',
    department,
    privileges,
    joinDate: me?.fecha_ingreso || me?.fechaIngreso || employee?.fecha_ingreso || employee?.fechaIngreso || '',
    active: me?.activo ?? me?.active ?? employee?.activo ?? employee?.active ?? undefined,
    employeeId: authUser?.employeeId || me?.employeeId || employee?.cod_empleado || employee?.codEmpleado || employee?.id || '',
  };
}

function extractEfficiency(me: any): number | undefined {
  if (!me) return undefined;
  const value = me?.eficiencia ?? me?.efficiency ?? me?.performance;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : undefined;
}

function formatDate(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export default function ProfileScreen() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ projects: 0, reports: 0, efficiency: undefined });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const Auth = await import('@/services/auth');
        const Projects = await import('@/services/projects');
        const Reports = await import('@/services/reports');

        const [me, projects, reports] = await Promise.all([
          Auth.fetchMe(),
          Projects.getMyProjects().catch(() => []),
          Reports.listReports().catch(() => []),
        ]);

        if (!isMounted) return;

        setProfile(mapProfileData(me, Auth.getUser(), Auth.getPermissions()));
        setStats({
          projects: projects.length,
          reports: reports.length,
          efficiency: extractEfficiency(me),
        });
      } catch (err) {
        console.error('Error loading profile', err);
        if (isMounted) {
          setError('No se pudo cargar tu perfil');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => { isMounted = false; };
  }, []);

  const handleSync = () => {
    setSyncStatus('syncing');

    setTimeout(() => {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 1600);
    }, 2000);
  };

  const handleLogout = async () => {
    const Auth = await import('@/services/auth');
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
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

  const getSyncButtonText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Sincronizando...';
      case 'success': return 'Sincronizado';
      case 'error': return 'Error de sincronización';
      default: return 'Sincronizar Datos';
    }
  };

  const getSyncButtonColor = () => {
    switch (syncStatus) {
      case 'syncing': return COLORS.primaryMuted;
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return COLORS.primary;
    }
  };

  const formattedJoinDate = useMemo(() => formatDate(profile?.joinDate), [profile?.joinDate]);
  const activeLabel = profile?.active === undefined ? '' : profile.active ? 'Activo' : 'Inactivo';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.userName}>{profile?.name || 'Usuario'}</Text>
          <Text style={styles.userRole}>{profile?.role || 'Rol no disponible'}</Text>
          {!!profile?.company && <Text style={styles.userCompany}>{profile.company}</Text>}
          {!!activeLabel && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{activeLabel}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.projects}</Text>
            <Text style={styles.statLabel}>Proyectos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.reports}</Text>
            <Text style={styles.statLabel}>Reportes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.efficiency !== undefined ? `${Math.round(stats.efficiency)}%` : 'N/D'}</Text>
            <Text style={styles.statLabel}>Eficiencia</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Mail size={20} color={COLORS.mutedText} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || 'Sin correo'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Phone size={20} color={COLORS.mutedText} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{profile?.phone || 'Sin teléfono'}</Text>
              </View>
            </View>

            {(profile?.location || profile?.department) && (
              <View style={styles.infoItem}>
                <MapPin size={20} color={COLORS.mutedText} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{profile?.department ? 'Departamento / Ubicación' : 'Ubicación'}</Text>
                  <Text style={styles.infoValue}>
                    {[profile?.department, profile?.location].filter(Boolean).join(' • ') || 'Sin ubicación'}
                  </Text>
                </View>
              </View>
            )}

            {(profile?.privileges || profile?.employeeId) && (
              <View style={styles.infoItem}>
                <Shield size={20} color={COLORS.mutedText} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Privilegios</Text>
                  <Text style={styles.infoValue}>
                    {profile?.privileges || 'Sin privilegios'}
                    {profile?.employeeId ? ` • ID: ${profile.employeeId}` : ''}
                  </Text>
                </View>
              </View>
            )}

            {!!formattedJoinDate && (
              <View style={styles.infoItem}>
                <Settings size={20} color={COLORS.mutedText} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Fecha de ingreso</Text>
                  <Text style={styles.infoValue}>{formattedJoinDate}</Text>
                </View>
              </View>
            )}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.syncSection}>
          <Text style={styles.sectionTitle}>Sincronización</Text>

          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: getSyncButtonColor() }]}
            onPress={handleSync}
            disabled={syncStatus === 'syncing'}
          >
            <Sync size={20} color="#FFFFFF" />
            <Text style={styles.syncButtonText}>{getSyncButtonText()}</Text>
          </TouchableOpacity>

          <Text style={styles.syncDescription}>
            Sincroniza tus datos offline con el servidor central.
          </Text>
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Configuración</Text>

          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Bell size={20} color={COLORS.mutedText} />
                <Text style={styles.optionText}>Notificaciones</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Shield size={20} color={COLORS.mutedText} />
                <Text style={styles.optionText}>Privacidad y Seguridad</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Settings size={20} color={COLORS.mutedText} />
                <Text style={styles.optionText}>Configuraciones Generales</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Soporte</Text>

          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <HelpCircle size={20} color={COLORS.mutedText} />
                <Text style={styles.optionText}>Centro de Ayuda</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Phone size={20} color={COLORS.mutedText} />
                <Text style={styles.optionText}>Contactar Soporte</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={syncStatus === 'syncing'}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Versión 1.0.0</Text>
          <Text style={styles.buildText}>Build 2024.02.12</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primarySurface },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySurface },
  loadingText: { marginTop: 12, color: COLORS.mutedText },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  userRole: { color: COLORS.mutedText, marginTop: 4 },
  userCompany: { color: COLORS.mutedText },
  activeBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },
  activeBadgeText: { color: COLORS.primary, fontWeight: '700' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingVertical: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  statLabel: { color: COLORS.mutedText },
  infoSection: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.mutedText, marginBottom: 2 },
  infoValue: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
  syncSection: { paddingHorizontal: 20, paddingTop: 28 },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  syncButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  syncDescription: { fontSize: 12, color: COLORS.mutedText, textAlign: 'center', lineHeight: 18 },
  optionsSection: { paddingHorizontal: 20, paddingTop: 28 },
  optionsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionText: { marginLeft: 16, fontSize: 16, color: COLORS.text },
  optionArrow: { fontSize: 20, color: COLORS.mutedText },
  optionDivider: { height: 1, backgroundColor: COLORS.primarySurface, marginHorizontal: 20 },
  supportSection: { paddingHorizontal: 20, paddingTop: 28 },
  logoutSection: { paddingHorizontal: 20, paddingTop: 28 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  versionSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 40 },
  versionText: { fontSize: 12, color: COLORS.mutedText },
  buildText: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  errorText: { color: '#B91C1C', marginTop: 10 },
});

