import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Invoice, BusinessProfile } from '@/types';

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

const statusColors: Record<string, string> = {
  paid: '#10B981',
  pending: '#F59E0B',
  overdue: '#EF4444',
  draft: '#94A3B8',
  cancelled: '#64748B',
};

function buildInvoiceHtml(invoice: Invoice, profile: BusinessProfile | null): string {
  const statusColor = statusColors[invoice.status] || '#94A3B8';
  const businessName =
    profile?.businessName || profile?.ownerName || "Bill'em Invoice";
  const businessEmail = profile?.email || '';
  const businessPhone = profile?.phone || '';
  const businessAddress = [profile?.address, profile?.city, profile?.state, profile?.zipCode, profile?.country]
    .filter(Boolean)
    .join(', ');
  const taxId = profile?.taxId || '';

  const lineItemsHtml = invoice.lineItems
    .map(
      (li) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-size:14px;line-height:1.5">${li.description}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;color:#475569;font-size:14px;text-align:center">${li.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;color:#475569;font-size:14px;text-align:right">${fmt(li.rate, invoice.currency)}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-size:14px;text-align:right;font-weight:600">${fmt(li.amount, invoice.currency)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; background: #F8FAFC; color: #0F172A; }
    .page { max-width: 794px; margin: 0 auto; background: #fff; min-height: 1123px; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #818CF8 55%, #F472B6 100%); padding: 40px 48px; display: flex; justify-content: space-between; align-items: flex-start; }
    .biz-name { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .biz-detail { font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.6; }
    .inv-badge { background: rgba(255,255,255,0.2); border-radius: 12px; padding: 14px 22px; text-align: right; }
    .inv-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px; }
    .inv-number { font-size: 20px; font-weight: 700; color: #fff; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #fff; background: ${statusColor}; margin-top: 8px; }
    .meta { display: flex; padding: 28px 48px; gap: 40px; border-bottom: 1px solid #E2E8F0; background: #F8FAFC; }
    .meta-block { flex: 1; }
    .meta-label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
    .meta-val { font-size: 15px; font-weight: 600; color: #0F172A; }
    .meta-sub { font-size: 13px; color: #475569; margin-top: 2px; line-height: 1.5; }
    .total-hero { background: #EFF6FF; padding: 24px 48px; display: flex; align-items: center; justify-content: space-between; }
    .total-label { font-size: 13px; font-weight: 600; color: #3B82F6; text-transform: uppercase; letter-spacing: 0.8px; }
    .total-amount { font-size: 40px; font-weight: 800; color: #0F172A; margin-top: 4px; }
    .due-text { font-size: 14px; color: #475569; margin-top: 4px; }
    .pay-btn { background: linear-gradient(135deg, #3B82F6, #818CF8); color: #fff; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; text-decoration: none; display: inline-block; }
    .section { padding: 28px 48px; }
    .section-title { font-size: 12px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; }
    table.items { width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; }
    table.items th { background: #F8FAFC; padding: 10px 16px; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    table.items th:first-child { text-align: left; }
    table.items th:not(:first-child) { text-align: right; }
    table.items th:nth-child(2) { text-align: center; }
    .totals-row td { padding: 8px 16px; font-size: 14px; color: #475569; text-align: right; }
    .totals-row td:first-child { text-align: left; }
    .totals-final td { padding: 14px 16px; font-size: 16px; font-weight: 700; color: #0F172A; border-top: 2px solid #E2E8F0; text-align: right; }
    .totals-final td:first-child { text-align: left; }
    .totals-final .amount { color: #3B82F6; }
    .notes-box { background: #F8FAFC; border-radius: 10px; padding: 16px 20px; }
    .notes-text { font-size: 14px; color: #475569; line-height: 1.7; }
    .footer { background: #0F172A; padding: 28px 48px; text-align: center; margin-top: 40px; }
    .footer-text { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 8px; }
    @media print { body { background: #fff; } }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="biz-name">${businessName}</div>
      ${businessEmail ? `<div class="biz-detail">${businessEmail}</div>` : ''}
      ${businessPhone ? `<div class="biz-detail">${businessPhone}</div>` : ''}
      ${businessAddress ? `<div class="biz-detail">${businessAddress}</div>` : ''}
      ${taxId ? `<div class="biz-detail">Tax ID: ${taxId}</div>` : ''}
    </div>
    <div class="inv-badge">
      <div class="inv-label">Invoice</div>
      <div class="inv-number">${invoice.invoiceNumber}</div>
      <div class="status-badge">${invoice.status.toUpperCase()}</div>
    </div>
  </div>

  <!-- Meta row -->
  <div class="meta">
    <div class="meta-block">
      <div class="meta-label">Billed To</div>
      <div class="meta-val">${invoice.clientName}</div>
      ${invoice.clientEmail ? `<div class="meta-sub">${invoice.clientEmail}</div>` : ''}
      ${invoice.clientAddress ? `<div class="meta-sub">${invoice.clientAddress}</div>` : ''}
    </div>
    <div class="meta-block">
      <div class="meta-label">Issue Date</div>
      <div class="meta-val">${fmtDate(invoice.issueDate)}</div>
    </div>
    <div class="meta-block">
      <div class="meta-label">Due Date</div>
      <div class="meta-val">${fmtDate(invoice.dueDate)}</div>
      ${invoice.status === 'paid' && invoice.paidAt ? `<div class="meta-sub" style="color:#10B981;font-weight:600">Paid ${fmtDate(invoice.paidAt)}</div>` : ''}
    </div>
  </div>

  <!-- Total hero -->
  <div class="total-hero">
    <div>
      <div class="total-label">Amount Due</div>
      <div class="total-amount">${fmt(invoice.total, invoice.currency)}</div>
      <div class="due-text">Due ${fmtDate(invoice.dueDate)}</div>
    </div>
    <a href="${invoice.paymentLink}" class="pay-btn">Pay Now →</a>
  </div>

  <!-- Line items -->
  <div class="section">
    <div class="section-title">Line Items</div>
    <table class="items">
      <thead>
        <tr>
          <th style="text-align:left">Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
        ${invoice.discountAmount > 0 ? `
        <tr class="totals-row">
          <td colspan="3">Subtotal</td>
          <td>${fmt(invoice.subtotal, invoice.currency)}</td>
        </tr>
        <tr class="totals-row">
          <td colspan="3" style="color:#10B981">Discount${invoice.discountType === 'percent' ? ` (${invoice.discountValue}%)` : ''}</td>
          <td style="color:#10B981">-${fmt(invoice.discountAmount, invoice.currency)}</td>
        </tr>` : ''}
        ${invoice.taxAmount > 0 ? `
        <tr class="totals-row">
          <td colspan="3">Tax (${invoice.taxRate}%)</td>
          <td>${fmt(invoice.taxAmount, invoice.currency)}</td>
        </tr>` : ''}
        <tr class="totals-final">
          <td colspan="3">Total Due</td>
          <td class="amount">${fmt(invoice.total, invoice.currency)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${invoice.notes ? `
  <!-- Notes -->
  <div class="section" style="padding-top:0">
    <div class="section-title">Notes</div>
    <div class="notes-box">
      <div class="notes-text">${invoice.notes}</div>
    </div>
  </div>` : ''}

  ${invoice.terms ? `
  <div class="section" style="padding-top:0">
    <div class="section-title">Payment Terms</div>
    <div class="notes-box">
      <div class="notes-text">${invoice.terms}</div>
    </div>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <a href="${invoice.paymentLink}" style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#818CF8);color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none">
      Pay ${fmt(invoice.total, invoice.currency)} Securely
    </a>
    <div class="footer-text">Invoice ${invoice.invoiceNumber} · Generated by Bill'em Invoice</div>
    <div class="footer-text">Payment link: ${invoice.paymentLink}</div>
  </div>
</div>
</body>
</html>`;
}

export const pdfService = {
  generateAndShare: async (
    invoice: Invoice,
    profile: BusinessProfile | null
  ): Promise<void> => {
    const html = buildInvoiceHtml(invoice, profile);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice ${invoice.invoiceNumber}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Print.printAsync({ uri });
    }
  },

  print: async (invoice: Invoice, profile: BusinessProfile | null): Promise<void> => {
    const html = buildInvoiceHtml(invoice, profile);
    await Print.printAsync({ html });
  },

  generateHtml: (invoice: Invoice, profile: BusinessProfile | null): string => {
    return buildInvoiceHtml(invoice, profile);
  },
};
