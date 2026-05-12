import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { PLANS, PAYMENT_GATEWAYS, STORAGE_KEYS } from '@/constants/config';
import { storage } from '@/services/storageService';
import { Spacing, Typography } from '@/constants/theme';
import type { GatewayConnection } from '@/types';

function Row({ icon, label, onPress, showDivider = true }: { icon: string; label: string; onPress: () => void; showDivider?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <MaterialIcons name={icon as any} size={30} color="#E5E7EB" />
      <Text style={styles.rowLabel}>{label}</Text>
      <MaterialIcons name="chevron-right" size={34} color="#6B7280" />
      {showDivider ? <View style={styles.rowDivider} /> : null}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [connectedGateways, setConnectedGateways] = useState(0);

  useEffect(() => {
    storage.get<Record<string, GatewayConnection>>(STORAGE_KEYS.GATEWAYS).then((data) => {
      setConnectedGateways(Object.values(data || {}).filter((gateway) => gateway.connected).length);
    });
  }, []);

  const plan = PLANS[user?.planId || 'free'];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Section title="Payments">
          <Row icon="download" label={`Payments Received (${connectedGateways}/${PAYMENT_GATEWAYS.length} connected)`} onPress={() => router.push('/settings/gateways')} />
          <Row icon="credit-card" label="Billing Plan" onPress={() => router.push('/settings/plans')} showDivider={false} />
        </Section>

        <Section title="Expenses">
          <Row icon="receipt-long" label="Expenses" onPress={() => router.push('/settings/expenses')} showDivider={false} />
        </Section>

        <Section title="Time Tracking">
          <Row icon="work-outline" label="Projects" onPress={() => router.push('/settings/time-tracking?tab=projects')} />
          <Row icon="description" label="Timesheets" onPress={() => router.push('/settings/time-tracking?tab=timesheets')} />
          <Row icon="timer" label="Timer" onPress={() => router.push('/settings/time-tracking?tab=timer')} showDivider={false} />
        </Section>

        <Section title="Others">
          <Row icon="bar-chart" label="Reports" onPress={() => router.push('/settings/reports')} />
          <Row icon="settings" label="Business Settings" onPress={() => router.push('/settings/business-profile')} />
          <Row icon="mail-outline" label="Email Delivery" onPress={() => router.push('/settings/email-delivery')} />
          <Row icon="notifications-none" label="Notifications" onPress={() => router.push('/settings/notifications')} showDivider={false} />
        </Section>

        <Section title="Support & Feedback">
          <Row icon="support-agent" label="Help And Support" onPress={() => router.push('/settings/support')} showDivider={false} />
        </Section>

        <View style={styles.planSummary}>
          <Text style={styles.planSummaryText}>{plan.name} plan active</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#030712' },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 90, gap: 24 },
  sectionWrap: { gap: 12 },
  sectionTitle: { ...Typography.heading, color: '#9CA3AF', includeFontPadding: false },
  card: { borderRadius: 34, backgroundColor: '#111827', overflow: 'hidden' },
  row: { minHeight: 104, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 18, position: 'relative' },
  rowPressed: { backgroundColor: '#1F2937' },
  rowLabel: { ...Typography.title, color: '#F3F4F6', flex: 1, includeFontPadding: false },
  rowDivider: { position: 'absolute', left: 84, right: 22, bottom: 0, height: 1, backgroundColor: '#374151' },
  planSummary: { alignItems: 'center', paddingVertical: 8 },
  planSummaryText: { ...Typography.caption, color: '#9CA3AF', includeFontPadding: false },
});
