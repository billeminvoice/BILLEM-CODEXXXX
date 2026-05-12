import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, ActivityIndicator, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { StatusBadge, Button } from '@/components';
import { pdfService } from '@/services/pdfService';
import { emailService } from '@/services/emailService';
import { Colors, Spacing, Typography, Radius, Shadow } from '@/constants/theme';
import type { Invoice } from '@/types';

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return d; }
};

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { invoices, markPaid, markSent, deleteInvoice } = useInvoices();
  const { businessProfile } = useAuth();
  const { showAlert } = useAlert();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) setInvoice(inv);
  }, [invoices, id]);

  if (!invoice) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><MaterialIcons name="arrow-back" size={22} color={Colors.text} /></Pressable>
        </View>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const handleGeneratePDF = async () => {
    setPdfLoading(true);
    try {
      await pdfService.generateAndShare(invoice, businessProfile);
    } catch (e: any) {
      showAlert('PDF Error', e.message || 'Could not generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice.clientEmail) {
      showAlert('No email', 'This invoice does not have a client email address. Please edit the invoice to add one.');
      return;
    }
    setEmailLoading(true);
    try {
      const result = await emailService.sendInvoice(invoice, businessProfile);
      if (result.sent) {
        await markSent(invoice.id);
        showAlert('Invoice sent!', `Email composed for ${invoice.clientEmail}. The payment link is included so they can pay online.`);
      } else {
        // Fallback: open mailto link
        const mailto = emailService.getMailtoLink(invoice, businessProfile);
        await Linking.openURL(mailto);
        await markSent(invoice.id);
      }
    } catch (e: any) {
      // Try mailto fallback on error
      try {
        const mailto = emailService.getMailtoLink(invoice, businessProfile);
        await Linking.openURL(mailto);
        await markSent(invoice.id);
      } catch {
        showAlert('Email Error', e.message || 'Could not send email.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleMarkPaid = () => {
    showAlert('Mark as paid', `Confirm payment received for ${fmt(invoice.total, invoice.currency)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Paid', onPress: () => markPaid(invoice.id) },
    ]);
  };

  const handleDelete = () => {
    showAlert('Delete invoice', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteInvoice(invoice.id); router.back(); } },
    ]);
  };

  const handlePaymentLink = () => {
    Linking.openURL(invoice.paymentLink).catch(() => {
      showAlert('Payment Link', invoice.paymentLink);
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{invoice.invoiceNumber}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push({ pathname: '/invoice/create', params: { id: invoice.id } })} style={styles.headerIconBtn} hitSlop={8}>
            <MaterialIcons name="edit" size={20} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.headerIconBtn} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <LinearGradient
          colors={
            invoice.status === 'paid'
              ? ['#ECFDF5', '#D1FAE5']
              : invoice.status === 'overdue'
              ? ['#FEF2F2', '#FEE2E2']
              : ['#EFF6FF', '#E0F2FE']
          }
          style={styles.statusBanner}
        >
          <View style={styles.statusRow}>
            <StatusBadge status={invoice.status} />
            <Text style={styles.totalAmount}>{fmt(invoice.total, invoice.currency)}</Text>
          </View>
          <Text style={styles.dueText}>
            {invoice.status === 'paid'
              ? `Paid on ${fmtDate(invoice.paidAt!)}`
              : `Due ${fmtDate(invoice.dueDate)}`}
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick actions row */}
          <View style={styles.quickActions}>
            <Pressable onPress={handleGeneratePDF} style={styles.quickBtn} disabled={pdfLoading}>
              {pdfLoading
                ? <ActivityIndicator size={20} color={Colors.primary} />
                : <MaterialIcons name="picture-as-pdf" size={20} color={Colors.primary} />}
              <Text style={styles.quickBtnText}>PDF</Text>
            </Pressable>
            <Pressable
              onPress={handleSendEmail}
              style={[styles.quickBtn, !invoice.clientEmail && styles.quickBtnDisabled]}
              disabled={emailLoading || !invoice.clientEmail}
            >
              {emailLoading
                ? <ActivityIndicator size={20} color={Colors.accent} />
                : <MaterialIcons name="email" size={20} color={!invoice.clientEmail ? Colors.textTertiary : Colors.accent} />}
              <Text style={[styles.quickBtnText, { color: !invoice.clientEmail ? Colors.textTertiary : Colors.accent }]}>
                {invoice.sentAt ? 'Resend' : 'Email'}
              </Text>
            </Pressable>
            <Pressable onPress={handlePaymentLink} style={styles.quickBtn}>
              <MaterialIcons name="link" size={20} color={Colors.success} />
              <Text style={[styles.quickBtnText, { color: Colors.success }]}>Pay Link</Text>
            </Pressable>
            {invoice.status !== 'paid' ? (
              <Pressable onPress={handleMarkPaid} style={styles.quickBtn}>
                <MaterialIcons name="check-circle-outline" size={20} color={Colors.text} />
                <Text style={styles.quickBtnText}>Mark Paid</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Payment link card */}
          <Pressable style={styles.payLinkCard} onPress={handlePaymentLink}>
            <View style={styles.payLinkIcon}>
              <MaterialIcons name="payment" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payLinkLabel}>Payment link — client can pay online</Text>
              <Text style={styles.payLinkUrl} numberOfLines={1}>{invoice.paymentLink}</Text>
            </View>
            <MaterialIcons name="open-in-new" size={16} color={Colors.primary} />
          </Pressable>

          {/* Client */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bill to</Text>
            <View style={styles.infoCard}>
              <Text style={styles.clientName}>{invoice.clientName}</Text>
              {invoice.clientEmail ? <Text style={styles.clientDetail}>{invoice.clientEmail}</Text> : null}
              {invoice.clientAddress ? <Text style={styles.clientDetail}>{invoice.clientAddress}</Text> : null}
            </View>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Invoice details</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}><Text style={styles.infoKey}>Invoice #</Text><Text style={styles.infoVal}>{invoice.invoiceNumber}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoKey}>Issue date</Text><Text style={styles.infoVal}>{fmtDate(invoice.issueDate)}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoKey}>Due date</Text><Text style={styles.infoVal}>{fmtDate(invoice.dueDate)}</Text></View>
              {invoice.sentAt ? <View style={styles.infoRow}><Text style={styles.infoKey}>Sent</Text><Text style={styles.infoVal}>{fmtDate(invoice.sentAt)}</Text></View> : null}
              {invoice.paidAt ? <View style={styles.infoRow}><Text style={styles.infoKey}>Paid</Text><Text style={[styles.infoVal, { color: Colors.success }]}>{fmtDate(invoice.paidAt)}</Text></View> : null}
            </View>
          </View>

          {/* Line items */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Line items</Text>
            <View style={styles.itemsCard}>
              {invoice.lineItems.map((item, i) => (
                <View key={item.id} style={[styles.lineItem, i < invoice.lineItems.length - 1 && styles.lineItemBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <Text style={styles.itemQtyRate}>{item.quantity} × {fmt(item.rate, invoice.currency)}</Text>
                  </View>
                  <Text style={styles.itemAmount}>{fmt(item.amount, invoice.currency)}</Text>
                </View>
              ))}
              <View style={styles.totalsSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalKey}>Subtotal</Text>
                  <Text style={styles.totalVal}>{fmt(invoice.subtotal, invoice.currency)}</Text>
                </View>
                {invoice.discountAmount > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalKey}>Discount</Text>
                    <Text style={[styles.totalVal, { color: Colors.success }]}>-{fmt(invoice.discountAmount, invoice.currency)}</Text>
                  </View>
                ) : null}
                {invoice.taxAmount > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalKey}>Tax ({invoice.taxRate}%)</Text>
                    <Text style={styles.totalVal}>{fmt(invoice.taxAmount, invoice.currency)}</Text>
                  </View>
                ) : null}
                <View style={[styles.totalRow, styles.totalFinalRow]}>
                  <Text style={styles.totalFinalKey}>Total</Text>
                  <Text style={styles.totalFinalVal}>{fmt(invoice.total, invoice.currency)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes */}
          {invoice.notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <View style={styles.infoCard}><Text style={styles.notesText}>{invoice.notes}</Text></View>
            </View>
          ) : null}

          {/* Bottom CTA */}
          <View style={styles.mainActions}>
            <Button
              title={pdfLoading ? 'Generating...' : 'Download PDF'}
              onPress={handleGeneratePDF}
              loading={pdfLoading}
              variant="outline"
              style={styles.flex1}
              icon={<MaterialIcons name="picture-as-pdf" size={16} color={Colors.primary} />}
            />
            {invoice.status !== 'paid' ? (
              <Button
                title={emailLoading ? 'Sending...' : invoice.status === 'draft' ? 'Send Invoice' : 'Resend'}
                onPress={handleSendEmail}
                loading={emailLoading}
                style={styles.flex1}
                icon={<MaterialIcons name={invoice.status === 'draft' ? 'send' : 'email'} size={16} color="#fff" />}
              />
            ) : null}
          </View>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.heading, color: Colors.text, includeFontPadding: false },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: { padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBanner: { padding: Spacing.xl, gap: 6 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalAmount: { ...Typography.hero, color: Colors.text, includeFontPadding: false },
  dueText: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
  content: { padding: Spacing.xl, gap: Spacing.lg },

  quickActions: {
    flexDirection: 'row', gap: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.sm, ...Shadow.sm,
  },
  quickBtn: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10,
    borderRadius: Radius.md, backgroundColor: Colors.surfaceSecondary,
  },
  quickBtnDisabled: { opacity: 0.4 },
  quickBtnText: { ...Typography.caption, color: Colors.primary, fontWeight: '600', includeFontPadding: false },

  payLinkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primaryLight, padding: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  payLinkIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center',
  },
  payLinkLabel: { ...Typography.label, color: Colors.primary, includeFontPadding: false },
  payLinkUrl: { ...Typography.caption, color: Colors.primary + 'CC', marginTop: 2, includeFontPadding: false },

  section: { gap: 10 },
  sectionLabel: {
    ...Typography.label, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8, includeFontPadding: false,
  },
  infoCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 6, ...Shadow.sm },
  clientName: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  clientDetail: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoKey: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
  infoVal: { ...Typography.body, color: Colors.text, fontWeight: '500', includeFontPadding: false },
  itemsCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  lineItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, gap: 12 },
  lineItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  itemDesc: { ...Typography.label, color: Colors.text, includeFontPadding: false },
  itemQtyRate: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2, includeFontPadding: false },
  itemAmount: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  totalsSection: { borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalKey: { ...Typography.body, color: Colors.textSecondary, includeFontPadding: false },
  totalVal: { ...Typography.body, color: Colors.text, includeFontPadding: false },
  totalFinalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 },
  totalFinalKey: { ...Typography.subheading, color: Colors.text, includeFontPadding: false },
  totalFinalVal: { ...Typography.heading, color: Colors.primary, includeFontPadding: false },
  notesText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24, includeFontPadding: false },
  mainActions: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
