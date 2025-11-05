import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { KanbanSquare, Plus, X } from 'lucide-react-native';

type ColumnKey = string;

interface Card { id: string; title: string }
type Board = Record<ColumnKey, Card[]>;

const initialColumns = ['En revisión', 'Aprobado', 'Rechazado', 'Tareas', 'Reenviado'];

export default function WorkerKanban() {
  const [board, setBoard] = useState<Board>(() => Object.fromEntries(initialColumns.map(c => [c, [] as Card[]])));
  const [newColumn, setNewColumn] = useState('');

  const addColumn = () => {
    const name = newColumn.trim();
    if (!name || board[name]) return;
    setBoard(prev => ({ ...prev, [name]: [] }));
    setNewColumn('');
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
              {!(initialColumns as string[]).includes(column) && (
                <TouchableOpacity onPress={() => { const copy={...board}; delete copy[column]; setBoard(copy); }}>
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.columnBody}>
              {board[column].length === 0 && <Text style={styles.empty}>Sin elementos</Text>}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#2563EB', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  addColumnRow: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, height: 44, color: '#111827' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 12, height: 44, borderRadius: 10, gap: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: '600' },
  board: { paddingHorizontal: 12 },
  column: { width: 280, marginRight: 12 },
  columnHeader: { backgroundColor: '#FFFFFF', padding: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  columnTitle: { fontWeight: '700', color: '#111827' },
  columnBody: { backgroundColor: '#FFFFFF', padding: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  empty: { color: '#6B7280', textAlign: 'center' },
});

