import { Tabs } from 'expo-router';
import { Home, KanbanSquare, Clock, User, Users } from 'lucide-react-native';
import { COLORS } from '@/theme';

export default function WorkerTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
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
      <Tabs.Screen name="team" options={{ title: 'Equipo', tabBarIcon: ({ size, color }) => <Users size={size} color={color} /> }} />
      <Tabs.Screen name="checkin" options={{ title: 'Jornada', tabBarIcon: ({ size, color }) => <Clock size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ size, color }) => <User size={size} color={color} /> }} />
      {/* Ocultos del tab bar pero navegables */}
      <Tabs.Screen name="create-report" options={{ href: null }} />
      <Tabs.Screen name="report-detail" options={{ href: null }} />
    </Tabs>
  );
}
