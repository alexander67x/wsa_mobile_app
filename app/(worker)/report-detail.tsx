import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { getCard } from '@/services/kanban';
import type { KanbanCard } from '@/types/domain';
import { COLORS } from '@/theme';

export default function WorkerReportDetail() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const [card, setCard] = useState<KanbanCard | null>(null);
  useEffect(() => { if (cardId) getCard(String(cardId)).then(setCard).catch(() => setCard(null)); }, [cardId]);

  if (!card) return <View style={styles.center}><Text>Cargando...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ArrowLeft size={24} color="#FFFFFF" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Detalle de Reporte</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.meta}>Autor: {card.authorName || '—'} • {card.createdAt}</Text>
        {card.description ? <Text style={styles.desc}>{card.description}</Text> : null}
        <View style={styles.photos}>
          {(card.photos || []).map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photo} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  meta: { marginTop: 4, color: '#6B7280' },
  desc: { marginTop: 12, color: '#111827', lineHeight: 20 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  photo: { width: 120, height: 120, borderRadius: 8, backgroundColor: '#E5E7EB' },
});

