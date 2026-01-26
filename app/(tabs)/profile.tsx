import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import {
  User,
  Settings,
  FolderSync as Sync,
  LogOut,
  Bell,
  Shield,
  CircleHelp as HelpCircle,
  Phone,
  Mail,
  MapPin,
  Layers,
  Target,
  CalendarDays,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/theme';
import type { Project, Report } from '@/types/domain';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface ProfileData {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  department?: string;
  joinDate?: string;
  active?: boolean;
  employeeId?: string;
}

interface ProfileStats {
  projects: number;
  reports: number;
  efficiency?: number;
}

const PROJECT_STATUS_META: Record<'active' | 'pending' | 'completed', { label: string; bg: string; color: string }> = {
  active: { label: 'En curso', bg: 'rgba(59, 130, 246, 0.12)', color: '#1D4ED8' },
  pending: { label: 'Pendiente', bg: 'rgba(249, 115, 22, 0.12)', color: '#EA580C' },
  completed: { label: 'Completado', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' },
};

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
    (permissions?.length ? permissions[0] : '') ||
    '';

  const department =
    me?.departamento ||
    me?.department ||
    employee?.departamento ||
    employee?.area ||
    employee?.department ||
    '';

  return {
    name: me?.name || me?.nombre || employee?.name || employee?.nombre || authUser?.name || '',
    role,
    email: me?.email || me?.correo || employee?.email || employee?.correo || '',
    phone: me?.telefono || me?.phone || me?.celular || employee?.telefono || employee?.phone || '',
    company: me?.empresa || me?.company || employee?.empresa || employee?.company || '',
    location: me?.ubicacion || me?.location || employee?.ubicacion || employee?.location || employee?.city || '',
    department,
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

function computeEfficiencyFromReports(reports: Report[]): number | undefined {
  if (!reports || reports.length === 0) return undefined;
  const total = reports.length;
  const approved = reports.filter(report => report.status === 'approved').length;
  const percentage = (approved / total) * 100;
  return Number.isFinite(percentage) ? percentage : undefined;
}

function normalizeEmployeeId(
  profile: ProfileData | null,
  authUser: { employeeId?: string; id: string } | null
): string | undefined {
  return profile?.employeeId || authUser?.employeeId || authUser?.id;
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
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  const loadProfile = useCallback(async (showInitialSpinner = false) => {
    if (showInitialSpinner) {
      setLoading(true);
    }
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

      if (!isMountedRef.current) return;

      const mappedProfile = mapProfileData(me, Auth.getUser(), Auth.getPermissions());
      const resolvedRole = Auth.getRole() ?? 'worker';
      const authUser = Auth.getUser();
      const referenceEmployeeId = normalizeEmployeeId(mappedProfile, authUser);
      const reportsData = reports as Report[];
      const reportsForRole =
        resolvedRole === 'worker' && referenceEmployeeId
          ? reportsData.filter(report => {
              if (!report.authorId) return true;
              return String(report.authorId) === String(referenceEmployeeId);
            })
          : reportsData;
      const efficiencyFromReports = computeEfficiencyFromReports(reportsForRole);
      const finalEfficiency = efficiencyFromReports ?? extractEfficiency(me);

      setProfile(mappedProfile);
      setProjectsList(projects);
      setStats({
        projects: projects.length,
        reports: resolvedRole === 'worker' ? reportsForRole.length : reportsData.length,
        efficiency: finalEfficiency,
      });
    } catch (err) {
      console.error('Error loading profile', err);
      if (isMountedRef.current) {
        setError('No se pudo cargar tu perfil');
      }
    } finally {
      if (!isMountedRef.current) return;
      if (showInitialSpinner) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile(true);
    return () => { isMountedRef.current = false; };
  }, [loadProfile]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProfile();
  };

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
  const parseDueDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const activeProjects = useMemo(() => projectsList.filter(project => project.status !== 'completed'), [projectsList]);
  const completedProjects = useMemo(() => projectsList.filter(project => project.status === 'completed'), [projectsList]);
  const sortedProjects = useMemo(() => {
    const copy = [...projectsList];
    copy.sort((a, b) => {
      const aDate = parseDueDate(a.dueDate || a.deadline);
      const bDate = parseDueDate(b.dueDate || b.deadline);
      if (!aDate && !bDate) return a.name.localeCompare(b.name);
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.getTime() - bDate.getTime();
    });
    return copy;
  }, [projectsList]);
  const highlightedProjects = useMemo(() => sortedProjects.slice(0, 3), [sortedProjects]);
  const nextMilestoneProject = highlightedProjects.find(project => parseDueDate(project.dueDate || project.deadline));

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        )}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.userName}>{profile?.name || 'Usuario'}</Text>
          <Text style={styles.userRole}>{profile?.role || 'Rol no disponible'}</Text>
          <Text style={styles.headerSubtitle}>Resumen actualizado de tus proyectos y actividad</Text>
          {!!profile?.company && <Text style={styles.userCompany}>{profile.company}</Text>}
          {!!activeLabel && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{activeLabel}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Layers size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{activeProjects.length}</Text>
            <Text style={styles.statLabel}>Proyectos activos</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Target size={18} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>{stats.reports}</Text>
            <Text style={styles.statLabel}>Reportes enviados</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <CalendarDays size={18} color="#0EA5E9" />
            </View>
            <Text style={styles.statValue}>{completedProjects.length}</Text>
            <Text style={styles.statLabel}>Proyectos cerrados</Text>
          </View>
        </View>

        <View style={styles.projectsSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Tus proyectos</Text>
              <Text style={styles.sectionSubtitle}>
                {activeProjects.length} activos · {completedProjects.length} completados
              </Text>
            </View>
            {nextMilestoneProject && (
              <View style={styles.milestoneCard}>
                <CalendarDays size={16} color="#2563EB" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.milestoneLabel}>Próxima entrega</Text>
                  <Text style={styles.milestoneValue}>
                    {formatDate(nextMilestoneProject.dueDate || nextMilestoneProject.deadline)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {highlightedProjects.length > 0 ? (
            highlightedProjects.map(project => {
              const statusMeta = PROJECT_STATUS_META[project.status];
              const dueLabel = formatDate(project.dueDate || project.deadline);
              return (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectCard}
                  onPress={() =>
                    router.push({
                      pathname: '/project-detail',
                      params: { projectId: project.id },
                    })
                  }
                >
                  <View style={styles.projectCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName} numberOfLines={1}>
                        {project.name}
                      </Text>
                      <Text style={styles.projectLocation} numberOfLines={1}>
                        {project.location || 'Ubicación no disponible'}
                      </Text>
                    </View>
                    <View style={[styles.projectStatusPill, { backgroundColor: statusMeta.bg }]}>
                      <Text style={[styles.projectStatusText, { color: statusMeta.color }]}>
                        {statusMeta.label}
                      </Text>
                    </View>
                  </View>

                  {dueLabel ? (
                    <View style={styles.projectMetaRow}>
                      <Text style={styles.projectMetaText}>Entrega {dueLabel}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyProjectsCard}>
              <Text style={styles.emptyProjectsTitle}>Aún no tienes proyectos asignados</Text>
              <Text style={styles.emptyProjectsSubtitle}>
                Cuando te asignen a un proyecto lo verás aquí junto con su progreso.
              </Text>
            </View>
          )}
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

            <View style={styles.infoItem}>
              <Shield size={20} color={COLORS.mutedText} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Rol</Text>
                <Text style={styles.infoValue}>
                  {profile?.role || 'Sin rol asignado'}
                  {profile?.employeeId ? ` • ID: ${profile.employeeId}` : ''}
                </Text>
              </View>
            </View>

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
  headerSubtitle: { color: '#6B7280', marginTop: 4, fontSize: 13, textAlign: 'center' },
  userCompany: { color: COLORS.mutedText },
  activeBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },
  activeBadgeText: { color: COLORS.primary, fontWeight: '700' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySurface,
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  statLabel: { color: COLORS.mutedText, fontSize: 12, textAlign: 'center' },
  projectsSection: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionSubtitle: { fontSize: 12, color: COLORS.mutedText },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
  },
  milestoneLabel: { fontSize: 12, color: '#2563EB' },
  milestoneValue: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  projectCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 },
  projectName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  projectLocation: { fontSize: 12, color: COLORS.mutedText, marginTop: 2 },
  projectStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  projectStatusText: { fontSize: 12, fontWeight: '600' },
  projectMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  projectMetaText: { fontSize: 12, color: COLORS.mutedText },
  projectMetaBold: { color: COLORS.text, fontWeight: '600' },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primarySurface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  emptyProjectsCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyProjectsTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  emptyProjectsSubtitle: { fontSize: 13, color: COLORS.mutedText, textAlign: 'center' },
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

