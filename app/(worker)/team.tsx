import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { listTeam } from '@/services/team';
import type { TeamMember } from '@/types/domain';
import { COLORS } from '@/theme';

export default function WorkerTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = async () => {
    try {
      setError(null);
      const members = await listTeam('1');
      setTeam(members);
    } catch (err) {
      console.error('Error loading team', err);
      setTeam([]);
      setError('No se pudo cargar el equipo');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTeam();
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando equipo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Equipo - Green Tower</Text>
      </View>
      <ScrollView
        style={styles.list}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        )}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {team.map(m => (
          <View key={m.id} style={styles.item}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{m.name[0]}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.role}>{m.role === 'supervisor' ? 'Supervisor' : 'Técnico'}</Text>
              {m.email ? <Text style={styles.meta}>{m.email}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  list: { padding: 16 },
  item: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#111827', fontWeight: '700' },
  info: { marginLeft: 12 },
  name: { color: '#111827', fontWeight: '600' },
  role: { color: '#6B7280', fontSize: 12 },
  meta: { color: '#6B7280', fontSize: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  error: { color: '#DC2626', marginBottom: 12 },
});
