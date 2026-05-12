import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { PLANS, PAYMENT_GATEWAYS, STORAGE_KEYS } from '@/constants/config';
import { storage } from '@/services/storageService';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import type { GatewayConnection } from '@/types';

function Row({ icon, label, onPress, showDivider = true }: { icon: string; label: string; onPress: () => void; showDivider?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon as any} size={18} color={Colors.textSecondary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
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
          <Row icon="payments" label={`Payment Gateways (${connectedGateways}/${PAYMENT_GATEWAYS.length} connected)`} onPress={() => router.push('/settings/gateways')} />
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
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 90, gap: 20, paddingTop: Spacing.sm },
  sectionWrap: { gap: 10 },
  sectionTitle: { ...Typography.subheading, color: Colors.textTertiary, includeFontPadding: false },
  card: { borderRadius: Radius.xl, backgroundColor: Colors.surface, overflow: 'hidden', ...Shadow.sm },
  row: { minHeight: 66, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, position: 'relative' },
  rowPressed: { backgroundColor: '#F8FAFC' },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceTertiary },
  rowLabel: { ...Typography.body, color: Colors.text, flex: 1, fontWeight: '600', includeFontPadding: false },
  rowDivider: { position: 'absolute', left: 62, right: 16, bottom: 0, height: 1, backgroundColor: Colors.divider },
  planSummary: { alignItems: 'center', paddingVertical: 6 },
  planSummaryText: { ...Typography.caption, color: Colors.textTertiary, includeFontPadding: false },
});
