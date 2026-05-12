import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Input, Button } from '@/components';
import { invoiceService, calcTotals } from '@/services/invoiceService';
import { emailService } from '@/services/emailService';
import { addressService, type AddressSuggestion } from '@/services/addressService';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import type { Invoice, LineItem } from '@/types';

const fmt = (n: number) => `$${n.toFixed(2)}`;

function LineItemRow({ item, index, onChange, onDelete }: { item: LineItem; index: number; onChange: (idx: number, field: keyof LineItem, val: string) => void; onDelete: (idx: number) => void }) {
  return (
    <View style={liStyles.wrap}>
      <View style={liStyles.header}>
        <Text style={liStyles.label}>Item {index + 1}</Text>
        <Pressable onPress={() => onDelete(index)} hitSlop={8}>
          <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
        </Pressable>
      </View>
      <Input placeholder="Description" value={item.description} onChangeText={(v) => onChange(index, 'description', v)} containerStyle={liStyles.desc} />
      <View style={liStyles.row}>
        <View style={liStyles.qty}>
          <Input label="Qty" placeholder="1" value={String(item.quantity)} onChangeText={(v) => onChange(index, 'quantity', v)} keyboardType="decimal-pad" />
        </View>
        <View style={liStyles.rate}>
          <Input label="Rate ($)" placeholder="0.00" value={String(item.rate)} onChangeText={(v) => onChange(index, 'rate', v)} keyboardType="decimal-pad" />
        </View>
        <View style={liStyles.amount}>
          <Text style={liStyles.amtLabel}>Amount</Text>
          <Text style={liStyles.amtValue}>{fmt(item.amount)}</Text>
        </View>
      </View>
    </View>
  );
}

