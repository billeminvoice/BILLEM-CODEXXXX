import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getSupabaseClient } from '@/template';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

type Status = {
  connected: boolean;
  provider: string;
  resendConfigured: boolean;
  sendgridConfigured: boolean;
  fromEmail: string;
};

export default function EmailDeliveryScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.functions.invoke('email-service-status');
      setStatus(data?.data || null);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Email Delivery</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Connection Status</Text>
        <Text style={[styles.value, { color: status?.connected ? Colors.success : Colors.warning }]}>
          {status?.connected ? `${status.provider} Connected` : 'Not Connected'}
        </Text>
        <Text style={styles.meta}>Resend: {status?.resendConfigured ? 'Configured' : 'Not configured'}</Text>
        <Text style={styles.meta}>SendGrid: {status?.sendgridConfigured ? 'Configured' : 'Not configured'}</Text>
        <Text style={styles.meta}>From Email: {status?.fromEmail || 'Not set'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  card: { margin: Spacing.xl, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: 8 },
  label: { ...Typography.caption, color: Colors.textTertiary, includeFontPadding: false },
  value: { ...Typography.title, includeFontPadding: false },
  meta: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
});
