import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { listTeam } from '@/services/team';
import type { TeamMember } from '@/types/domain';
import { COLORS } from '@/theme';

export default function WorkerTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  useEffect(() => { listTeam('1').then(setTeam).catch(() => setTeam([])); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Equipo - Green Tower</Text></View>
      <ScrollView style={styles.list}>
        {team.map(m => (
          <View key={m.id} style={styles.item}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{m.name[0]}</Text></View>
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
});

