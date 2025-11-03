import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { User, Settings, FolderSync as Sync, LogOut, Bell, Shield, CircleHelp as HelpCircle, Phone, Mail, MapPin } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const userProfile = {
  name: 'Carlos Mendoza',
  role: 'Supervisor de Seguridad',
  email: 'c.mendoza@securetech.pe',
  phone: '+51 999 123 456',
  company: 'SecureTech Solutions',
  location: 'Lima, Perú',
  joinDate: '2022-05-15',
  projectsAssigned: 4,
  reportsSubmitted: 28,
};

export default function ProfileScreen() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handleSync = () => {
    setSyncStatus('syncing');

    setTimeout(() => {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 3000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getSyncButtonText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Sincronizando...';
      case 'success': return 'Sincronizado ✓';
      case 'error': return 'Error de Sincronización';
      default: return 'Sincronizar Datos';
    }
  };

  const getSyncButtonColor = () => {
    switch (syncStatus) {
      case 'syncing': return '#F59E0B';
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#2563EB';
    }
  };

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
          <Text style={styles.userName}>{userProfile.name}</Text>
          <Text style={styles.userRole}>{userProfile.role}</Text>
          <Text style={styles.userCompany}>{userProfile.company}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.projectsAssigned}</Text>
            <Text style={styles.statLabel}>Proyectos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.reportsSubmitted}</Text>
            <Text style={styles.statLabel}>Reportes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Eficiencia</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Mail size={20} color="#6B7280" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userProfile.email}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Phone size={20} color="#6B7280" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{userProfile.phone}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <MapPin size={20} color="#6B7280" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Ubicación</Text>
                <Text style={styles.infoValue}>{userProfile.location}</Text>
              </View>
            </View>
          </View>
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
            Sincroniza tus datos offline con el servidor central. Última sincronización: Hoy 14:30
          </Text>
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Configuración</Text>

          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Bell size={20} color="#6B7280" />
                <Text style={styles.optionText}>Notificaciones</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Shield size={20} color="#6B7280" />
                <Text style={styles.optionText}>Privacidad y Seguridad</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Settings size={20} color="#6B7280" />
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
                <HelpCircle size={20} color="#6B7280" />
                <Text style={styles.optionText}>Centro de Ayuda</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Phone size={20} color="#6B7280" />
                <Text style={styles.optionText}>Contactar Soporte</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 24, backgroundColor: '#FFFFFF' },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  userRole: { color: '#6B7280', marginTop: 2 },
  userCompany: { color: '#6B7280' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingVertical: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { color: '#6B7280' },
  infoSection: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoTextContainer: { marginLeft: 16, flex: 1 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
  syncSection: { paddingHorizontal: 20, paddingTop: 32 },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, gap: 8, marginBottom: 12 },
  syncButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  syncDescription: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  optionsSection: { paddingHorizontal: 20, paddingTop: 32 },
  optionsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionText: { marginLeft: 16, fontSize: 16, color: '#1F2937' },
  optionArrow: { fontSize: 20, color: '#9CA3AF' },
  optionDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20 },
  supportSection: { paddingHorizontal: 20, paddingTop: 32 },
  logoutSection: { paddingHorizontal: 20, paddingTop: 32 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2', gap: 8 },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  versionSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 40 },
  versionText: { fontSize: 12, color: '#9CA3AF' },
  buildText: { fontSize: 10, color: '#D1D5DB', marginTop: 2 },
});

