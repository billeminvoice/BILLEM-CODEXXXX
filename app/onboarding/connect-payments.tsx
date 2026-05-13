import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { storage } from '@/services/storageService';
import { STORAGE_KEYS } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Radius, Spacing, Typography, Shadow } from '@/constants/theme';

async function finish(router: ReturnType<typeof useRouter>) {
  await storage.set(STORAGE_KEYS.PAYMENT_CTA_DONE, true);
  router.replace('/(tabs)');
}

export default function ConnectPaymentsScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();

  const handleSkip = async () => {
    await completeOnboarding();
    await finish(router);
  };

  const handleConnectStripe = async () => {
    await completeOnboarding();
    await finish(router);
    router.push('/settings/gateway/stripe');
  };


  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <LinearGradient colors={['#DBEAFE', '#FCE7F3']} style={styles.badge}>
          <MaterialIcons name="bolt" size={24} color={Colors.primary} />
        </LinearGradient>
        <Text style={styles.title}>Connect Payments Before You Start</Text>
        <Text style={styles.subtitle}>
          Link Stripe now so every invoice can include a live pay link right away.
        </Text>

        <Pressable style={styles.gatewayCard} onPress={handleConnectStripe}>
          <Image source={require('@/assets/images/stripe-wordmark.png')} style={styles.logo} contentFit="contain" />
          <Text style={styles.gatewayName}>Stripe</Text>
          <MaterialIcons name="chevron-right" size={22} color={Colors.textTertiary} />
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  content: { flex: 1, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: 14 },
  badge: { width: 70, height: 70, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { ...Typography.heading, color: Colors.text, textAlign: 'center', includeFontPadding: false },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', maxWidth: 340, includeFontPadding: false },
  gatewayCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadow.sm,
  },
  logo: { width: 84, height: 24, borderRadius: 4, backgroundColor: '#fff' },
  gatewayName: { ...Typography.subheading, color: Colors.text, flex: 1, includeFontPadding: false },
  skipBtn: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 18 },
  skipText: { ...Typography.body, color: Colors.textTertiary, includeFontPadding: false },
});
