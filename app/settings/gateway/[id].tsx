import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { storage } from '@/services/storageService';
import { paymentService } from '@/services/paymentService';
import { STORAGE_KEYS, PAYMENT_GATEWAYS } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Input, Button } from '@/components';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import type { GatewayConnection } from '@/types';

export default function GatewayDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { settings, updateSettings } = useAuth();
  const { showAlert } = useAlert();

  const gateway = PAYMENT_GATEWAYS.find((g) => g.id === id);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    storage.get<Record<string, GatewayConnection>>(STORAGE_KEYS.GATEWAYS).then((data) => {
      if (data?.[id]) {
        const masked = Object.fromEntries(Object.keys(data[id].credentials || {}).map((field) => [field, '••••••••']));
        setCredentials(masked);
        setIsConnected(data[id].connected || false);
      }
    });
  }, [id]);

  if (!gateway) return null;

  const saveConnection = async (connected: boolean, configuredFields = Object.keys(credentials)) => {
    const all = (await storage.get<Record<string, GatewayConnection>>(STORAGE_KEYS.GATEWAYS)) || {};
    all[id] = {
      gatewayId: id,
      connected,
      credentials: Object.fromEntries(configuredFields.map((field) => [field, 'configured'])),
      isDefault: settings.defaultGateway === id,
      connectedAt: connected ? new Date().toISOString() : null,
    };
    await storage.set(STORAGE_KEYS.GATEWAYS, all);
  };

  const handleConnect = async () => {
    const missing = gateway.fields.filter((f) => !credentials[f]?.trim());
    if (missing.length > 0) {
      showAlert('Missing credentials', `Please fill in: ${missing.join(', ')}`);
      return;
    }
    setLoading(true);
    try {
      const result = await paymentService.configureGateway(id, credentials);
      await saveConnection(result.connected, gateway.fields);
      setCredentials(Object.fromEntries(gateway.fields.map((field) => [field, '••••••••'])));
      setIsConnected(result.connected);
      showAlert(
        'Connected!',
        result.mode === 'backend'
          ? `${gateway.name} is connected through the secure backend.`
          : `${gateway.name} setup is saved locally. Add backend secrets later to process live payments.`
      );
    } catch (e: any) {
      showAlert('Connection failed', e.message || `Could not connect ${gateway.name}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    showAlert('Disconnect gateway', `Remove ${gateway.name} connection?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await saveConnection(false);
          setIsConnected(false);
          setCredentials({});
        },
      },
    ]);
  };

  const handleSetDefault = async () => {
    await updateSettings({ defaultGateway: id });
    const all = (await storage.get<Record<string, GatewayConnection>>(STORAGE_KEYS.GATEWAYS)) || {};
    if (all[id]) { all[id].isDefault = true; await storage.set(STORAGE_KEYS.GATEWAYS, all); }
    showAlert('Default set', `${gateway.name} is now your default payment gateway.`);
  };

  const isDefault = settings.defaultGateway === id;
  const isStripe = id === 'stripe';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{gateway.name}</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Gateway info */}
          <View style={[styles.gatewayCard, { borderColor: gateway.color + '40' }]}>
            <View style={[styles.gatewayIcon, { backgroundColor: gateway.color + '15' }]}>
              <Image source={gateway.logoAsset} style={styles.gatewayLogo} contentFit="contain" />
            </View>
            <View style={styles.gatewayInfo}>
              <Text style={styles.gatewayName}>{gateway.name}</Text>
              <Text style={styles.gatewayDesc}>{gateway.description}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isConnected ? Colors.successLight : Colors.surfaceTertiary }]}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.success : Colors.textTertiary }]} />
              <Text style={[styles.statusText, { color: isConnected ? Colors.success : Colors.textTertiary }]}>
                {isConnected ? 'Live' : 'Not connected'}
              </Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supported payment methods</Text>
            <View style={styles.featuresCard}>
              {gateway.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Credentials */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API credentials</Text>
            <View style={styles.securityNote}>
              <MaterialIcons name="lock" size={14} color={Colors.primary} />
              <Text style={styles.securityText}>Secrets are submitted to the secure backend when available. The app only keeps connection status and masked field names.</Text>
            </View>
            {isStripe ? (
              <View style={styles.stripeActionsCard}>
                <Text style={styles.stripeActionsTitle}>Need a Stripe account first?</Text>
                <View style={styles.stripeActionsRow}>
                  <Pressable
                    style={styles.stripeActionBtn}
                    onPress={() => WebBrowser.openBrowserAsync('https://dashboard.stripe.com/register')}
                  >
                    <MaterialIcons name="person-add-alt-1" size={16} color={Colors.primary} />
                    <Text style={styles.stripeActionText}>Create Stripe Account</Text>
                  </Pressable>
                  <Pressable
                    style={styles.stripeActionBtn}
                    onPress={() => WebBrowser.openBrowserAsync('https://dashboard.stripe.com/login')}
                  >
                    <MaterialIcons name="login" size={16} color={Colors.primary} />
                    <Text style={styles.stripeActionText}>Sign In to Stripe</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            {gateway.fields.map((field) => (
              <Input
                key={field}
                label={field}
                placeholder={`Enter your ${field}`}
                value={credentials[field] || ''}
                onChangeText={(v) => setCredentials((prev) => ({ ...prev, [field]: v }))}
                secureTextEntry={field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') || field.toLowerCase().includes('private')}
                leftIcon="vpn-key"
              />
            ))}
          </View>

          {/* Webhook info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Webhook setup</Text>
            <View style={styles.webhookCard}>
              <Text style={styles.webhookLabel}>Your webhook endpoint:</Text>
              <View style={styles.webhookUrl}>
                <Text style={styles.webhookUrlText} selectable>https://api.billem.app/webhooks/{gateway.id}</Text>
                <MaterialIcons name="content-copy" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.webhookHint}>Add this URL to your {gateway.name} dashboard to receive payment notifications.</Text>
            </View>
          </View>

          {/* Actions */}
          {isConnected ? (
            <View style={styles.connectedActions}>
              {!isDefault ? (
                <Button title="Set as Default Gateway" onPress={handleSetDefault} variant="outline" fullWidth />
              ) : (
                <View style={styles.defaultNote}>
                  <MaterialIcons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.defaultNoteText}>This is your default gateway</Text>
                </View>
              )}
              <Button title="Disconnect" onPress={handleDisconnect} variant="danger" fullWidth />
            </View>
          ) : (
            <Button title={`Connect ${gateway.name}`} onPress={handleConnect} loading={loading} fullWidth size="lg" />
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  gatewayCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1.5, ...Shadow.sm },
  gatewayIcon: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  gatewayLogo: { width: 72, height: 24, borderRadius: 4, backgroundColor: '#fff' },
  gatewayInfo: { flex: 1 },
  gatewayName: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  gatewayDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, includeFontPadding: false },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { ...Typography.caption, fontWeight: '600', includeFontPadding: false },
  section: { gap: 12 },
  sectionTitle: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  featuresCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { ...Typography.body, color: Colors.text, includeFontPadding: false },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.primaryLight, padding: Spacing.md, borderRadius: Radius.md },
  securityText: { ...Typography.caption, color: Colors.primary, flex: 1, lineHeight: 18, includeFontPadding: false },
  stripeActionsCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, gap: 10, borderWidth: 1, borderColor: Colors.border },
  stripeActionsTitle: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  stripeActionsRow: { gap: 8 },
  stripeActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceSecondary, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.md },
  stripeActionText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600', includeFontPadding: false },
  webhookCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, ...Shadow.sm },
  webhookLabel: { ...Typography.label, color: Colors.textSecondary, includeFontPadding: false },
  webhookUrl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceSecondary, padding: 10, borderRadius: Radius.sm },
  webhookUrlText: { ...Typography.caption, color: Colors.primary, flex: 1, includeFontPadding: false },
  webhookHint: { ...Typography.caption, color: Colors.textTertiary, lineHeight: 18, includeFontPadding: false },
  connectedActions: { gap: 12 },
  defaultNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.md, backgroundColor: Colors.warningLight, borderRadius: Radius.md },
  defaultNoteText: { ...Typography.label, color: Colors.warning, includeFontPadding: false },
});
