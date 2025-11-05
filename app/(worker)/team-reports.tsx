import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { listReports } from '@/services/reports';
import type { Report } from '@/types/domain';

export default function TeamReports() {
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    listReports().then(all => setReports(all.filter(r => r.project === 'Green Tower'))).catch(() => setReports([]));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Reportes del Equipo</Text></View>
      <ScrollView style={styles.list}>
        {reports.map(r => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.title}>{r.title}</Text>
            <Text style={styles.meta}>{r.date} • {r.authorName || 'Equipo'}</Text>
            <Text style={[styles.badge, { color: r.status === 'approved' ? '#10B981' : r.status === 'pending' ? '#F59E0B' : '#EF4444' }]}>{r.status}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#2563EB', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  list: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10 },
  title: { color: '#111827', fontWeight: '600' },
  meta: { color: '#6B7280', fontSize: 12 },
  badge: { marginTop: 6, fontWeight: '700' },
});

