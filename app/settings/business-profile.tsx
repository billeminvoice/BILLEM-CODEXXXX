import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Input, Button } from '@/components';
import { addressService, type AddressSuggestion } from '@/services/addressService';
import { CURRENCIES, PAYMENT_TERMS, TAX_TYPES } from '@/constants/config';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

function ChipRow({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => (
        <Pressable key={opt} onPress={() => onSelect(opt)} style={[chipStyles.chip, selected === opt && chipStyles.chipSelected]}>
          <Text style={[chipStyles.chipText, selected === opt && chipStyles.chipTextSelected]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { ...Typography.bodySmall, color: Colors.textSecondary, includeFontPadding: false },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
});

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { businessProfile, saveBusinessProfile } = useAuth();
  const { showAlert } = useAlert();
  const bp = businessProfile as any || {};

  const [businessName, setBusinessName] = useState(bp.businessName || '');
  const [ownerName, setOwnerName] = useState(bp.ownerName || '');
  const [email, setEmail] = useState(bp.email || '');
  const [phone, setPhone] = useState(bp.phone || '');
  const [website, setWebsite] = useState(bp.website || '');
  const [address, setAddress] = useState(bp.address || '');
  const [city, setCity] = useState(bp.city || '');
  const [state, setState] = useState(bp.state || '');
  const [zipCode, setZipCode] = useState(bp.zipCode || '');
  const [country, setCountry] = useState(bp.country || 'United States');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [taxId, setTaxId] = useState(bp.taxId || '');
  const [taxType, setTaxType] = useState(bp.taxType || 'Sales Tax');
  const [defaultTaxRate, setDefaultTaxRate] = useState(bp.defaultTaxRate || '0');
  const [taxInclusive, setTaxInclusive] = useState(bp.taxInclusive || false);
  const [currency, setCurrency] = useState(bp.currency || 'USD');
  const [paymentTerms, setPaymentTerms] = useState(bp.paymentTerms || 'Net 30');
  const [invoicePrefix, setInvoicePrefix] = useState(bp.invoicePrefix || 'INV');
  const [defaultNotes, setDefaultNotes] = useState(bp.defaultNotes || '');
  const [saving, setSaving] = useState(false);

  const searchAddresses = async (value: string) => {
    setAddress(value);
    const suggestions = await addressService.autocomplete(value);
    setAddressSuggestions(suggestions);
  };

  const applyAddress = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.street || suggestion.label);
    setCity(suggestion.city || city);
    setState(suggestion.state || state);
    setZipCode(suggestion.zipCode || zipCode);
    setCountry(suggestion.country || country);
    setAddressSuggestions([]);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveBusinessProfile({
      ...bp,
      businessName, ownerName, email, phone, website,
      address, city, state, zipCode, country,
      taxId, taxType, defaultTaxRate, taxInclusive,
      currency, paymentTerms, invoicePrefix,
      defaultNotes,
    });
    setSaving(false);
    showAlert('Saved', 'Business profile updated successfully.');
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Business Profile</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Identity</Text>
            <Input label="Business / Company name" placeholder="Acme Inc." value={businessName} onChangeText={setBusinessName} leftIcon="business" />
            <Input label="Owner / Contact name" placeholder="John Smith" value={ownerName} onChangeText={setOwnerName} leftIcon="person" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Contact</Text>
            <Input label="Invoice email" placeholder="invoices@company.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon="email" />
            <Input label="Phone" placeholder="+1 (555) 000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="phone" />
            <Input label="Website" placeholder="www.company.com" value={website} onChangeText={setWebsite} autoCapitalize="none" leftIcon="language" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Address</Text>
            <Input label="Street address" placeholder="123 Main Street" value={address} onChangeText={searchAddresses} leftIcon="home" />
            {addressSuggestions.length > 0 ? (
              <View style={styles.addressDropdown}>
                {addressSuggestions.map((suggestion) => (
                  <Pressable key={suggestion.id} style={styles.addressRow} onPress={() => applyAddress(suggestion)}>
                    <Text style={styles.addressRowText}>{suggestion.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.row2}>
              <View style={styles.flex1}><Input label="City" placeholder="San Francisco" value={city} onChangeText={setCity} /></View>
              <View style={styles.flex1}><Input label="State" placeholder="CA" value={state} onChangeText={setState} /></View>
            </View>
            <View style={styles.row2}>
              <View style={styles.flex1}><Input label="ZIP / Postal" placeholder="94102" value={zipCode} onChangeText={setZipCode} keyboardType="numeric" /></View>
              <View style={styles.flex1}><Input label="Country" placeholder="United States" value={country} onChangeText={setCountry} /></View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tax information</Text>
            <View style={styles.row2}>
              <View style={styles.flex1}><Input label="Tax ID / EIN / VAT" placeholder="12-3456789" value={taxId} onChangeText={setTaxId} leftIcon="badge" /></View>
              <View style={styles.flex1}><Input label="Tax rate (%)" placeholder="0" value={defaultTaxRate} onChangeText={setDefaultTaxRate} keyboardType="decimal-pad" leftIcon="percent" /></View>
            </View>
            <Text style={styles.fieldLabel}>Tax type</Text>
            <ChipRow options={TAX_TYPES} selected={taxType} onSelect={setTaxType} />
            <View style={styles.switchRow}>
              <View style={styles.flex1}>
                <Text style={styles.switchLabel}>Tax inclusive</Text>
                <Text style={styles.switchDesc}>Prices already include tax</Text>
              </View>
              <Switch value={taxInclusive} onValueChange={setTaxInclusive} trackColor={{ true: Colors.primary }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Invoice preferences</Text>
            <Input label="Invoice prefix" placeholder="INV" value={invoicePrefix} onChangeText={setInvoicePrefix} leftIcon="tag" hint="e.g. INV, BILL, #" />
            <Text style={styles.fieldLabel}>Default currency</Text>
            <ChipRow options={CURRENCIES.slice(0, 6)} selected={currency} onSelect={setCurrency} />
            <Text style={styles.fieldLabel}>Default payment terms</Text>
            <ChipRow options={PAYMENT_TERMS} selected={paymentTerms} onSelect={setPaymentTerms} />
            <Input label="Default invoice notes" placeholder="Thank you for your business!" value={defaultNotes} onChangeText={setDefaultNotes} multiline numberOfLines={3} />
          </View>

          <Button title="Save Changes" onPress={handleSave} loading={saving} fullWidth size="lg" />
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
  title: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  section: { gap: 12 },
  sectionLabel: { ...Typography.label, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, includeFontPadding: false },
  fieldLabel: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchLabel: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  switchDesc: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2, includeFontPadding: false },
  addressDropdown: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.surface },
  addressRow: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  addressRowText: { ...Typography.bodySmall, color: Colors.text, includeFontPadding: false },
});
