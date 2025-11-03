import { Report, ReportDetail } from '@/types/domain';

export const mockReports: Report[] = [
  { id: '1', title: 'Instalación de cámaras – Nivel 3', project: 'Green Tower', date: '2024-02-12', type: 'progress', status: 'approved', progress: 40 },
  { id: '2', title: 'Incidente: pérdida de conectividad PoE', project: 'Data Center Norte', date: '2024-02-10', type: 'incident', status: 'pending' },
  { id: '3', title: 'Pruebas de calidad de sensores', project: 'Parque Industrial Orión', date: '2024-02-08', type: 'quality', status: 'approved' },
  { id: '4', title: 'Avance NVR y cableado backbone', project: 'Campus Corporativo Andina', date: '2024-02-06', type: 'progress', status: 'rejected', progress: 20 },
];

export const mockReportDetail: ReportDetail = {
  id: '1',
  title: 'Instalación de cámaras – Nivel 3',
  project: 'Green Tower',
  type: 'progress',
  status: 'approved',
  progress: 40,
  author: 'Carlos Mendoza',
  date: '2024-02-12 14:30',
  location: 'Av. Seguridad 101, Lima',
  description: 'Se instalaron 12 cámaras IP 4MP y se completó el tendido de cable UTP en el nivel 3. Quedan pendientes pruebas de PoE y ajuste de ángulos en 4 posiciones.',
  observations: 'Reemplazar 2 cámaras por modelo con WDR por reflejos. Solicitar 2 switches PoE adicionales.',
  images: [
    'https://images.pexels.com/photos/834892/pexels-photo-834892.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1872564/pexels-photo-1872564.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=400',
  ],
  approvedBy: 'Supervisor J. Salazar',
  approvedDate: '2024-02-13 09:15',
  feedback: 'Buen avance. Validar alimentación PoE en todos los puertos.',
};

