import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { subscriptionService } from '@/services/subscriptionService';
import { PLANS } from '@/constants/config';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import type { PlanId } from '@/types';

const PLAN_ORDER: PlanId[] = ['free', 'pro', 'business', 'enterprise'];
const PLAN_COLORS: Record<PlanId, [string, string]> = {
  free: ['#94A3B8', '#64748B'],
  pro: ['#3B82F6', '#6366F1'],
  business: ['#8B5CF6', '#EC4899'],
  enterprise: ['#0F172A', '#334155'],
};

export default function PlansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const currentPlan = user?.planId || 'free';

  const handleSelect = async (planId: PlanId) => {
    if (planId === currentPlan) return;
    if (planId === 'enterprise') {
      showAlert('Enterprise plan', 'Contact our sales team at hello@billem.app for custom pricing and features.');
      return;
    }
    setLoading(planId);
    try {
      const checkoutUrl = await subscriptionService.createCheckoutUrl(planId as 'pro' | 'business', user);
      if (checkoutUrl) {
        await Linking.openURL(checkoutUrl);
      }
      showAlert('Checkout opened', `Complete Stripe checkout for the ${PLANS[planId].name} plan. We update your plan after successful payment.`);
    } catch (e: any) {
      showAlert('Checkout unavailable', e.message || 'Add your Stripe billing keys to enable subscription checkout.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Choose your plan</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Start free, upgrade anytime</Text>

        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = planId === currentPlan;
          const [c1, c2] = PLAN_COLORS[planId];

          return (
            <Pressable
              key={planId}
              onPress={() => handleSelect(planId)}
              style={[styles.planCard, isCurrent && styles.planCardCurrent]}
            >
              <LinearGradient colors={[c1, c2]} style={styles.planHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{plan.priceLabel}{plan.price > 0 ? ' / month' : ''}</Text>
                </View>
                {isCurrent ? (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                ) : loading === planId ? (
                  <MaterialIcons name="hourglass-empty" size={22} color="#fff" />
                ) : (
                  <View style={styles.selectBtn}>
                    <Text style={styles.selectBtnText}>{planId === 'enterprise' ? 'Contact' : 'Select'}</Text>
                  </View>
                )}
              </LinearGradient>

              <View style={styles.planFeatures}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
                {plan.customBranding ? (
                  <View style={styles.featureRow}>
                    <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                    <Text style={styles.featureText}>Custom branding</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        <View style={styles.securityNote}>
          <MaterialIcons name="lock" size={16} color={Colors.textTertiary} />
          <Text style={styles.securityText}>Secure payment via Stripe. Cancel anytime.</Text>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  content: { padding: Spacing.xl, gap: Spacing.md },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
  planCard: { borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.md },
  planCardCurrent: { borderWidth: 2, borderColor: Colors.primary },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  planName: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', includeFontPadding: false },
  planPrice: { ...Typography.heading, color: '#fff', includeFontPadding: false },
  currentBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  currentBadgeText: { ...Typography.buttonSm, color: '#fff', includeFontPadding: false },
  selectBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  selectBtnText: { ...Typography.buttonSm, color: Colors.text, includeFontPadding: false },
  planFeatures: { backgroundColor: Colors.surface, padding: Spacing.lg, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { ...Typography.body, color: Colors.text, includeFontPadding: false },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  securityText: { ...Typography.caption, color: Colors.textTertiary, includeFontPadding: false },
});
