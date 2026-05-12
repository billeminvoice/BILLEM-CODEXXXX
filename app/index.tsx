import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';
import { storage } from '@/services/storageService';
import { STORAGE_KEYS } from '@/constants/config';

export default function Index() {
  const { user, isLoading, onboardingDone } = useAuth();
  const router = useRouter();
  const [checkedPaymentsCta, setCheckedPaymentsCta] = useState(false);
  const [paymentCtaDone, setPaymentCtaDone] = useState(false);

  useEffect(() => {
    (async () => {
      const done = await storage.get<boolean>(STORAGE_KEYS.PAYMENT_CTA_DONE);
      setPaymentCtaDone(!!done);
      setCheckedPaymentsCta(true);
    })();
  }, []);

  useEffect(() => {
    if (isLoading || !checkedPaymentsCta) return;
    if (!user) {
      router.replace('/auth/login');
    } else if (!onboardingDone) {
      router.replace('/onboarding');
    } else if (!paymentCtaDone) {
      router.replace('/onboarding/connect-payments');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, onboardingDone, paymentCtaDone, checkedPaymentsCta, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
});
