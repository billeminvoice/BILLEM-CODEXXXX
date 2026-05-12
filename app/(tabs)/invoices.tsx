import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceCard } from '@/components';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import type { InvoiceStatus } from '@/types';

const FILTERS: { label: string; value: InvoiceStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Draft', value: 'draft' },
];

export default function InvoicesScreen() {
  const router = useRouter();
  const { invoices, loadInvoices } = useInvoices();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchFilter = filter === 'all' || inv.status === filter;
      const matchSearch = !search || inv.clientName.toLowerCase().includes(search.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [invoices, filter, search]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <Pressable onPress={() => router.push('/invoice/create')} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by client or invoice #"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      {/* Filters */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(i) => i.value}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setFilter(item.value)}
              style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <InvoiceCard invoice={item} onPress={() => router.push(`/invoice/${item.id}`)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>{search || filter !== 'all' ? 'No matching invoices' : 'No invoices yet'}</Text>
            <Text style={styles.emptySubtitle}>{search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Tap + to create your first invoice'}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { ...Typography.title, color: Colors.text, includeFontPadding: false },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingRight: 12, ...Shadow.sm,
  },
  searchIcon: { paddingLeft: 14, paddingRight: 8 },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 12, includeFontPadding: false },
  filterWrap: { marginBottom: Spacing.sm },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  filterText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500', includeFontPadding: false },
  filterTextActive: { color: Colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyTitle: { ...Typography.subheading, color: Colors.textSecondary, includeFontPadding: false },
  emptySubtitle: { ...Typography.body, color: Colors.textTertiary, textAlign: 'center', includeFontPadding: false },
});
