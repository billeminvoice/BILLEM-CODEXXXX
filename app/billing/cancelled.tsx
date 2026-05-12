import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function BillingCancelledScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <MaterialIcons name="info" size={54} color={Colors.warning} />
        <Text style={styles.title}>Checkout Cancelled</Text>
        <Text style={styles.subtitle}>No charges were made. You can upgrade again anytime.</Text>
        <Pressable style={styles.cta} onPress={() => router.replace('/settings/plans')}>
          <Text style={styles.ctaText}>Back To Plans</Text>
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
