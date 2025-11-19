import { CatalogItem, MaterialRequest } from '@/types/domain';

export const materialCatalog: CatalogItem[] = [
  { id: '1', name: 'Cámara IP 4MP', unit: 'unidades', sku: 'CAM-4MP-A1' },
  { id: '2', name: 'NVR 16 canales', unit: 'unidades', sku: 'NVR-16CH' },
  { id: '3', name: 'Sensor PIR interior', unit: 'unidades', sku: 'PIR-INT-01' },
  { id: '4', name: 'Sensor magnético de puerta', unit: 'unidades', sku: 'MAG-DOOR-02' },
  { id: '5', name: 'Switch PoE 8 puertos', unit: 'unidades', sku: 'SWPOE-8P' },
  { id: '6', name: 'Cable UTP Cat6', unit: 'metros', sku: 'UTP-CAT6' },
  { id: '7', name: 'Tubos corrugados 3/4"', unit: 'metros', sku: 'TUB-034' },
  { id: '8', name: 'Fuente 12V 5A', unit: 'unidades', sku: 'PS-12V5A' },
  { id: '9', name: 'Sirena exterior', unit: 'unidades', sku: 'SIR-EXT' },
  { id: '10', name: 'Conector RJ45', unit: 'unidades', sku: 'RJ45' },
];

export const materialRequests: MaterialRequest[] = [
  { id: '1', projectName: 'Green Tower', materialName: 'Cámara IP 4MP', quantity: 24, unit: 'unidades', requestDate: '2024-02-10', status: 'delivered', priority: 'high' },
  { id: '2', projectName: 'Data Center Norte', materialName: 'Switch PoE 8 puertos', quantity: 6, unit: 'unidades', requestDate: '2024-02-11', status: 'approved', priority: 'medium', observations: 'Entrega programada para el 15/02' },
  { id: '3', projectName: 'Parque Industrial Orión', materialName: 'Cable UTP Cat6', quantity: 1200, unit: 'metros', requestDate: '2024-02-12', status: 'pending', priority: 'medium' },
  { id: '4', projectName: 'Campus Corporativo Andina', materialName: 'Sensor PIR interior', quantity: 18, unit: 'unidades', requestDate: '2024-02-09', status: 'rejected', priority: 'low', observations: 'Cambio de modelo solicitado' },
];

