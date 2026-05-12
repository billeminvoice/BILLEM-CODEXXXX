import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import * as MailComposer from 'expo-mail-composer';
import type { Invoice, BusinessProfile } from '@/types';

export interface EmailResult {
  sent: boolean;
  method: 'backend' | 'native' | 'link';
}

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export const emailService = {
  sendInvoice: async (
    invoice: Invoice,
    profile: BusinessProfile | null
  ): Promise<EmailResult> => {
    const supabase = getSupabaseClient();

    // Build email payload and get formatted HTML from edge function
    const { data, error } = await supabase.functions.invoke('send-invoice-email', {
      body: {
        clientEmail: invoice.clientEmail,
        clientName: invoice.clientName,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        paymentLink: invoice.paymentLink,
        businessName: profile?.businessName || profile?.ownerName || "Bill'em Invoice",
        businessEmail: profile?.email || '',
        lineItems: invoice.lineItems,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        notes: invoice.notes,
      },
    });

    if (error) {
      let errMsg = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const txt = await error.context?.text();
          const parsed = JSON.parse(txt || '{}');
          errMsg = parsed.error || txt || error.message;
        } catch {
          errMsg = error.message;
        }
      }
      throw new Error(errMsg);
    }

    const emailData = data?.data;

    if (emailData?.sent) {
      return { sent: true, method: 'backend' };
    }

    // Try native mail composer first
    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable && emailData) {
      await MailComposer.composeAsync({
        recipients: [invoice.clientEmail],
        subject: emailData.subject,
        body: `Hi ${invoice.clientName},\n\nPlease find your invoice ${invoice.invoiceNumber} for ${fmt(invoice.total, invoice.currency)} below.\n\n📎 Pay online: ${invoice.paymentLink}\n\nDue date: ${fmtDate(invoice.dueDate)}\n\nThank you for your business!\n\n${profile?.businessName || profile?.ownerName || "Bill'em Invoice"}`,
        isHtml: false,
      });
      return { sent: true, method: 'native' };
    }

    // Fallback to mailto link
    return { sent: false, method: 'link' };
  },

  getMailtoLink: (invoice: Invoice, profile: BusinessProfile | null): string => {
    const subject = encodeURIComponent(
      `Invoice ${invoice.invoiceNumber} — ${fmt(invoice.total, invoice.currency)}`
    );
    const body = encodeURIComponent(
      `Hi ${invoice.clientName},\n\nPlease find your invoice ${invoice.invoiceNumber} for ${fmt(invoice.total, invoice.currency)}.\n\n✅ Pay securely online: ${invoice.paymentLink}\n\nDue: ${fmtDate(invoice.dueDate)}\n\nThank you!\n${profile?.businessName || profile?.ownerName || "Bill'em Invoice"}`
    );
    return `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`;
  },
};
