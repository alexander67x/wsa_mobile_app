import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Search, ArrowUpDown, Package } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

import * as MaterialsService from '@/services/materials';
import type { MaterialRequest } from '@/types/domain';

type InventoryRow = {
  id: string;
  code: string;
  name: string;
  subgroup: string;
  unit: string;
  minStock: number;
  maxStock: number;
  currentStock: number;
  warehouse: string;
  warehousesCount: number;
  critical: 'critical' | 'ok';
  active: boolean;
};

const listMaterialInventory =
  (MaterialsService as any).listMaterialInventory as
    | (() => Promise<InventoryRow[]>)
    | undefined;

const convertRequestsToInventory = (requests: MaterialRequest[]): InventoryRow[] =>
  requests.map((request, index) => ({
    id: request.id || `req-${index}`,
    code: `REQ-${(request.id || index + 1).toString().padStart(3, '0')}`,
    name: request.materialName,
    subgroup: request.projectName,
    unit: request.unit || 'unidad',
    minStock: Math.max(1, Math.floor(request.quantity / 2)),
    maxStock: Math.max(request.quantity, Math.floor(request.quantity * 1.5)),
    currentStock: request.quantity,
    warehouse: request.projectName,
    warehousesCount: 1,
    critical: request.status === 'rejected' ? 'critical' : 'ok',
    active: request.status !== 'rejected',
  }));

export default function MaterialsInventoryScreen() {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (typeof listMaterialInventory === 'function') {
          const data = await listMaterialInventory();
          if (mounted) setItems(data);
        } else {
          const requests = await MaterialsService.listMaterialRequests();
          if (mounted) setItems(convertRequestsToInventory(requests));
        }
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(item =>
      `${item.code} ${item.name} ${item.subgroup} ${item.warehouse}`.toLowerCase().includes(term)
    );
  }, [items, search]);

  const renderCriticalBadge = (critical: InventoryRow['critical']) => (
    <View
      style={[
        styles.criticalBadge,
        critical === 'critical' ? styles.criticalDanger : styles.criticalOk,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          critical === 'critical' ? styles.badgeTextDanger : styles.badgeTextOk,
        ]}
      >
        {critical === 'critical' ? 'Crítico' : 'Sin crítico'}
      </Text>
    </View>
  );

  const renderActiveBadge = (active: boolean) => (
    <View style={[styles.activeBadge, active ? styles.activeOn : styles.activeOff]}>
      <Text style={[styles.badgeText, active ? styles.badgeTextOk : styles.badgeTextDanger]}>
        {active ? 'Activo' : 'Inactivo'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>Materiales</Text>
          <Text style={styles.subtitle}>
            Inventario consolidado por proyectos y almacenes
          </Text>
        </View>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => router.push('/material-requests')}
        >
          <Package size={18} color="#111827" />
          <Text style={styles.requestButtonText}>Solicitud de Material</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por código, producto o almacén"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.metaInfo}>
          <ArrowUpDown size={16} color="#6B7280" />
          <Text style={styles.metaInfoText}>{filteredItems.length} materiales</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableWrapper}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.codeCell]}>Código</Text>
            <Text style={[styles.headerCell, styles.nameCell]}>Nombre del producto</Text>
            <Text style={[styles.headerCell, styles.subgroupCell]}>Subgrupo</Text>
            <Text style={[styles.headerCell, styles.unitCell]}>Unidad</Text>
            <Text style={[styles.headerCell, styles.stockCell, styles.stockHeader]}>Stock mín.</Text>
            <Text style={[styles.headerCell, styles.stockCell, styles.stockHeader]}>Máx. stock</Text>
            <Text style={[styles.headerCell, styles.warehouseCell]}>Almacén / Proyecto</Text>
            <Text style={[styles.headerCell, styles.criticalCell]}>Crítica</Text>
            <Text style={[styles.headerCell, styles.activeCell]}>Activo</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.loadingText}>Cargando inventario...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySubtitle}>
                No encontramos materiales que coincidan con tu búsqueda.
              </Text>
            </View>
          ) : (
            filteredItems.map(item => (
              <View key={item.id} style={styles.tableRow}>
                <View style={[styles.cellContainer, styles.codeCell]}>
                  <Text style={styles.cellText}>{item.code}</Text>
                </View>
                <View style={[styles.cellContainer, styles.nameCell]}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productInfo}>{item.currentStock} unidades en stock</Text>
                </View>
                <View style={[styles.cellContainer, styles.subgroupCell]}>
                  <Text style={styles.cellText}>{item.subgroup}</Text>
                </View>
                <View style={[styles.cellContainer, styles.unitCell]}>
                  <View style={styles.unitBadge}>
                    <Text style={styles.badgeText}>{item.unit}</Text>
                  </View>
                </View>
                <View style={[styles.cellContainer, styles.stockCell, styles.alignCenter]}>
                  <Text style={styles.cellText}>{item.minStock}</Text>
                </View>
                <View style={[styles.cellContainer, styles.stockCell, styles.alignCenter]}>
                  <Text style={styles.cellText}>{item.maxStock}</Text>
                </View>
                <View style={[styles.cellContainer, styles.warehouseCell]}>
                  <Text style={styles.warehouseTitle}>{item.warehouse}</Text>
                  <View style={styles.warehouseMeta}>
                    <Text style={styles.warehouseMetaText}>
                      {item.warehousesCount} almacén{item.warehousesCount !== 1 ? 'es' : ''}
                    </Text>
                  </View>
                </View>
                <View style={[styles.cellContainer, styles.criticalCell]}>
                  {renderCriticalBadge(item.critical)}
                </View>
                <View style={[styles.cellContainer, styles.activeCell]}>
                  {renderActiveBadge(item.active)}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    marginTop: 6,
    color: '#CBD5F5',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  requestButtonText: {
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  searchInput: {
    marginLeft: 8,
    color: '#F3F4F6',
    flex: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 12,
  },
  metaInfoText: {
    marginLeft: 6,
    color: '#D1D5DB',
    fontSize: 13,
  },
  tableWrapper: {
    flex: 1,
  },
  table: {
    minWidth: 900,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 32,
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 12,
    color: '#D1D5DB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  headerCell: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stockHeader: {
    textAlign: 'center',
  },
  cellContainer: {
    justifyContent: 'center',
    paddingRight: 16,
  },
  cellText: {
    color: '#E5E7EB',
  },
  alignCenter: {
    alignItems: 'center',
  },
  codeCell: {
    flex: 1,
  },
  nameCell: {
    flex: 3,
  },
  subgroupCell: {
    flex: 2,
  },
  unitCell: {
    flex: 1,
  },
  stockCell: {
    flex: 1,
  },
  warehouseCell: {
    flex: 3,
  },
  criticalCell: {
    flex: 1.2,
  },
  activeCell: {
    flex: 1,
  },
  productName: {
    color: '#F3F4F6',
    fontWeight: '600',
  },
  productInfo: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 12,
  },
  unitBadge: {
    backgroundColor: '#312E81',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextOk: {
    color: '#10B981',
  },
  badgeTextDanger: {
    color: '#F87171',
  },
  criticalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  criticalDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  criticalOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  activeOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  activeOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  warehouseTitle: {
    color: '#F3F4F6',
    fontWeight: '600',
  },
  warehouseMeta: {
    marginTop: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  warehouseMetaText: {
    color: '#CBD5F5',
    fontSize: 12,
  },
});
