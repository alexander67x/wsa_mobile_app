import { KanbanBoard } from '@/types/domain';

export let board: KanbanBoard = {
  'En revisión': [
    {
      id: 'c1',
      title: 'Instalación cámaras – Nivel 3',
      authorId: 'u1',
      authorName: 'Juan Pérez',
      description: 'Se instalaron 12 cámaras IP 4MP en el nivel 3. Pendiente ajuste de ángulos y pruebas PoE.',
      photos: [
        'https://images.pexels.com/photos/834892/pexels-photo-834892.jpeg?auto=compress&cs=tinysrgb&w=400'
      ],
      createdAt: '2024-02-12'
    },
    {
      id: 'c2',
      title: 'Cableado UTP torre A',
      authorId: 'u2',
      authorName: 'Karla García',
      description: 'Tendido de 300m de cable UTP Cat6 en canalizaciones existentes.',
      photos: [
        'https://images.pexels.com/photos/1872564/pexels-photo-1872564.jpeg?auto=compress&cs=tinysrgb&w=400'
      ],
      createdAt: '2024-02-11'
    },
  ],
  'Aprobado': [
    {
      id: 'c3',
      title: 'Configuración NVR principal',
      authorId: 'u3',
      authorName: 'Luis Mendoza',
      description: 'Se configuró NVR con 16 canales y usuarios iniciales.',
      photos: [],
      createdAt: '2024-02-10'
    },
  ],
  'Rechazado': [
    {
      id: 'c4',
      title: 'Reubicar sensor magnético (glitch)',
      authorId: 'u2',
      authorName: 'Karla García',
      description: 'Lecturas inestables por vibración de puerta. Reubicación propuesta a 5 cm.',
      photos: [],
      createdAt: '2024-02-09'
    },
  ],
  'Tareas': [],
  'Reenviado': [],
};
