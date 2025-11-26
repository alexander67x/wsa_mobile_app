import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { KanbanSquare, Plus, X } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Kanban from '@/services/kanban';
import type { KanbanBoard } from '@/types/domain';
import { COLORS } from '@/theme';

const defaultColumns = ['En revisión', 'Aprobado', 'Rechazado', 'Tareas', 'Reenviado'];

export default function WorkerKanban() {
  const [board, setBoard] = useState<KanbanBoard>({});
  const [newColumn, setNewColumn] = useState('');

  const refresh = () => Kanban.getBoard().then(setBoard);
  useEffect(() => { refresh(); }, []);

  const addColumn = async () => {
    const name = newColumn.trim();
    if (!name) return;
    await Kanban.addColumn(name);
    setNewColumn('');
    refresh();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <KanbanSquare size={20} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Kanban del Proyecto</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.addColumnRow}>
        <TextInput style={styles.input} placeholder="Nueva columna" value={newColumn} onChangeText={setNewColumn} />
        <TouchableOpacity style={styles.addBtn} onPress={addColumn}><Plus size={18} color="#FFFFFF" /><Text style={styles.addBtnText}>Agregar</Text></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
        {Object.keys(board).map(column => (
          <View key={column} style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>{column}</Text>
              {!(defaultColumns as string[]).includes(column) && (
                <TouchableOpacity onPress={() => { const copy={...board}; delete copy[column]; setBoard(copy); }}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.columnBody}>
              {board[column]?.length ? (
                board[column].map(card => (
                  <TouchableOpacity key={card.id} style={styles.card} onPress={() => router.push({ pathname: '/(worker)/report-detail', params: { cardId: card.id } })}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardMeta}>Autor: {card.authorName || '—'} • {card.createdAt}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.empty}>Sin elementos</Text>
              )}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  addColumnRow: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, height: 44, color: '#111827' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, height: 44, borderRadius: 10, gap: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: '600' },
  board: { paddingHorizontal: 12 },
  column: { width: 280, marginRight: 12 },
  columnHeader: { backgroundColor: '#FFFFFF', padding: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  columnTitle: { fontWeight: '700', color: '#111827' },
  columnBody: { backgroundColor: '#FFFFFF', padding: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  empty: { color: '#6B7280', textAlign: 'center' },
  card: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, marginBottom: 8 },
  cardTitle: { color: '#111827', fontWeight: '600' },
  cardMeta: { color: '#6B7280', fontSize: 12 },
});
