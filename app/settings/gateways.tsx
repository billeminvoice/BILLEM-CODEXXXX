import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { storage } from '@/services/storageService';
import { STORAGE_KEYS, PAYMENT_GATEWAYS } from '@/constants/config';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import type { GatewayConnection } from '@/types';

export default function GatewaysScreen() {
  const router = useRouter();
  const [defaultGateway, setDefaultGateway] = useState('stripe');
  const [connections, setConnections] = useState<Record<string, GatewayConnection>>({});

  useEffect(() => {
    storage.get<Record<string, GatewayConnection>>(STORAGE_KEYS.GATEWAYS).then((d) => {
      if (d) setConnections(d);
    });
    storage.get<any>(STORAGE_KEYS.SETTINGS).then((data) => {
      if (data?.defaultGateway) setDefaultGateway(data.defaultGateway);
    });
  }, []);

  const isConnected = (id: string) => !!connections[id]?.connected;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Payment Gateways</Text>
        <View style={{ width: 30 }} />
      </View>

      <FlatList
        data={PAYMENT_GATEWAYS}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              Configure your payment gateways below. Add your API credentials to accept payments. Clients will see payment links on invoices.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const connected = isConnected(item.id);
          const isDefault = defaultGateway === item.id;
          return (
            <Pressable
              onPress={() => router.push(`/settings/gateway/${item.id}`)}
              style={({ pressed }) => [styles.gatewayCard, pressed && styles.cardPressed]}
            >
              <View style={[styles.gatewayIconWrap, { backgroundColor: item.color + '18' }]}>
                <Image source={item.logoAsset} style={styles.gatewayLogo} contentFit="contain" />
              </View>
              <View style={styles.gatewayInfo}>
                <View style={styles.gatewayNameRow}>
                  <Text style={styles.gatewayName}>{item.name}</Text>
                  {isDefault && connected ? (
                    <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>
                  ) : null}
                </View>
                <Text style={styles.gatewayDesc}>{item.description}</Text>
                <View style={styles.featureTags}>
                  {item.features.slice(0, 3).map((f) => (
                    <View key={f} style={styles.featureTag}><Text style={styles.featureTagText}>{f}</Text></View>
                  ))}
                </View>
              </View>
              <View style={styles.gatewayRight}>
                <View style={[styles.statusDot, { backgroundColor: connected ? Colors.success : Colors.border }]} />
                <Text style={[styles.statusText, { color: connected ? Colors.success : Colors.textTertiary }]}>
                  {connected ? 'Connected' : 'Setup'}
                </Text>
                <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={styles.tipCard}>
            <MaterialIcons name="lock" size={14} color={Colors.primary} />
            <Text style={styles.tipText}>
              Use Stripe for card checkout links. Set it as default inside gateway details.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  list: { padding: Spacing.xl, gap: Spacing.md },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.primaryLight, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm },
  infoText: { ...Typography.bodySmall, color: Colors.primary, flex: 1, lineHeight: 20, includeFontPadding: false },
  gatewayCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 14, ...Shadow.sm },
  cardPressed: { opacity: 0.88 },
  gatewayIconWrap: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  gatewayLogo: { width: 72, height: 24, borderRadius: 4, backgroundColor: '#fff' },
  gatewayInfo: { flex: 1, gap: 4 },
  gatewayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gatewayName: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  defaultBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  defaultBadgeText: { ...Typography.caption, color: Colors.primary, fontWeight: '700', includeFontPadding: false },
  gatewayDesc: { ...Typography.caption, color: Colors.textSecondary, includeFontPadding: false },
  featureTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  featureTag: { backgroundColor: Colors.surfaceTertiary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  featureTagText: { ...Typography.caption, color: Colors.textSecondary, includeFontPadding: false },
  gatewayRight: { alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...Typography.caption, fontWeight: '600', includeFontPadding: false },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.primaryLight, padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.md },
  tipText: { ...Typography.caption, color: Colors.primary, flex: 1, lineHeight: 18, includeFontPadding: false },
});
