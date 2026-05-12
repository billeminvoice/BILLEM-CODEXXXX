import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Input, Button } from '@/components';
import { CURRENCIES, PAYMENT_TERMS, TAX_TYPES } from '@/constants/config';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

function ChipRow({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onSelect(opt)}
          style={[chipStyles.chip, selected === opt && chipStyles.chipSelected]}
        >
          <Text style={[chipStyles.chipText, selected === opt && chipStyles.chipTextSelected]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { ...Typography.bodySmall, color: Colors.textSecondary, includeFontPadding: false },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
});

export default function TaxDetailsScreen() {
  const router = useRouter();
  const { businessProfile, saveBusinessProfile, completeOnboarding } = useAuth();

  const [taxId, setTaxId] = useState(businessProfile?.taxId || '');
  const [taxType, setTaxType] = useState(businessProfile?.taxType || 'Sales Tax');
  const [defaultTaxRate, setDefaultTaxRate] = useState(businessProfile?.defaultTaxRate || '0');
  const [taxInclusive, setTaxInclusive] = useState(businessProfile?.taxInclusive || false);
  const [currency, setCurrency] = useState(businessProfile?.currency || 'USD');
  const [paymentTerms, setPaymentTerms] = useState(businessProfile?.paymentTerms || 'Net 30');
  const [defaultNotes, setDefaultNotes] = useState(businessProfile?.defaultNotes || 'Thank you for your business!');

  const handleFinish = async () => {
    await saveBusinessProfile({
      ...businessProfile as any,
      taxId: taxId.trim(),
      taxType,
      defaultTaxRate,
      taxInclusive,
      currency,
      paymentTerms,
      defaultNotes: defaultNotes.trim(),
      invoicePrefix: businessProfile?.invoicePrefix || 'INV',
      nextInvoiceNumber: businessProfile?.nextInvoiceNumber || 1001,
    });
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
            </Pressable>
            <View style={styles.stepBar}>
              <View style={[styles.step, styles.stepDone]} />
              <View style={[styles.step, styles.stepDone]} />
              <View style={[styles.step, styles.stepActive]} />
            </View>
            <Text style={styles.stepLabel}>Step 3 of 3</Text>
          </View>

          <View style={styles.titleRow}>
            <LinearGradient colors={['#ECFDF5', '#EFF6FF']} style={styles.iconWrap}>
              <MaterialIcons name="account-balance" size={26} color={Colors.success} />
            </LinearGradient>
            <View>
              <Text style={styles.title}>Tax & preferences</Text>
              <Text style={styles.subtitle}>Used for invoices & compliance</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tax information</Text>
            <View style={styles.row2}>
              <View style={styles.flex1}>
                <Input label="Tax ID / EIN / VAT" placeholder="12-3456789" value={taxId} onChangeText={setTaxId} leftIcon="badge" />
              </View>
              <View style={styles.flex1}>
                <Input label="Tax rate (%)" placeholder="0" value={defaultTaxRate} onChangeText={setDefaultTaxRate} keyboardType="decimal-pad" leftIcon="percent" />
              </View>
            </View>
            <Text style={styles.fieldLabel}>Tax type</Text>
            <ChipRow options={TAX_TYPES} selected={taxType} onSelect={setTaxType} />
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Tax inclusive pricing</Text>
                <Text style={styles.switchDesc}>Prices already include tax</Text>
              </View>
              <Switch value={taxInclusive} onValueChange={setTaxInclusive} trackColor={{ true: Colors.primary }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Invoice preferences</Text>
            <Text style={styles.fieldLabel}>Default currency</Text>
            <ChipRow options={CURRENCIES.slice(0, 6)} selected={currency} onSelect={setCurrency} />
            <Text style={styles.fieldLabel}>Default payment terms</Text>
            <ChipRow options={PAYMENT_TERMS} selected={paymentTerms} onSelect={setPaymentTerms} />
            <Input
              label="Default invoice notes"
              placeholder="Thank you for your business!"
              value={defaultNotes}
              onChangeText={setDefaultNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <Button title="Complete Setup" onPress={handleFinish} fullWidth size="lg" />
          <Pressable onPress={() => { completeOnboarding(); router.replace('/(tabs)'); }} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  stepBar: { flex: 1, flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  stepDone: { backgroundColor: Colors.primary },
  stepActive: { backgroundColor: Colors.primary, opacity: 0.5 },
  stepLabel: { ...Typography.caption, color: Colors.textTertiary, includeFontPadding: false },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2, includeFontPadding: false },
  section: { gap: 12 },
  sectionLabel: { ...Typography.label, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, includeFontPadding: false },
  fieldLabel: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchInfo: { flex: 1 },
  switchLabel: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  switchDesc: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2, includeFontPadding: false },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { ...Typography.body, color: Colors.textTertiary, includeFontPadding: false },
});
