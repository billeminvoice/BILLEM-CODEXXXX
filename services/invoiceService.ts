import { storage } from './storageService';
import { PLANS, STORAGE_KEYS } from '@/constants/config';
import { paymentService } from './paymentService';
import type { AppSettings, BusinessProfile, Invoice, LineItem, InvoiceStatus, User } from '@/types';

const generateId = () => `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const generateItemId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const calcTotals = (
  items: LineItem[],
  taxRate: number,
  discountType: 'percent' | 'fixed',
  discountValue: number
) => {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const discountAmount =
    discountType === 'percent' ? (subtotal * discountValue) / 100 : discountValue;
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * taxRate) / 100;
  const total = taxable + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
};

export const invoiceService = {
  getAll: async (): Promise<Invoice[]> => {
    const data = await storage.get<Invoice[]>(STORAGE_KEYS.INVOICES);
    return (data || []).map((inv) => {
      if (inv.status === 'pending' && new Date(inv.dueDate) < new Date() && !inv.paidAt) {
        return { ...inv, status: 'overdue' as InvoiceStatus };
      }
      return inv;
    });
  },

  getById: async (id: string): Promise<Invoice | null> => {
    const all = await invoiceService.getAll();
    return all.find((i) => i.id === id) || null;
  },

  create: async (data: Partial<Invoice>): Promise<Invoice> => {
    const all = await invoiceService.getAll();
    const user = await storage.get<User>(STORAGE_KEYS.AUTH_USER);
    const plan = PLANS[user?.planId || 'free'];
    if (plan.invoicesPerMonth !== -1) {
      const month = new Date().toISOString().slice(0, 7);
      const createdThisMonth = all.filter((invoice) => invoice.createdAt.slice(0, 7) === month).length;
      if (createdThisMonth >= plan.invoicesPerMonth) {
        throw new Error(`Your ${plan.name} plan includes ${plan.invoicesPerMonth} invoices/month. Upgrade to create unlimited invoices.`);
      }
    }

    const profile = await storage.get<BusinessProfile>(STORAGE_KEYS.BUSINESS_PROFILE);
    const settings = (await storage.get<AppSettings>(STORAGE_KEYS.SETTINGS)) || {
      defaultGateway: 'stripe',
      platformFeePercent: '0',
      instantPayoutsEnabled: false,
      emailNotifications: true,
      pushNotifications: true,
      invoiceReminders: true,
      darkMode: false,
      weeklyDigest: true,
      marketingEmails: false,
      paymentAlerts: true,
      overdueAlerts: true,
    };
    const prefix = profile?.invoicePrefix || 'INV';
    const num = profile?.nextInvoiceNumber || 1001;
    const invoiceNumber = `${prefix}-${String(num).padStart(4, '0')}`;
    const id = generateId();

    if (profile) {
      await storage.set(STORAGE_KEYS.BUSINESS_PROFILE, { ...profile, nextInvoiceNumber: num + 1 });
    }

    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 30);

    const items: LineItem[] = (data.lineItems || []).map((i) => ({
      ...i,
      id: i.id || generateItemId(),
      amount: i.quantity * i.rate,
    }));

    const { subtotal, discountAmount, taxAmount, total } = calcTotals(
      items,
      data.taxRate || 0,
      data.discountType || 'percent',
      data.discountValue || 0
    );

    const invoice: Invoice = {
      id,
      invoiceNumber,
      status: data.status || 'draft',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      clientEmail: data.clientEmail || '',
      clientAddress: data.clientAddress || '',
      issueDate: data.issueDate || now.toISOString().split('T')[0],
      dueDate: data.dueDate || due.toISOString().split('T')[0],
      lineItems: items,
      subtotal,
      taxRate: data.taxRate || 0,
      taxAmount,
      discountType: data.discountType || 'percent',
      discountValue: data.discountValue || 0,
      discountAmount,
      total,
      notes: data.notes || '',
      terms: data.terms || 'Payment is due within the specified payment terms.',
      currency: data.currency || 'USD',
      paymentLink: paymentService.buildFallbackPaymentLink(id),
      paidAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      sentAt: null,
      isRecurring: data.isRecurring || false,
      recurringInterval: data.recurringInterval || null,
    };

    invoice.paymentLink = await paymentService.createInvoicePaymentLink({
      invoice,
      profile,
      settings,
    });

    all.unshift(invoice);
    await storage.set(STORAGE_KEYS.INVOICES, all);
    return invoice;
  },

  update: async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    const all = await invoiceService.getAll();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Invoice not found');

    const items = (updates.lineItems || all[idx].lineItems).map((i) => ({
      ...i,
      amount: i.quantity * i.rate,
    }));
    const taxRate = updates.taxRate !== undefined ? updates.taxRate : all[idx].taxRate;
    const discountType = updates.discountType || all[idx].discountType;
    const discountValue = updates.discountValue !== undefined ? updates.discountValue : all[idx].discountValue;
    const { subtotal, discountAmount, taxAmount, total } = calcTotals(items, taxRate, discountType, discountValue);

    const updated: Invoice = {
      ...all[idx],
      ...updates,
      lineItems: items,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      updatedAt: new Date().toISOString(),
    };
    if (
      updates.lineItems ||
      updates.taxRate !== undefined ||
      updates.discountType ||
      updates.discountValue !== undefined ||
      updates.clientEmail ||
      updates.clientName
    ) {
      const [profile, settings] = await Promise.all([
        storage.get<BusinessProfile>(STORAGE_KEYS.BUSINESS_PROFILE),
        storage.get<AppSettings>(STORAGE_KEYS.SETTINGS),
      ]);
      updated.paymentLink = await paymentService.createInvoicePaymentLink({
        invoice: updated,
        profile,
        settings: settings || {
          defaultGateway: 'stripe',
          platformFeePercent: '0',
          instantPayoutsEnabled: false,
          emailNotifications: true,
          pushNotifications: true,
          invoiceReminders: true,
          darkMode: false,
          weeklyDigest: true,
          marketingEmails: false,
          paymentAlerts: true,
          overdueAlerts: true,
        },
      });
    }
    all[idx] = updated;
    await storage.set(STORAGE_KEYS.INVOICES, all);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const all = await invoiceService.getAll();
    await storage.set(STORAGE_KEYS.INVOICES, all.filter((i) => i.id !== id));
  },

  markPaid: async (id: string): Promise<Invoice> => {
    return invoiceService.update(id, { status: 'paid', paidAt: new Date().toISOString() });
  },

  markSent: async (id: string): Promise<Invoice> => {
    return invoiceService.update(id, { status: 'pending', sentAt: new Date().toISOString() });
  },

  getStats: async () => {
    const all = await invoiceService.getAll();
    const revenue = all.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const unpaid = all.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.total, 0);
    const overdue = all.filter((i) => i.status === 'overdue').length;
    const thisMonth = all.filter((i) => {
      const d = new Date(i.createdAt);
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    });
    return { revenue, unpaid, overdue, totalInvoices: all.length, thisMonthCount: thisMonth.length };
  },

  newLineItem: (): LineItem => ({
    id: generateItemId(),
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0,
  }),
};
