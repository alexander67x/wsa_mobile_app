import { Tabs } from 'expo-router';
import { Home, KanbanSquare, FileText, Clock, User } from 'lucide-react-native';

export default function WorkerTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Proyecto', tabBarIcon: ({ size, color }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="kanban" options={{ title: 'Kanban', tabBarIcon: ({ size, color }) => <KanbanSquare size={size} color={color} /> }} />
      <Tabs.Screen name="create-report" options={{ title: 'Reporte', tabBarIcon: ({ size, color }) => <FileText size={size} color={color} /> }} />
      <Tabs.Screen name="checkin" options={{ title: 'Jornada', tabBarIcon: ({ size, color }) => <Clock size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ size, color }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}

