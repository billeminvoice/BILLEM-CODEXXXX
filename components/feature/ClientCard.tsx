import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import type { Client } from '@/types';

interface Props {
  client: Client;
  onPress: () => void;
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() || '').join('');

const AVATAR_COLORS = [Colors.primary, Colors.accent, Colors.success, '#8B5CF6', '#F59E0B'];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export const ClientCard = React.memo(function ClientCard({ client, onPress }: Props) {
  const color = getColor(client.name);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
          <Text style={[styles.initials, { color }]}>{getInitials(client.name || 'UN')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{client.name}</Text>
          {client.company ? <Text style={styles.company} numberOfLines={1}>{client.company}</Text> : null}
          <Text style={styles.email} numberOfLines={1}>{client.email}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
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
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...Typography.subheading, fontWeight: '700', includeFontPadding: false },
  info: { flex: 1 },
  name: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  company: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 1, includeFontPadding: false },
  email: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2, includeFontPadding: false },
});
