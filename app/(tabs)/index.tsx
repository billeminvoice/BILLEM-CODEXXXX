import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceCard } from '@/components';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function DashboardScreen() {
  const router = useRouter();
  const { user, businessProfile } = useAuth();
  const { invoices, stats, loadInvoices, isLoading } = useInvoices();

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const onRefresh = useCallback(() => { loadInvoices(); }, [loadInvoices]);

  const firstName = (businessProfile?.ownerName || user?.name || 'there').split(' ')[0];
  const recent = invoices.slice(0, 5);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good day, {firstName} 👋</Text>
            <Text style={styles.bizName}>{businessProfile?.businessName || "Bill'em Invoice"}</Text>
          </View>
          <Pressable style={styles.notifBtn} onPress={() => {}}>
            <MaterialIcons name="notifications-none" size={24} color={Colors.text} />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        {/* HERO — Create Invoice */}
        <View style={styles.heroWrap}>
          <Pressable onPress={() => router.push('/invoice/create')}>
            <LinearGradient
              colors={['#3B82F6', '#818CF8', '#A78BFA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroLeft}>
                  <View style={styles.aiBadge}>
                    <MaterialIcons name="auto-awesome" size={12} color={Colors.accent} />
                    <Text style={styles.aiBadgeText}>AI-Powered</Text>
                  </View>
                  <Text style={styles.heroTitle}>Create Invoice</Text>
                  <Text style={styles.heroSubtitle}>Upload a photo or fill manually</Text>
                </View>
                <View style={styles.heroIconWrap}>
                  <MaterialIcons name="add-circle" size={64} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
              <View style={styles.heroActions}>
                <Pressable onPress={() => router.push('/invoice/ai-scan')} style={styles.heroBtnAI}>
                  <MaterialIcons name="document-scanner" size={16} color={Colors.primary} />
                  <Text style={styles.heroBtnAIText}>AI Scan</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/invoice/create')} style={styles.heroBtnManual}>
                  <MaterialIcons name="edit" size={14} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.heroBtnManualText}>Manual</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1.2 }]}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>{fmt(stats.revenue)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Unpaid</Text>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{fmt(stats.unpaid)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overdue</Text>
            <Text style={[styles.statValue, { color: Colors.error }]}>{stats.overdue}</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickRow}>
            {[
              { icon: 'person-add', label: 'New Client', color: '#8B5CF6', bg: '#F5F3FF', route: '/clients' },
              { icon: 'bar-chart', label: 'Reports', color: Colors.success, bg: Colors.successLight, route: '/settings' },
              { icon: 'schedule', label: 'Overdue', color: Colors.error, bg: Colors.errorLight, route: '/invoices' },
              { icon: 'settings', label: 'Settings', color: Colors.textSecondary, bg: Colors.surfaceTertiary, route: '/settings' },
            ].map((qa) => (
              <Pressable key={qa.label} onPress={() => router.push(qa.route as any)} style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85 }]}>
                <View style={[styles.quickIcon, { backgroundColor: qa.bg }]}>
                  <MaterialIcons name={qa.icon as any} size={22} color={qa.color} />
                </View>
                <Text style={styles.quickLabel}>{qa.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent invoices */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent invoices</Text>
            <Pressable onPress={() => router.push('/(tabs)/invoices')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {recent.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No invoices yet</Text>
              <Text style={styles.emptySubtitle}>Create your first invoice to get started</Text>
            </View>
          ) : (
            recent.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} onPress={() => router.push(`/invoice/${inv.id}`)} />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  greeting: { ...Typography.bodySmall, color: Colors.textSecondary, includeFontPadding: false },
  bizName: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, borderWidth: 1, borderColor: Colors.surface },
  heroWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  heroCard: { borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.lg },
  heroContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.md },
  heroLeft: { gap: 6 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start' },
  aiBadgeText: { ...Typography.caption, color: '#fff', fontWeight: '600', includeFontPadding: false },
  heroTitle: { ...Typography.hero, color: '#fff', includeFontPadding: false },
  heroSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.8)', includeFontPadding: false },
  heroIconWrap: { opacity: 0.6 },
  heroActions: { flexDirection: 'row', gap: 10 },
  heroBtnAI: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', borderRadius: Radius.md, paddingVertical: 12 },
  heroBtnAIText: { ...Typography.button, color: Colors.primary, includeFontPadding: false },
  heroBtnManual: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: 20 },
  heroBtnManualText: { ...Typography.button, color: '#fff', includeFontPadding: false },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  statCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm, flex: 1 },
  statLabel: { ...Typography.caption, color: Colors.textTertiary, includeFontPadding: false },
  statValue: { ...Typography.heading, marginTop: 4, includeFontPadding: false },
  quickSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.subheading, color: Colors.text, marginBottom: Spacing.sm, includeFontPadding: false },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, alignItems: 'center', gap: 8, ...Shadow.sm },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
  recentSection: { paddingHorizontal: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  seeAll: { ...Typography.label, color: Colors.primary, includeFontPadding: false },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyTitle: { ...Typography.subheading, color: Colors.textSecondary, includeFontPadding: false },
  emptySubtitle: { ...Typography.body, color: Colors.textTertiary, textAlign: 'center', includeFontPadding: false },
});