const liStyles = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md, padding: Spacing.md, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...Typography.label, color: Colors.textSecondary, includeFontPadding: false },
  desc: {},
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  qty: { width: 64 },
  rate: { flex: 1 },
  amount: { width: 76, alignItems: 'flex-end', paddingBottom: 13 },
  amtLabel: { ...Typography.caption, color: Colors.textTertiary, includeFontPadding: false },
  amtValue: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
});

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string; id?: string }>();
  const { createInvoice, updateInvoice, invoices, markSent } = useInvoices();
  const { clients, loadClients } = useClients();
  const { businessProfile } = useAuth();
  const { showAlert } = useAlert();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0];
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([invoiceService.newLineItem()]);
  const [taxRate, setTaxRate] = useState(businessProfile?.defaultTaxRate || '0');
  const [discountValue, setDiscountValue] = useState('0');
  const [notes, setNotes] = useState(businessProfile?.defaultNotes || '');
  const [terms, setTerms] = useState('Payment is due within the specified terms.');
  const [loading, setLoading] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const editingInvoice = params.id ? invoices.find((i) => i.id === params.id) : null;

  useEffect(() => {
    loadClients();
    if (editingInvoice) {
      setClientName(editingInvoice.clientName);
      setClientEmail(editingInvoice.clientEmail);
      setClientAddress(editingInvoice.clientAddress);
      setIssueDate(editingInvoice.issueDate);
      setDueDate(editingInvoice.dueDate);
      setLineItems(editingInvoice.lineItems);
      setTaxRate(String(editingInvoice.taxRate));
      setDiscountValue(String(editingInvoice.discountValue));
      setNotes(editingInvoice.notes);
      setTerms(editingInvoice.terms);
    } else if (params.prefill) {
      try {
        const data = JSON.parse(params.prefill);
        if (data.clientName) setClientName(data.clientName);
        if (data.clientEmail) setClientEmail(data.clientEmail);
        if (data.clientAddress) setClientAddress(data.clientAddress);
        if (data.lineItems) setLineItems(data.lineItems.map((li: any) => ({ ...invoiceService.newLineItem(), ...li, amount: li.quantity * li.rate })));
        if (data.taxRate) setTaxRate(String(data.taxRate));
        if (data.discountValue) setDiscountValue(String(data.discountValue));
        if (data.notes) setNotes(data.notes);
        if (data.dueDate) setDueDate(data.dueDate);
        if (data.issueDate) setIssueDate(data.issueDate);
      } catch {}
    }
  }, [editingInvoice, loadClients, params.prefill]);

  const updateItem = (idx: number, field: keyof LineItem, val: string) => {
    setLineItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: field === 'description' ? val : parseFloat(val) || 0 };
      updated.amount = updated.quantity * updated.rate;
      return updated;
    }));
  };

  const addItem = () => setLineItems((prev) => [...prev, invoiceService.newLineItem()]);
  const removeItem = (idx: number) => setLineItems((prev) => prev.filter((_, i) => i !== idx));
  const searchAddresses = async (value: string) => {
    setClientAddress(value);
    const suggestions = await addressService.autocomplete(value);
    setAddressSuggestions(suggestions);
  };

  const totals = calcTotals(lineItems, parseFloat(taxRate) || 0, 'percent', parseFloat(discountValue) || 0);

  const handleSave = async (status: 'draft' | 'pending') => {
    if (!clientName.trim()) { showAlert('Client required', 'Please enter a client name.'); return; }
    if (status === 'pending' && !clientEmail.trim()) { showAlert('Email required', 'Add the client email so Bill’em can send the invoice and payment link.'); return; }
    if (lineItems.every((i) => !i.description)) { showAlert('Add items', 'Please add at least one line item.'); return; }
    setLoading(true);
    try {
      const payload: Partial<Invoice> = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim(),
        issueDate,
        dueDate,
        lineItems,
        taxRate: parseFloat(taxRate) || 0,
        discountType: 'percent' as const,
        discountValue: parseFloat(discountValue) || 0,
        notes,
        terms,
        currency: businessProfile?.currency || 'USD',
        status,
      };
      const inv = editingInvoice
        ? await updateInvoice(editingInvoice.id, payload)
        : await createInvoice(payload);

      if (status === 'pending') {
        try {
          const result = await emailService.sendInvoice(inv, businessProfile);
          if (!result.sent) {
            await Linking.openURL(emailService.getMailtoLink(inv, businessProfile));
          }
        } catch {
          await Linking.openURL(emailService.getMailtoLink(inv, businessProfile));
        }
        await markSent(inv.id);
      }
      router.replace(`/invoice/${inv.id}`);
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</Text>
        <Pressable onPress={() => router.push('/invoice/ai-scan')} style={styles.aiBtn}>
          <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
          <Text style={styles.aiBtnText}>AI Scan</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Client */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bill to</Text>
              {clients.length > 0 ? (
                <Pressable onPress={() => setShowClientPicker(!showClientPicker)}>
                  <Text style={styles.pickClient}>Pick client</Text>
                </Pressable>
              ) : null}
            </View>
            {showClientPicker ? (
              <View style={styles.clientPicker}>
                {clients.map((c) => (
                  <Pressable key={c.id} onPress={() => { setClientName(c.name); setClientEmail(c.email); setClientAddress([c.address, c.city, c.state].filter(Boolean).join(', ')); setShowClientPicker(false); }} style={styles.clientPickerRow}>
                    <Text style={styles.clientPickerName}>{c.name}</Text>
                    {c.company ? <Text style={styles.clientPickerCompany}>{c.company}</Text> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Input placeholder="Client / Business name" value={clientName} onChangeText={setClientName} leftIcon="person" />
            <Input placeholder="Email address" value={clientEmail} onChangeText={setClientEmail} keyboardType="email-address" autoCapitalize="none" leftIcon="email" />
            <Input placeholder="Address (optional)" value={clientAddress} onChangeText={searchAddresses} leftIcon="home" />
            {addressSuggestions.length > 0 ? (
              <View style={styles.clientPicker}>
                {addressSuggestions.map((suggestion) => (
                  <Pressable key={suggestion.id} onPress={() => { setClientAddress(suggestion.label); setAddressSuggestions([]); }} style={styles.clientPickerRow}>
                    <Text style={styles.clientPickerName}>{suggestion.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dates</Text>
            <View style={styles.row2}>
              <View style={styles.flex1}><Input label="Issue date" value={issueDate} onChangeText={setIssueDate} placeholder="YYYY-MM-DD" leftIcon="event" /></View>
              <View style={styles.flex1}><Input label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" leftIcon="event-available" /></View>
            </View>
          </View>

          {/* Line items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Line items</Text>
            <View style={styles.itemsList}>
              {lineItems.map((item, idx) => (
                <LineItemRow key={item.id} item={item} index={idx} onChange={updateItem} onDelete={removeItem} />
              ))}
            </View>
            <Pressable onPress={addItem} style={styles.addItemBtn}>
              <MaterialIcons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addItemText}>Add line item</Text>
            </Pressable>
          </View>

          {/* Totals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Totals</Text>
            <View style={styles.totalsCard}>
              <View style={styles.row2}>
                <View style={styles.flex1}><Input label="Discount (%)" placeholder="0" value={discountValue} onChangeText={setDiscountValue} keyboardType="decimal-pad" /></View>
                <View style={styles.flex1}><Input label="Tax rate (%)" placeholder="0" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" /></View>
              </View>
              <View style={styles.totalsBreakdown}>
                <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalVal}>{fmt(totals.subtotal)}</Text></View>
                {totals.discountAmount > 0 ? <View style={styles.totalRow}><Text style={styles.totalLabel}>Discount</Text><Text style={[styles.totalVal, { color: Colors.success }]}>-{fmt(totals.discountAmount)}</Text></View> : null}
                {totals.taxAmount > 0 ? <View style={styles.totalRow}><Text style={styles.totalLabel}>Tax ({taxRate}%)</Text><Text style={styles.totalVal}>{fmt(totals.taxAmount)}</Text></View> : null}
                <View style={[styles.totalRow, styles.totalRowFinal]}><Text style={styles.totalFinalLabel}>Total</Text><Text style={styles.totalFinalVal}>{fmt(totals.total)}</Text></View>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Input label="Notes" placeholder="Thank you for your business!" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
            <Input label="Payment terms" placeholder="Payment due within 30 days..." value={terms} onChangeText={setTerms} multiline numberOfLines={2} />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button title={editingInvoice ? 'Save Changes' : 'Save Draft'} onPress={() => handleSave('draft')} variant="outline" style={styles.flex1} />
            <Button title={editingInvoice?.sentAt ? 'Save & Resend' : 'Send Invoice'} onPress={() => handleSave('pending')} loading={loading} style={styles.flex1} />
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { padding: 4 },
  headerTitle: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  aiBtnText: { ...Typography.buttonSm, color: Colors.primary, includeFontPadding: false },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  pickClient: { ...Typography.label, color: Colors.primary, includeFontPadding: false },
  clientPicker: { backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  clientPickerRow: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  clientPickerName: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  clientPickerCompany: { ...Typography.caption, color: Colors.textTertiary, includeFontPadding: false },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  itemsList: { gap: 10 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center' },
  addItemText: { ...Typography.label, color: Colors.primary, includeFontPadding: false },
  totalsCard: { gap: 12 },
  totalsBreakdown: { backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md, padding: Spacing.md, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRowFinal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
  totalVal: { ...Typography.body, color: Colors.text, includeFontPadding: false },
  totalFinalLabel: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  totalFinalVal: { ...Typography.title, color: Colors.primary, includeFontPadding: false },
  actions: { flexDirection: 'row', gap: 12 },
});
