import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { AppProvider } from '@/contexts/AppContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="patient-detail" />
              <Stack.Screen name="add-patient" />
              <Stack.Screen name="claim-detail" />
              <Stack.Screen name="new-claim" />
              <Stack.Screen name="payment-posting" />
              <Stack.Screen name="ar-followup" />
              <Stack.Screen name="eligibility" />
              <Stack.Screen name="soap-notes" />
              <Stack.Screen name="patient-statement" />
              <Stack.Screen name="denial-management" />
            </Stack>
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
