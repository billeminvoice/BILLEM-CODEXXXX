import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { InvoiceProvider } from '@/contexts/InvoiceContext';
import { ClientProvider } from '@/contexts/ClientContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <InvoiceProvider>
            <ClientProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/signup" />
                <Stack.Screen name="onboarding/index" />
                <Stack.Screen name="onboarding/business-details" />
                <Stack.Screen name="onboarding/tax-details" />
                <Stack.Screen name="onboarding/connect-payments" />
                <Stack.Screen name="invoice/create" options={{ presentation: 'modal' }} />
                <Stack.Screen name="invoice/[id]" />
                <Stack.Screen name="invoice/ai-scan" options={{ presentation: 'modal' }} />
                <Stack.Screen name="settings/plans" />
                <Stack.Screen name="settings/gateways" />
                <Stack.Screen name="settings/gateway/[id]" />
                <Stack.Screen name="settings/business-profile" />
                <Stack.Screen name="settings/notifications" />
                <Stack.Screen name="settings/reports" />
                <Stack.Screen name="settings/support" />
                <Stack.Screen name="settings/expenses" />
                <Stack.Screen name="settings/time-tracking" />
                <Stack.Screen name="settings/email-delivery" />
                <Stack.Screen name="billing/success" />
                <Stack.Screen name="billing/cancelled" />
              </Stack>
            </ClientProvider>
          </InvoiceProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
