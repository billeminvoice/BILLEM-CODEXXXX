import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import type { AccountType } from '@/types';

export default function OnboardingIndexScreen() {
  const router = useRouter();
  const { saveBusinessProfile, businessProfile } = useAuth();
  const [selected, setSelected] = useState<AccountType | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    await saveBusinessProfile({ ...(businessProfile as any) || {}, accountType: selected });
    router.push('/onboarding/business-details');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.imageWrap}>
        <Image source={require('@/assets/images/onboarding-hero.png')} style={styles.heroImage} contentFit="cover" />
        <LinearGradient colors={['transparent', Colors.surface]} style={styles.heroFade} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Set up your account</Text>
        <Text style={styles.subtitle}>Choose the type of account that best fits your needs</Text>

        <View style={styles.options}>
          <Pressable
            onPress={() => setSelected('business')}
            style={[styles.option, selected === 'business' && styles.optionSelected]}
          >
            <View style={[styles.optionIcon, { backgroundColor: Colors.primaryLight }]}>
              <MaterialIcons name="business" size={28} color={Colors.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Business account</Text>
              <Text style={styles.optionDesc}>For freelancers, agencies, companies & contractors</Text>
            </View>
            <View style={[styles.radio, selected === 'business' && styles.radioSelected]}>
              {selected === 'business' ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>

          <Pressable
            onPress={() => setSelected('personal')}
            style={[styles.option, selected === 'personal' && styles.optionSelected]}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#FDF2F8' }]}>
              <MaterialIcons name="person" size={28} color={Colors.accent} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Personal account</Text>
              <Text style={styles.optionDesc}>For individuals, side projects & simple billing</Text>
            </View>
            <View style={[styles.radio, selected === 'personal' && styles.radioSelected]}>
              {selected === 'personal' ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          style={[styles.ctaBtn, !selected && styles.ctaBtnDisabled]}
        >
          <LinearGradient colors={['#3B82F6', '#818CF8']} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.ctaText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        <Text style={styles.stepHint}>Step 1 of 3</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  imageWrap: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.lg },
  title: { ...Typography.title, color: Colors.text, textAlign: 'center', includeFontPadding: false },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: -8, includeFontPadding: false },
  options: { gap: Spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionIcon: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  optionInfo: { flex: 1 },
  optionTitle: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  optionDesc: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2, includeFontPadding: false },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  ctaBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  ctaBtnDisabled: { opacity: 0.45 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  ctaText: { ...Typography.button, color: '#fff', fontSize: 16, includeFontPadding: false },
  stepHint: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', includeFontPadding: false },
});
