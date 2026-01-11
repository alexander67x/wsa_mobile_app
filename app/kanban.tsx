import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import KanbanBoardScreen from '@/components/KanbanBoard';

export default function KanbanScreen() {
  const params = useLocalSearchParams<{ projectId?: string | string[] }>();
  const projectId = useMemo(() => {
    const value = params.projectId;
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }, [params.projectId]);

  return (
    <KanbanBoardScreen projectId={projectId} requireProject />
  );
}

