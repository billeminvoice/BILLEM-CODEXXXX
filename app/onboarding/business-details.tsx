import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Input, Button } from '@/components';
import { addressService, type AddressSuggestion } from '@/services/addressService';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

export default function BusinessDetailsScreen() {
  const router = useRouter();
  const { businessProfile, saveBusinessProfile } = useAuth();
  const { showAlert } = useAlert();
  const isBusiness = businessProfile?.accountType === 'business';

  const [businessName, setBusinessName] = useState(businessProfile?.businessName || '');
  const [ownerName, setOwnerName] = useState(businessProfile?.ownerName || '');
  const [email, setEmail] = useState(businessProfile?.email || '');
  const [phone, setPhone] = useState(businessProfile?.phone || '');
  const [website, setWebsite] = useState(businessProfile?.website || '');
  const [address, setAddress] = useState(businessProfile?.address || '');
  const [city, setCity] = useState(businessProfile?.city || '');
  const [state, setState] = useState(businessProfile?.state || '');
  const [zipCode, setZipCode] = useState(businessProfile?.zipCode || '');
  const [country, setCountry] = useState(businessProfile?.country || 'United States');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAddresses = async (value: string) => {
    setAddress(value);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(async () => {
      const suggestions = await addressService.autocomplete(value);
      setAddressSuggestions(suggestions);
    }, 220);
  };

  const applyAddress = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.street || suggestion.label);
    setCity(suggestion.city || city);
    setState(suggestion.state || state);
    setZipCode(suggestion.zipCode || zipCode);
    setCountry(suggestion.country || country);
    setAddressSuggestions([]);
  };

  const handleNext = async () => {
    if (!ownerName.trim() || !email.trim()) {
      showAlert('Required Fields', 'Please provide your name and email.');
      return;
    }
    await saveBusinessProfile({
      ...businessProfile as any,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      website: website.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
      invoicePrefix: 'INV',
      nextInvoiceNumber: 1001,
    });
    router.push('/onboarding/tax-details');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
            </Pressable>
            <View style={styles.stepBar}>
              <View style={[styles.step, styles.stepDone]} />
              <View style={[styles.step, styles.stepActive]} />
              <View style={styles.step} />
            </View>
            <Text style={styles.stepLabel}>Step 2 of 3</Text>
          </View>

          <View style={styles.titleRow}>
            <LinearGradient colors={['#EFF6FF', '#FDF2F8']} style={styles.iconWrap}>
              <MaterialIcons name={isBusiness ? 'business' : 'person'} size={26} color={Colors.primary} />
            </LinearGradient>
            <View>
              <Text style={styles.title}>{isBusiness ? 'Business details' : 'Your details'}</Text>
              <Text style={styles.subtitle}>This appears on your invoices</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Identity</Text>
            {isBusiness ? (
              <Input label="Business / Company name" placeholder="Acme Inc." value={businessName} onChangeText={setBusinessName} leftIcon="business" />
            ) : null}
            <Input label={isBusiness ? "Owner / Contact name" : "Full name"} placeholder="John Smith" value={ownerName} onChangeText={setOwnerName} leftIcon="person" required />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Contact</Text>
            <Input label="Invoice email" placeholder="invoices@company.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon="email" required />
            <Input label="Phone number" placeholder="+1 (555) 000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="phone" />
            {isBusiness ? (
              <Input label="Website" placeholder="www.company.com" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" leftIcon="language" />
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Address</Text>
            <Input label="Street address" placeholder="123 Main Street" value={address} onChangeText={searchAddresses} leftIcon="home" />
            {addressSuggestions.length > 0 ? (
              <View style={styles.addressDropdown}>
                <Pressable style={[styles.addressRow, styles.addressHintRow]} onPress={() => applyAddress(addressSuggestions[0])}>
                  <MaterialIcons name="auto-awesome" size={14} color={Colors.primary} />
                  <Text style={styles.addressHintText}>Autofill with best match: {addressSuggestions[0].label}</Text>
                </Pressable>
                {addressSuggestions.map((suggestion) => (
                  <Pressable key={suggestion.id} style={styles.addressRow} onPress={() => applyAddress(suggestion)}>
                    <Text style={styles.addressRowText}>{suggestion.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.row2}>
              <View style={styles.flex1}>
                <Input label="City" placeholder="San Francisco" value={city} onChangeText={setCity} />
              </View>
              <View style={styles.flex1}>
                <Input label="State" placeholder="CA" value={state} onChangeText={setState} />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.flex1}>
                <Input label="ZIP / Postal" placeholder="94102" value={zipCode} onChangeText={setZipCode} keyboardType="numeric" />
              </View>
              <View style={styles.flex1}>
                <Input label="Country" placeholder="United States" value={country} onChangeText={setCountry} />
              </View>
            </View>
          </View>

          <Button title="Continue to Tax Details" onPress={handleNext} fullWidth size="lg" />
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
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  addressDropdown: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.surface },
  addressHintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryLight },
  addressHintText: { ...Typography.bodySmall, color: Colors.primary, flex: 1, includeFontPadding: false },
  addressRow: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  addressRowText: { ...Typography.bodySmall, color: Colors.text, includeFontPadding: false },
});
