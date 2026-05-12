import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBadge } from '@/components/ui/Badge';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import type { Invoice } from '@/types';

interface Props {
  invoice: Invoice;
  onPress: () => void;
}

const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() || '').join('');

export const InvoiceCard = React.memo(function InvoiceCard({ invoice, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{getInitials(invoice.clientName || 'UN')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.clientName} numberOfLines={1}>{invoice.clientName || 'No Client'}</Text>
          <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
          <Text style={styles.date}>Due {formatDate(invoice.dueDate)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatCurrency(invoice.total, invoice.currency)}</Text>
          <StatusBadge status={invoice.status} />
          <MaterialIcons name="chevron-right" size={16} color={Colors.textTertiary} style={{ marginTop: 4 }} />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.88 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...Typography.subheading, color: Colors.primary, includeFontPadding: false },
  info: { flex: 1 },
  clientName: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  invoiceNum: { ...Typography.caption, color: Colors.primary, marginTop: 2, includeFontPadding: false },
  date: { ...Typography.caption, color: Colors.textTertiary, marginTop: 1, includeFontPadding: false },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
});
