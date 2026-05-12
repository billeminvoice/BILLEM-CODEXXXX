import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useInvoices } from '@/hooks/useInvoices';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export default function ReportsScreen() {
  const router = useRouter();
  const { invoices, loadInvoices, stats } = useInvoices();

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const avgInvoice = useMemo(() => {
    if (!invoices.length) return 0;
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0) / invoices.length;
  }, [invoices]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Reports</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          <View style={styles.card}><Text style={styles.label}>Revenue</Text><Text style={styles.value}>{money(stats.revenue)}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Unpaid</Text><Text style={styles.value}>{money(stats.unpaid)}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Overdue</Text><Text style={styles.value}>{stats.overdue}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Avg Invoice</Text><Text style={styles.value}>{money(avgInvoice)}</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  content: { padding: Spacing.xl },
  grid: { gap: 12 },
  card: { borderRadius: Radius.lg, backgroundColor: Colors.surface, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  label: { ...Typography.caption, color: Colors.textTertiary, includeFontPadding: false },
  value: { ...Typography.title, color: Colors.text, marginTop: 6, includeFontPadding: false },
});
