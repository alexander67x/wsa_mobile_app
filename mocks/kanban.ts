import { KanbanBoard } from '@/types/domain';

export let board: KanbanBoard = {
  'En revisión': [
    { id: 'c1', title: 'Instalación cámaras – Nivel 3', authorId: 'u1', createdAt: '2024-02-12' },
    { id: 'c2', title: 'Cableado UTP torre A', authorId: 'u2', createdAt: '2024-02-11' },
  ],
  'Aprobado': [
    { id: 'c3', title: 'Configuración NVR principal', authorId: 'u3', createdAt: '2024-02-10' },
  ],
  'Rechazado': [
    { id: 'c4', title: 'Reubicar sensor magnético (glitch)', authorId: 'u2', createdAt: '2024-02-09' },
  ],
  'Tareas': [],
  'Reenviado': [],
};

