import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '@/constants/theme';
import type { InvoiceStatus } from '@/types';

const STATUS_CONFIG: Record<InvoiceStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: '#F1F5F9', text: Colors.textSecondary, label: 'Draft' },
  pending: { bg: Colors.warningLight, text: Colors.warning, label: 'Pending' },
  paid: { bg: Colors.successLight, text: Colors.success, label: 'Paid' },
  overdue: { bg: Colors.errorLight, text: Colors.error, label: 'Overdue' },
  cancelled: { bg: '#F1F5F9', text: Colors.textTertiary, label: 'Cancelled' },
};

interface BadgeProps {
  status: InvoiceStatus;
}

export function StatusBadge({ status }: BadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: { ...Typography.bodySmall, fontWeight: '600', includeFontPadding: false },
});
