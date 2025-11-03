import { Project, ProjectDetail } from '@/types/domain';

export const mockProjects: Project[] = [
  { id: '1', name: 'Green Tower', location: 'Av. Seguridad 101, Lima', progress: 72, status: 'active', dueDate: '2024-03-15', tasksCount: 14, reportsCount: 9 },
  { id: '2', name: 'Data Center Norte', location: 'Jr. Resguardo 456, Callao', progress: 48, status: 'active', dueDate: '2024-04-20', tasksCount: 20, reportsCount: 12 },
  { id: '3', name: 'Parque Industrial Orión', location: 'Av. Perímetro 789, San Miguel', progress: 88, status: 'active', dueDate: '2024-02-28', tasksCount: 10, reportsCount: 15 },
  { id: '4', name: 'Campus Corporativo Andina', location: 'Av. Monitoreo 321, Miraflores', progress: 30, status: 'pending', dueDate: '2024-05-10', tasksCount: 22, reportsCount: 4 },
];

export const mockProjectDetail: ProjectDetail = {
  id: '1',
  name: 'Green Tower',
  location: 'Av. Seguridad 101, Lima',
  progress: 72,
  status: 'active',
  startDate: '2023-10-01',
  endDate: '2024-03-15',
  budget: '$1,250,000',
  manager: 'Supervisor J. Salazar',
  team: 10,
  tasks: [
    { id: 't1', title: 'Tendido de cable UTP – Torre A', status: 'in_progress', assignee: 'Luis M.', dueDate: '2024-02-15' },
    { id: 't2', title: 'Montaje de cámaras – Lobby', status: 'pending', assignee: 'Karla G.', dueDate: '2024-02-20' },
    { id: 't3', title: 'Configuración NVR y PoE', status: 'completed', assignee: 'R. Torres', dueDate: '2024-02-10' },
  ],
  reports: [
    { id: 'r1', title: 'Instalación cámaras – Nivel 3', date: '2024-02-12', type: 'progress', status: 'approved' },
    { id: 'r2', title: 'Incidente: desconexión de switch PoE', date: '2024-02-10', type: 'incident', status: 'pending' },
    { id: 'r3', title: 'Pruebas de sensores magnéticos', date: '2024-02-08', type: 'quality', status: 'approved' },
  ],
  materials: [
    { id: 'm1', name: 'Cámara IP 4MP', quantity: 24, unit: 'unidades', status: 'delivered' },
    { id: 'm2', name: 'Switch PoE 8 puertos', quantity: 6, unit: 'unidades', status: 'approved' },
    { id: 'm3', name: 'Cable UTP Cat6', quantity: 1200, unit: 'metros', status: 'requested' },
  ],
};

