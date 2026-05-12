import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { PlanId } from '@/types';

const ALLOWED_PLANS: PlanId[] = ['pro', 'business'];

export default function BillingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plan?: string }>();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Confirming your upgrade...');

  useEffect(() => {
    (async () => {
      const plan = (params.plan || '').toString() as PlanId;
      if (!ALLOWED_PLANS.includes(plan)) {
        setMessage('Payment was successful. Please return to the app.');
        setLoading(false);
        return;
      }
      await authService.updatePlan(plan);
      await refreshUser();
      setMessage(`Your plan is now ${plan === 'pro' ? 'Pro' : 'Business'}.`);
      setLoading(false);
    })();
  }, [params.plan, refreshUser]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="large" color={Colors.primary} /> : <MaterialIcons name="check-circle" size={54} color={Colors.success} />}
        <Text style={styles.title}>Payment Confirmed</Text>
        <Text style={styles.subtitle}>{message}</Text>
        <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)/settings')}>
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xl },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
  cta: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  ctaText: { ...Typography.button, color: '#fff', includeFontPadding: false },
});
