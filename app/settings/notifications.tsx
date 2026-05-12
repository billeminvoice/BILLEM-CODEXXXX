import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (val: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.primary }} />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useAuth();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.card}>
        <ToggleRow label="Email notifications" desc="Invoice updates and activity summaries." value={settings.emailNotifications} onChange={(value) => updateSettings({ emailNotifications: value })} />
        <ToggleRow label="Push notifications" desc="Mobile alerts for key billing activity." value={settings.pushNotifications} onChange={(value) => updateSettings({ pushNotifications: value })} />
        <ToggleRow label="Invoice reminders" desc="Automatic reminders before and after due date." value={settings.invoiceReminders} onChange={(value) => updateSettings({ invoiceReminders: value })} />
        <ToggleRow label="Payment alerts" desc="Instant alert when an invoice is paid." value={settings.paymentAlerts} onChange={(value) => updateSettings({ paymentAlerts: value })} />
        <ToggleRow label="Overdue alerts" desc="Notify when invoices become overdue." value={settings.overdueAlerts} onChange={(value) => updateSettings({ overdueAlerts: value })} />
        <ToggleRow label="Weekly digest" desc="One weekly summary with revenue and invoices." value={settings.weeklyDigest} onChange={(value) => updateSettings({ weeklyDigest: value })} />
        <ToggleRow label="Marketing emails" desc="Product news, tips, and feature releases." value={settings.marketingEmails} onChange={(value) => updateSettings({ marketingEmails: value })} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  card: { margin: Spacing.xl, borderRadius: Radius.lg, backgroundColor: Colors.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  rowLabel: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  rowDesc: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2, includeFontPadding: false },
});
