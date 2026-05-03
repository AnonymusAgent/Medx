import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useApp();
  const role = currentUser.role;

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 60,
      android: insets.bottom + 60,
      default: 70,
    }),
    paddingTop: 8,
    paddingBottom: Platform.select({
      ios: insets.bottom + 8,
      android: insets.bottom + 8,
      default: 8,
    }),
    backgroundColor: Colors.navBg,
    borderTopWidth: 1,
    borderTopColor: '#1E2A3A',
  };

  // Role-based tab visibility
  const showPatients = role !== 'Provider';
  const showBilling = role !== 'Provider';
  const showReports = role === 'Admin' || role === 'Biller';
  const showSettings = role === 'Admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#4B5563',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
          tabBarItemStyle: showPatients ? {} : { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt-long" size={size} color={color} />,
          tabBarItemStyle: showBilling ? {} : { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="scheduling"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="calendar-today" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="bar-chart" size={size} color={color} />,
          tabBarItemStyle: showReports ? {} : { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} />,
          tabBarItemStyle: showSettings ? {} : { display: 'none' },
        }}
      />
    </Tabs>
  );
}
